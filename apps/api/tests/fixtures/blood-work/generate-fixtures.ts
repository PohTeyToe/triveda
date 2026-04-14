/**
 * Synthetic PDF fixture generator for blood work tests.
 *
 * Uses pdf-lib to produce reproducible lab report PDFs with known
 * biomarker values. All values are synthetic — NO real patient data.
 *
 * Run with: bun run apps/api/tests/fixtures/blood-work/generate-fixtures.ts
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const FIXTURES_DIR = join(
  import.meta.dir ?? new URL('.', import.meta.url).pathname.replace(/^\//, ''),
);

interface BiomarkerRow {
  name: string;
  value: string;
  unit: string;
  range: string;
  flag?: 'H' | 'L' | '';
}

interface LabFixtureSpec {
  filename: string;
  header: string;
  subheader: string;
  patientLine: string;
  rows: BiomarkerRow[];
}

const LIFELABS_FIXTURE: LabFixtureSpec = {
  filename: 'lifelabs-sample.pdf',
  header: 'LifeLabs',
  subheader: 'Comprehensive Metabolic Panel',
  patientLine: 'Patient: DEMO USER  DOB: 1990-01-01  Report Date: 2026-04-12',
  rows: [
    { name: 'Glucose, Fasting', value: '5.2', unit: 'mmol/L', range: '3.3 - 5.5' },
    { name: 'HbA1c', value: '5.4', unit: '%', range: '4.0 - 5.6' },
    { name: 'LDL Cholesterol', value: '3.8', unit: 'mmol/L', range: '< 3.4', flag: 'H' },
    { name: 'HDL Cholesterol', value: '1.1', unit: 'mmol/L', range: '> 1.0' },
    { name: 'Total Cholesterol', value: '5.8', unit: 'mmol/L', range: '< 5.2', flag: 'H' },
    { name: 'Triglycerides', value: '1.4', unit: 'mmol/L', range: '< 1.7' },
    { name: 'TSH', value: '2.1', unit: 'mIU/L', range: '0.4 - 4.0' },
    { name: 'Ferritin', value: '18', unit: 'ug/L', range: '20 - 200', flag: 'L' },
    { name: '25-OH Vitamin D', value: '42', unit: 'nmol/L', range: '75 - 250', flag: 'L' },
    { name: 'Vitamin B12', value: '310', unit: 'pmol/L', range: '145 - 600' },
    { name: 'hs-CRP', value: '3.2', unit: 'mg/L', range: '< 3.0', flag: 'H' },
    { name: 'Hemoglobin', value: '138', unit: 'g/L', range: '120 - 160' },
  ],
};

const QUEST_FIXTURE: LabFixtureSpec = {
  filename: 'quest-sample.pdf',
  header: 'Quest Diagnostics',
  subheader: 'Laboratory Report',
  patientLine: 'Patient: DEMO USER  DOB: 01/01/1990  Collected: 04/12/2026',
  rows: [
    { name: 'Glucose, Fasting', value: '92', unit: 'mg/dL', range: '65 - 99' },
    { name: 'Hemoglobin A1c', value: '5.4', unit: '%', range: '4.0 - 5.6' },
    { name: 'LDL Cholesterol', value: '148', unit: 'mg/dL', range: '< 130', flag: 'H' },
    { name: 'HDL Cholesterol', value: '42', unit: 'mg/dL', range: '> 40' },
    { name: 'Cholesterol, Total', value: '225', unit: 'mg/dL', range: '< 200', flag: 'H' },
    { name: 'Triglycerides', value: '125', unit: 'mg/dL', range: '< 150' },
    { name: 'TSH', value: '2.1', unit: 'uIU/mL', range: '0.4 - 4.5' },
    { name: 'Ferritin', value: '18', unit: 'ng/mL', range: '20 - 250', flag: 'L' },
    { name: 'Vitamin D, 25-OH, Total', value: '17', unit: 'ng/mL', range: '30 - 100', flag: 'L' },
    { name: 'Vitamin B12', value: '420', unit: 'pg/mL', range: '200 - 900' },
    {
      name: 'C-Reactive Protein, Cardiac',
      value: '0.32',
      unit: 'mg/dL',
      range: '< 0.30',
      flag: 'H',
    },
    { name: 'Hemoglobin', value: '13.8', unit: 'g/dL', range: '12.0 - 16.0' },
  ],
};

const LABCORP_FIXTURE: LabFixtureSpec = {
  filename: 'labcorp-sample.pdf',
  header: 'LabCorp',
  subheader: 'Laboratory Corporation of America',
  patientLine: 'Patient: DEMO USER  DOB: 01/01/1990  Specimen: 04/12/2026',
  rows: [
    { name: 'Glucose', value: '92', unit: 'mg/dL', range: '65 - 99' },
    { name: 'Hemoglobin A1c', value: '5.4', unit: '%', range: '4.0 - 5.6' },
    { name: 'LDL Chol Calc (NIH)', value: '148', unit: 'mg/dL', range: '< 130', flag: 'H' },
    { name: 'HDL Cholesterol', value: '42', unit: 'mg/dL', range: '> 40' },
    { name: 'Cholesterol, Total', value: '225', unit: 'mg/dL', range: '< 200', flag: 'H' },
    { name: 'Triglycerides', value: '125', unit: 'mg/dL', range: '< 150' },
    { name: 'TSH', value: '2.1', unit: 'uIU/mL', range: '0.450 - 4.500' },
    { name: 'Ferritin', value: '18', unit: 'ng/mL', range: '20 - 250', flag: 'L' },
    { name: '25(OH)D', value: '17', unit: 'ng/mL', range: '30 - 100', flag: 'L' },
    { name: 'Vitamin B12', value: '420', unit: 'pg/mL', range: '200 - 900' },
    { name: 'hsCRP', value: '0.32', unit: 'mg/dL', range: '< 0.30', flag: 'H' },
    { name: 'Hemoglobin', value: '13.8', unit: 'g/dL', range: '12.0 - 16.0' },
  ],
};

const AHS_FIXTURE: LabFixtureSpec = {
  filename: 'ahs-sample.pdf',
  header: 'Alberta Health Services',
  subheader: 'Laboratory Services Report',
  patientLine: 'Patient: DEMO USER  DOB: 1990-01-01  Collected: 2026-04-12',
  rows: [
    { name: 'Glucose (fasting)', value: '5.2', unit: 'mmol/L', range: '3.3 - 6.0' },
    { name: 'Hemoglobin A1c', value: '5.4', unit: '%', range: '< 6.0' },
    { name: 'LDL Cholesterol', value: '3.8', unit: 'mmol/L', range: '< 3.4', flag: 'H' },
    { name: 'HDL Cholesterol', value: '1.1', unit: 'mmol/L', range: '> 1.0' },
    { name: 'Cholesterol Total', value: '5.8', unit: 'mmol/L', range: '< 5.2', flag: 'H' },
    { name: 'Triglycerides', value: '1.4', unit: 'mmol/L', range: '< 1.7' },
    { name: 'TSH', value: '2.1', unit: 'mIU/L', range: '0.4 - 4.0' },
    { name: 'Ferritin', value: '18', unit: 'ug/L', range: '20 - 200', flag: 'L' },
    { name: '25-Hydroxyvitamin D', value: '42', unit: 'nmol/L', range: '75 - 250', flag: 'L' },
    { name: 'Vitamin B12', value: '310', unit: 'pmol/L', range: '145 - 600' },
    {
      name: 'C-Reactive Protein (High Sensitivity)',
      value: '3.2',
      unit: 'mg/L',
      range: '< 3.0',
      flag: 'H',
    },
    { name: 'Hemoglobin', value: '138', unit: 'g/L', range: '120 - 160' },
  ],
};

async function generateLabPdf(spec: LabFixtureSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([612, 792]);
  const { height } = page.getSize();

  // Header
  page.drawText(spec.header, {
    x: 40,
    y: height - 50,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });

  page.drawText(spec.subheader, {
    x: 40,
    y: height - 72,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(spec.patientLine, {
    x: 40,
    y: height - 100,
    size: 9,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Column headers
  const tableTop = height - 140;
  page.drawText('Test Name', { x: 40, y: tableTop, size: 10, font: fontBold });
  page.drawText('Result', { x: 260, y: tableTop, size: 10, font: fontBold });
  page.drawText('Units', { x: 340, y: tableTop, size: 10, font: fontBold });
  page.drawText('Reference Range', { x: 400, y: tableTop, size: 10, font: fontBold });
  page.drawText('Flag', { x: 540, y: tableTop, size: 10, font: fontBold });

  // Rows
  let y = tableTop - 22;
  for (const row of spec.rows) {
    page.drawText(row.name, { x: 40, y, size: 10, font });
    page.drawText(row.value, { x: 260, y, size: 10, font });
    page.drawText(row.unit, { x: 340, y, size: 10, font });
    page.drawText(row.range, { x: 400, y, size: 10, font });
    page.drawText(row.flag ?? '', {
      x: 540,
      y,
      size: 10,
      font: fontBold,
      color: row.flag ? rgb(0.8, 0.1, 0.1) : rgb(0, 0, 0),
    });
    y -= 20;
  }

  // Footer
  page.drawText(
    'This is a synthetic fixture document generated for automated testing. Not a real lab report.',
    {
      x: 40,
      y: 40,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    },
  );

  // Add a second page with continuation
  const page2 = doc.addPage([612, 792]);
  page2.drawText(`${spec.header} - Page 2`, {
    x: 40,
    y: 742,
    size: 14,
    font: fontBold,
  });
  page2.drawText('Additional notes and reference information.', {
    x: 40,
    y: 700,
    size: 10,
    font,
  });
  page2.drawText(
    'All values within clinical decision ranges are flagged per laboratory protocols.',
    { x: 40, y: 680, size: 10, font },
  );

  return doc.save();
}

async function generateScannedPdf(): Promise<Uint8Array> {
  // Simulates a scanned (image-only) PDF with very little extractable text.
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  // Only a single small marker so text density falls below threshold.
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('.', { x: 306, y: 396, size: 6, font });
  return doc.save();
}

async function generateNotLabReport(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);
  const lines = [
    "Grandma Rose's Apple Pie Recipe",
    '',
    'Ingredients:',
    '- 6 medium apples, peeled and sliced',
    '- 1 cup sugar',
    '- 2 tbsp flour',
    '- 1 tsp cinnamon',
    '- 1/4 tsp salt',
    '- 1 double pie crust',
    '',
    'Directions:',
    'Preheat oven to 425. Mix apples with sugar, flour, cinnamon and salt.',
    'Pour into pie crust and top with second crust. Bake 40 minutes.',
  ];
  let y = 742;
  for (const line of lines) {
    page.drawText(line, { x: 40, y, size: 12, font });
    y -= 18;
  }
  return doc.save();
}

async function main(): Promise<void> {
  const specs = [LIFELABS_FIXTURE, QUEST_FIXTURE, LABCORP_FIXTURE, AHS_FIXTURE];
  for (const spec of specs) {
    const bytes = await generateLabPdf(spec);
    await writeFile(join(FIXTURES_DIR, spec.filename), bytes);
    // eslint-disable-next-line no-console
    console.log(`wrote ${spec.filename} (${bytes.length} bytes)`);
  }

  const scanned = await generateScannedPdf();
  await writeFile(join(FIXTURES_DIR, 'scanned-sample.pdf'), scanned);
  // eslint-disable-next-line no-console
  console.log(`wrote scanned-sample.pdf (${scanned.length} bytes)`);

  const notLab = await generateNotLabReport();
  await writeFile(join(FIXTURES_DIR, 'not-a-lab-report.pdf'), notLab);
  // eslint-disable-next-line no-console
  console.log(`wrote not-a-lab-report.pdf (${notLab.length} bytes)`);

  // Write expected.json files for the four vendor fixtures
  const vendorExpected: Record<string, { vendor: string; rows: BiomarkerRow[] }> = {
    'lifelabs-sample': { vendor: 'lifelabs', rows: LIFELABS_FIXTURE.rows },
    'quest-sample': { vendor: 'quest', rows: QUEST_FIXTURE.rows },
    'labcorp-sample': { vendor: 'labcorp', rows: LABCORP_FIXTURE.rows },
    'ahs-sample': { vendor: 'ahs', rows: AHS_FIXTURE.rows },
  };
  for (const [slug, payload] of Object.entries(vendorExpected)) {
    await writeFile(
      join(FIXTURES_DIR, `${slug}.expected.json`),
      `${JSON.stringify(payload, null, 2)}\n`,
    );
  }
}

if (import.meta.main) {
  await main();
}

export { generateLabPdf, generateScannedPdf, generateNotLabReport };
export { LIFELABS_FIXTURE, QUEST_FIXTURE, LABCORP_FIXTURE, AHS_FIXTURE };
