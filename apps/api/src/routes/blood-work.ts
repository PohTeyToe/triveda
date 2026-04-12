/**
 * Blood work routes.
 *
 * POST /                 Upload a lab report (creates job, stores file, returns mock results)
 * GET  /:jobId           Poll job status
 * GET  /report/:reportId Full report with biomarkers and tradition context
 * GET  /history          List all user reports
 * DELETE /report/:reportId Delete a report (cascades to biomarkers + review queue)
 * PATCH /biomarker/:id   Manual correction of a biomarker value
 */

import { bloodWorkBiomarkers, bloodWorkReports } from '@triveda/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { BIOMARKER_TRADITION_CONTEXT } from '../workers/blood-work/canonical-schema.js';
import { getMockBiomarkers } from '../workers/blood-work/mock-extraction.js';
import { getDb } from './helpers/db.js';

type AppEnv = { Variables: { user: AuthUser } };

const bloodWork = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// POST / -- Upload a lab report
// ---------------------------------------------------------------------------

bloodWork.post('/', async (c) => {
  const user = c.get('user');
  const db = getDb();

  // Parse multipart form data
  const body = await c.req.parseBody();
  const file = body.file;

  if (!file || typeof file === 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'A file is required in the "file" field');
  }

  const fileName = file.name;
  const fileSize = file.size;

  // Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Only PDF, JPEG, and PNG files are accepted. HEIC format is not supported.',
    );
  }

  // Validate file size (max 20MB)
  const MAX_SIZE = 20 * 1024 * 1024;
  if (fileSize > MAX_SIZE) {
    throw new AppError(400, 'VALIDATION_ERROR', 'File must be under 20 MB');
  }

  // Generate a job ID
  const jobId = crypto.randomUUID();

  // Create the report row with status=processing (mock pipeline completes instantly)
  const [report] = await db
    .insert(bloodWorkReports)
    .values({
      user_id: user.id,
      job_id: jobId,
      file_name: fileName,
      file_size_bytes: fileSize,
      status: 'processing',
      stage: 'extracting_text',
      started_at: new Date(),
    })
    .returning({ id: bloodWorkReports.id });

  if (!report) {
    throw new AppError(500, 'INTERNAL_ERROR', 'Failed to create report');
  }

  // Mock extraction: insert fixture biomarkers directly
  const mockBiomarkers = getMockBiomarkers();

  for (const bm of mockBiomarkers) {
    await db.insert(bloodWorkBiomarkers).values({
      report_id: report.id,
      canonical_key: bm.canonicalKey,
      display_name: bm.displayName,
      value: String(bm.value),
      unit: bm.unit,
      original_unit: bm.originalUnit,
      reference_range_low: bm.referenceRangeLow != null ? String(bm.referenceRangeLow) : null,
      reference_range_high: bm.referenceRangeHigh != null ? String(bm.referenceRangeHigh) : null,
      flag: bm.flag,
      confidence: String(bm.confidence),
      loinc_code: bm.loincCode,
    });
  }

  // Mark report as complete
  await db
    .update(bloodWorkReports)
    .set({
      status: 'complete',
      stage: null,
      vendor: 'unknown',
      extraction_method: 'text',
      page_count: 3,
      processed_at: new Date(),
    })
    .where(eq(bloodWorkReports.id, report.id));

  return c.json({ jobId, reportId: report.id });
});

// ---------------------------------------------------------------------------
// GET /:jobId -- Poll job status
// ---------------------------------------------------------------------------

bloodWork.get('/:jobId', async (c) => {
  const user = c.get('user');
  const jobId = c.req.param('jobId');
  const db = getDb();

  const [report] = await db
    .select()
    .from(bloodWorkReports)
    .where(and(eq(bloodWorkReports.job_id, jobId), eq(bloodWorkReports.user_id, user.id)))
    .limit(1);

  if (!report) {
    throw new AppError(404, 'NOT_FOUND', 'Report not found');
  }

  // Stale job detection: if processing for > 5 minutes, mark as failed
  if (
    report.status === 'processing' &&
    report.started_at &&
    Date.now() - new Date(report.started_at).getTime() > 5 * 60 * 1000
  ) {
    await db
      .update(bloodWorkReports)
      .set({
        status: 'failed',
        error_message: 'Processing timed out. Please try uploading again.',
      })
      .where(eq(bloodWorkReports.id, report.id));

    return c.json({
      id: report.id,
      jobId: report.job_id,
      status: 'failed' as const,
      stage: report.stage,
      fileName: report.file_name,
      vendor: report.vendor,
      biomarkerCount: 0,
      errorMessage: 'Processing timed out. Please try uploading again.',
      uploadedAt: report.uploaded_at?.toISOString() ?? '',
    });
  }

  // Count biomarkers for this report
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bloodWorkBiomarkers)
    .where(eq(bloodWorkBiomarkers.report_id, report.id));

  return c.json({
    id: report.id,
    jobId: report.job_id,
    status: report.status,
    stage: report.stage,
    fileName: report.file_name,
    vendor: report.vendor,
    biomarkerCount: Number(countResult?.count ?? 0),
    errorMessage: report.error_message,
    uploadedAt: report.uploaded_at?.toISOString() ?? '',
  });
});

// ---------------------------------------------------------------------------
// GET /report/:reportId -- Full report with biomarkers + tradition context
// ---------------------------------------------------------------------------

