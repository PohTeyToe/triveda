/**
 * Blood-work processing pipeline (pure function, callable in-process).
 *
 * Stages:
 *   1. validate / short-circuit (image → vision path)
 *   2. text extraction (unpdf)
 *   3. vendor detection
 *   4. biomarker parsing + normalization
 *   5. vision fallback (if text density too low or too few biomarkers)
 *   6. confidence scoring + review-queue routing
 *   7. food-influence resolution
 *   8. write results (biomarkers, review queue, report update)
 */

import { bloodWorkBiomarkers, bloodWorkReports, bloodWorkReviewQueue } from '@triveda/db';
import type { DbClient } from '@triveda/db';
import { eq } from 'drizzle-orm';
import type { NormalizedBiomarker } from './canonical-schema.js';
import {
  CONFIDENCE_THRESHOLD,
  type ExtractionMethod,
  type VisionMediaType,
  computeConfidence,
  shouldRouteToReview,
} from './confidence.js';
import { detectVendor } from './detect-vendor.js';
import {
  PasswordProtectedError,
  UnreadablePdfError,
  extractPdfText,
  isTextSufficient,
  parseBiomarkersByPage,
} from './extract-text.js';
import { resolveFoodInfluences } from './food-influence.js';
import { getNormalizer } from './normalizers/index.js';
import { redactPhi } from './redact-phi.js';
import type { ExtractionMethod as DbExtractionMethod, ReportStatus, VendorType } from './types.js';
import { VisionExtractionError, extractViaVision } from './vision-fallback.js';

export interface ProcessJobInput {
  reportId: string;
  userId: string;
  fileBuffer: Uint8Array;
  fileType: 'application/pdf' | 'image/jpeg' | 'image/png';
  db: DbClient;
  anthropicApiKey?: string;
  /** Injected for tests. */
  visionFetchImpl?: typeof fetch;
  /** Forcibly skip vision even if text extraction fails (tests). */
  disableVision?: boolean;
  /** Optional telemetry emitter — receives redacted payloads only. */
  emitTelemetry?: (event: string, payload: Record<string, unknown>) => void;
}

export interface ProcessJobResult {
  status: ReportStatus;
  vendor: VendorType;
  biomarkerCount: number;
  extractionMethod: DbExtractionMethod | null;
  errorMessage: string | null;
  pageCount: number | null;
}

const ERROR_MESSAGES = {
  unreadable: 'This PDF could not be read. Please try re-downloading it from your lab portal.',
  password: 'This PDF is password-protected. Please unlock it and re-upload.',
  notLabReport:
    "This doesn't appear to be a lab report. Please upload a PDF from your healthcare provider.",
  visionFailed: 'Processing failed. Please try again in a few minutes.',
  generic: 'An unexpected error occurred. Please try again.',
} as const;

function emit(
  cb: ProcessJobInput['emitTelemetry'],
  event: string,
  payload: Record<string, unknown>,
): void {
  if (!cb) return;
  cb(event, redactPhi(payload) as Record<string, unknown>);
}

async function updateStage(db: DbClient, reportId: string, stage: string): Promise<void> {
  await db.update(bloodWorkReports).set({ stage }).where(eq(bloodWorkReports.id, reportId));
}

async function markStarted(db: DbClient, reportId: string): Promise<void> {
  await db
    .update(bloodWorkReports)
    .set({ status: 'processing', stage: 'extracting_text', started_at: new Date() })
    .where(eq(bloodWorkReports.id, reportId));
}

async function markFailed(db: DbClient, reportId: string, message: string): Promise<void> {
  await db
    .update(bloodWorkReports)
    .set({ status: 'failed', error_message: message, stage: null })
    .where(eq(bloodWorkReports.id, reportId));
}

interface ExtractOutcome {
  vendor: VendorType;
  biomarkers: NormalizedBiomarker[];
  method: ExtractionMethod;
  visionMediaType: VisionMediaType | null;
  pageCount: number | null;
}

async function runExtraction(input: ProcessJobInput): Promise<ExtractOutcome> {
  const { fileBuffer, fileType, anthropicApiKey, disableVision, visionFetchImpl } = input;

  // Image path always goes to vision.
  if (fileType === 'image/jpeg' || fileType === 'image/png') {
    if (disableVision || !anthropicApiKey) {
      throw new VisionExtractionError('Vision path unavailable for image upload');
    }
    const { biomarkers, vendor } = await extractViaVision(fileBuffer, fileType, {
      apiKey: anthropicApiKey,
      fetchImpl: visionFetchImpl,
    });
    return { vendor, biomarkers, method: 'vision', visionMediaType: fileType, pageCount: null };
  }

  // PDF path: try text first.
  const extracted = await extractPdfText(fileBuffer);
  const pageCount = extracted.meta.pageCount;
  const textSufficient = isTextSufficient(extracted.pages);

  if (textSufficient) {
    const firstPage = extracted.pages[0] ?? '';
    const vendor = detectVendor(firstPage);
    const rawRows = parseBiomarkersByPage(extracted.pages, vendor);
    const normalizer = getNormalizer(vendor);
    const normalized: NormalizedBiomarker[] = [];
    for (const raw of rawRows) {
      const n = normalizer.normalize(raw);
      if (n) normalized.push(n);
    }

    // Hybrid path: if extraction produced <5 biomarkers on a 10+ page report,
    // also try vision and merge. Text entries win on key collision.
    const needHybrid = normalized.length < 5 && pageCount >= 10;
    if (needHybrid && !disableVision && anthropicApiKey) {
      try {
        const vision = await extractViaVision(fileBuffer, 'application/pdf', {
          apiKey: anthropicApiKey,
          fetchImpl: visionFetchImpl,
        });
        const haveKeys = new Set(normalized.map((b) => b.canonicalKey));
        for (const vb of vision.biomarkers) {
          if (!haveKeys.has(vb.canonicalKey)) normalized.push(vb);
        }
        return {
          vendor: vendor === 'unknown' ? vision.vendor : vendor,
          biomarkers: normalized,
          method: 'text' as ExtractionMethod,
          visionMediaType: null,
          pageCount,
        };
      } catch {
        // Fall through — keep text-only.
      }
    }

    return { vendor, biomarkers: normalized, method: 'text', visionMediaType: null, pageCount };
  }

  // Not enough text — vision fallback.
  if (disableVision || !anthropicApiKey) {
    throw new VisionExtractionError('Vision fallback required but unavailable');
  }
  const { biomarkers, vendor } = await extractViaVision(fileBuffer, 'application/pdf', {
    apiKey: anthropicApiKey,
    fetchImpl: visionFetchImpl,
  });
  return {
    vendor,
    biomarkers,
    method: 'vision',
    visionMediaType: 'application/pdf',
    pageCount,
  };
}

