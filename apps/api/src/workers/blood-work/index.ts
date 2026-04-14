/**
 * Worker entry point.
 *
 * Usage (CLI):
 *   bun run apps/api/src/workers/blood-work/index.ts --job-id <uuid> --file <path>
 *
 * In-process callers should import `processBloodWorkJob` directly from
 * ./pipeline.js instead of spawning a subprocess.
 */

import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { getDb } from '@triveda/db';
import { bloodWorkReports } from '@triveda/db';
import { eq } from 'drizzle-orm';
import { processBloodWorkJob } from './pipeline.js';

function detectFileType(path: string): 'application/pdf' | 'image/jpeg' | 'image/png' {
  const lower = path.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  return 'application/pdf';
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      'job-id': { type: 'string' },
      file: { type: 'string' },
    },
  });

  const jobId = values['job-id'];
  const file = values.file;
  if (!jobId || !file) {
    // eslint-disable-next-line no-console
    console.error('Usage: --job-id <uuid> --file <path>');
    process.exit(2);
  }

  const db = getDb();
  const [report] = await db
    .select({ id: bloodWorkReports.id, user_id: bloodWorkReports.user_id })
    .from(bloodWorkReports)
    .where(eq(bloodWorkReports.job_id, jobId))
    .limit(1);

  if (!report) {
    // eslint-disable-next-line no-console
    console.error('No blood work report for job_id', jobId);
    process.exit(1);
  }

  const fileBuffer = new Uint8Array(await readFile(file));
  const fileType = detectFileType(file);

  const result = await processBloodWorkJob({
    reportId: report.id,
    userId: report.user_id,
    fileBuffer,
    fileType,
    db,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result));
  process.exit(result.status === 'complete' ? 0 : 1);
}

if (import.meta.main) {
  await main();
}