bloodWork.get('/report/:reportId', async (c) => {
  const user = c.get('user');
  const reportId = c.req.param('reportId');
  const db = getDb();

  const [report] = await db
    .select()
    .from(bloodWorkReports)
    .where(and(eq(bloodWorkReports.id, reportId), eq(bloodWorkReports.user_id, user.id)))
    .limit(1);

  if (!report) {
    throw new AppError(404, 'NOT_FOUND', 'Report not found');
  }

  const biomarkers = await db
    .select()
    .from(bloodWorkBiomarkers)
    .where(eq(bloodWorkBiomarkers.report_id, report.id));

  // Attach tradition context to each biomarker
  const biomarkersWithContext = biomarkers.map((bm) => ({
    id: bm.id,
    canonicalKey: bm.canonical_key,
    displayName: bm.display_name,
    value: Number(bm.value),
    unit: bm.unit,
    originalUnit: bm.original_unit,
    referenceRangeLow: bm.reference_range_low != null ? Number(bm.reference_range_low) : null,
    referenceRangeHigh: bm.reference_range_high != null ? Number(bm.reference_range_high) : null,
    flag: bm.flag,
    confidence: Number(bm.confidence),
    loincCode: bm.loinc_code,
    extractionNotes: bm.extraction_notes,
    manuallyCorrected: bm.manually_corrected,
    correctedAt: bm.corrected_at?.toISOString() ?? null,
    traditionContext: BIOMARKER_TRADITION_CONTEXT[bm.canonical_key] ?? null,
  }));

  return c.json({
    id: report.id,
    jobId: report.job_id,
    status: report.status,
    vendor: report.vendor,
    fileName: report.file_name,
    fileSizeBytes: report.file_size_bytes,
    pageCount: report.page_count,
    extractionMethod: report.extraction_method,
    foodInfluences: report.food_influences,
    uploadedAt: report.uploaded_at?.toISOString() ?? '',
    processedAt: report.processed_at?.toISOString() ?? null,
    biomarkers: biomarkersWithContext,
  });
});

// ---------------------------------------------------------------------------
// GET /history -- List all user reports
// ---------------------------------------------------------------------------

bloodWork.get('/history/list', async (c) => {
  const user = c.get('user');
  const db = getDb();

  const reports = await db
    .select({
      id: bloodWorkReports.id,
      job_id: bloodWorkReports.job_id,
      vendor: bloodWorkReports.vendor,
      status: bloodWorkReports.status,
      file_name: bloodWorkReports.file_name,
      uploaded_at: bloodWorkReports.uploaded_at,
      error_message: bloodWorkReports.error_message,
    })
    .from(bloodWorkReports)
    .where(eq(bloodWorkReports.user_id, user.id))
    .orderBy(desc(bloodWorkReports.uploaded_at));

  // Get biomarker counts per report
  const result = [];
  for (const report of reports) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bloodWorkBiomarkers)
      .where(eq(bloodWorkBiomarkers.report_id, report.id));

    result.push({
      id: report.id,
      jobId: report.job_id,
      vendor: report.vendor,
      status: report.status,
      fileName: report.file_name,
      biomarkerCount: Number(countResult?.count ?? 0),
      uploadedAt: report.uploaded_at?.toISOString() ?? '',
      errorMessage: report.error_message,
    });
  }

  return c.json({ reports: result });
});

// ---------------------------------------------------------------------------
// DELETE /report/:reportId -- Delete a report (cascades)
// ---------------------------------------------------------------------------

bloodWork.delete('/report/:reportId', async (c) => {
  const user = c.get('user');
  const reportId = c.req.param('reportId');
  const db = getDb();

  // Verify ownership
  const [report] = await db
    .select({ id: bloodWorkReports.id })
    .from(bloodWorkReports)
    .where(and(eq(bloodWorkReports.id, reportId), eq(bloodWorkReports.user_id, user.id)))
    .limit(1);

  if (!report) {
    throw new AppError(404, 'NOT_FOUND', 'Report not found');
  }

  // Delete the report row (ON DELETE CASCADE handles biomarkers + review queue)
  await db.delete(bloodWorkReports).where(eq(bloodWorkReports.id, reportId));

  return c.json({ deleted: true });
});

// ---------------------------------------------------------------------------
// PATCH /biomarker/:id -- Manual correction
// ---------------------------------------------------------------------------

bloodWork.patch('/biomarker/:id', async (c) => {
  const user = c.get('user');
  const biomarkerId = c.req.param('id');
  const db = getDb();
  const body = await c.req.json();

  const { value, unit } = body as { value: number; unit: string };

  if (typeof value !== 'number' || typeof unit !== 'string') {
    throw new AppError(400, 'VALIDATION_ERROR', 'value (number) and unit (string) are required');
  }

  // Verify the biomarker belongs to a report owned by this user
  const [biomarker] = await db
    .select({
      id: bloodWorkBiomarkers.id,
      report_id: bloodWorkBiomarkers.report_id,
    })
    .from(bloodWorkBiomarkers)
    .where(eq(bloodWorkBiomarkers.id, biomarkerId))
    .limit(1);

  if (!biomarker) {
    throw new AppError(404, 'NOT_FOUND', 'Biomarker not found');
  }

  // Verify ownership through the report
  const [report] = await db
    .select({ id: bloodWorkReports.id })
    .from(bloodWorkReports)
    .where(and(eq(bloodWorkReports.id, biomarker.report_id), eq(bloodWorkReports.user_id, user.id)))
    .limit(1);

  if (!report) {
    throw new AppError(403, 'FORBIDDEN', 'Not authorized to modify this biomarker');
  }

  await db
    .update(bloodWorkBiomarkers)
    .set({
      value: String(value),
      unit,
      manually_corrected: true,
      corrected_at: new Date(),
    })
    .where(eq(bloodWorkBiomarkers.id, biomarkerId));

  return c.json({ updated: true });
});

export { bloodWork };
