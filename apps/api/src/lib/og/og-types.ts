/**
 * Type definitions for the OG image generation pipeline.
 */

export interface SatoriFont {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: 'normal' | 'italic';
}

export interface RenderOptions {
  width?: number; // default 1200
  height?: number; // default 630
}

export interface ConstitutionOGProps {
  summary: string;
  traditionSummaries: {
    ayurveda: string;
    tcm: string;
    naturopathy: string;
  };
}

export interface ConstitutionMeta {
  id: string;
  summary: string;
  traditions: {
    ayurveda: string;
    tcm: string;
    naturopathy: string;
  };
}
