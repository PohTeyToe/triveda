/**
 * Expected biomarker parse output for the fixture PDFs.
 *
 * The PDFs themselves are generated on demand at test time (see
 * `generate-pdfs.ts`) to avoid committing binary blobs. Parser assertions in
 * `blood-work.spec.ts` compare against this table.
 */

export interface ExpectedBiomarker {
  name: string;
  value: number;
  unit: string;
  flag: 'high' | 'low' | 'normal';
}

export const expectedBiomarkers: ExpectedBiomarker[] = [
  { name: 'C-Reactive Protein', value: 8.5, unit: 'mg/L', flag: 'high' },
  { name: 'Vitamin B12', value: 450, unit: 'pg/mL', flag: 'normal' },
  { name: 'Vitamin D', value: 22, unit: 'ng/mL', flag: 'low' },
  { name: 'Hemoglobin', value: 14.2, unit: 'g/dL', flag: 'normal' },
];