export async function processBloodWorkJob(input: ProcessJobInput): Promise<ProcessJobResult> {
  const { db, reportId, userId } = input;
  emit(input.emitTelemetry, 'blood_work.start', { reportId, userId, fileType: input.fileType });

  try {
    await markStarted(db, reportId);

    // Stage 1: extraction.
    const extraction = await runExtraction(input);
    await updateStage(db, reportId, 'detecting_vendor');
    emit(input.emitTelemetry, 'blood_work.extracted', {
      reportId,
      method: extraction.method,
      vendor: extraction.vendor,
      biomarker_count: extraction.biomarkers.length,
      page_count: extraction.pageCount ?? 0,
    });

    if (extraction.biomarkers.length === 0) {
      await markFailed(db, reportId, ERROR_MESSAGES.notLabReport);
      return {
        status: 'failed',
        vendor: extraction.vendor,
        biomarkerCount: 0,
        extractionMethod: null,
        errorMessage: ERROR_MESSAGES.notLabReport,
        pageCount: extraction.pageCount,
      };
    }

    // Stage 2: confidence scoring.
    await updateStage(db, reportId, 'mapping_biomarkers');
    const confidenceScored = extraction.biomarkers.map((b) => ({
      biomarker: b,
      confidence: computeConfidence(b, extraction.method, extraction.visionMediaType ?? undefined),
    }));

    // Stage 3: food influences.
    await updateStage(db, reportId, 'computing_influences');
    const foodInfluences = await resolveFoodInfluences(
      confidenceScored.map((e) => e.biomarker),
      db,
    );

    // Stage 4: write results.
    await updateStage(db, reportId, 'writing_results');
    const reviewRowsPayload: Array<{ biomarkerId: string; reason: string }> = [];

    for (const { biomarker, confidence } of confidenceScored) {
      const [inserted] = await db
        .insert(bloodWorkBiomarkers)
        .values({
          report_id: reportId,
          canonical_key: biomarker.canonicalKey,
          display_name: biomarker.displayName,
          value: String(biomarker.value),
          unit: biomarker.unit,
          original_unit: biomarker.originalUnit,
          reference_range_low:
            biomarker.referenceRangeLow != null ? String(biomarker.referenceRangeLow) : null,
          reference_range_high:
            biomarker.referenceRangeHigh != null ? String(biomarker.referenceRangeHigh) : null,
          flag: biomarker.flag,
          confidence: String(confidence),
          loinc_code: biomarker.loincCode,
        })
        .returning({ id: bloodWorkBiomarkers.id });

      const routeReason = shouldRouteToReview(biomarker, confidence);
      if (routeReason && inserted) {
        reviewRowsPayload.push({ biomarkerId: inserted.id, reason: routeReason });
      }
    }

    // Insert review queue rows (if any).
    for (const rr of reviewRowsPayload) {
      await db.insert(bloodWorkReviewQueue).values({
        biomarker_id: rr.biomarkerId,
        report_id: reportId,
        reason: rr.reason,
      });
    }

    // Final report update.
    await db
      .update(bloodWorkReports)
      .set({
        status: 'complete',
        stage: null,
        vendor: extraction.vendor,
        extraction_method: extraction.method,
        page_count: extraction.pageCount,
        food_influences: foodInfluences as unknown as Record<string, unknown>,
        processed_at: new Date(),
      })
      .where(eq(bloodWorkReports.id, reportId));

    emit(input.emitTelemetry, 'blood_work.complete', {
      reportId,
      vendor: extraction.vendor,
      method: extraction.method,
      biomarker_count: extraction.biomarkers.length,
      review_count: reviewRowsPayload.length,
    });

    return {
      status: 'complete',
      vendor: extraction.vendor,
      biomarkerCount: extraction.biomarkers.length,
      extractionMethod: extraction.method,
      errorMessage: null,
      pageCount: extraction.pageCount,
    };
  } catch (err) {
    const message = mapErrorToMessage(err);
    await markFailed(db, reportId, message);
    emit(input.emitTelemetry, 'blood_work.failed', { reportId, message });
    return {
      status: 'failed',
      vendor: 'unknown',
      biomarkerCount: 0,
      extractionMethod: null,
      errorMessage: message,
      pageCount: null,
    };
  }
}

function mapErrorToMessage(err: unknown): string {
  if (err instanceof PasswordProtectedError) return ERROR_MESSAGES.password;
  if (err instanceof UnreadablePdfError) return ERROR_MESSAGES.unreadable;
  if (err instanceof VisionExtractionError) return ERROR_MESSAGES.visionFailed;
  return ERROR_MESSAGES.generic;
}

export { ERROR_MESSAGES, CONFIDENCE_THRESHOLD };
