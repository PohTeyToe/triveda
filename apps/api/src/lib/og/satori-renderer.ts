/**
 * OG image rendering pipeline: font loading + JSX -> SVG -> PNG.
 *
 * Uses Satori for JSX-to-SVG and @resvg/resvg-wasm for SVG-to-PNG.
 * WASM is used instead of native bindings for Bun Docker compatibility
 * (see amendment 002, fix 3).
 */

import { join } from 'node:path';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import satori from 'satori';
import type { RenderOptions, SatoriFont } from './og-types.js';

// ---------------------------------------------------------------------------
// Font loading (cached in module scope)
// ---------------------------------------------------------------------------

let fontCache: SatoriFont[] | null = null;

/**
 * Resolve the assets/fonts directory.
 * Works for both Bun dev (import.meta.dir) and built output.
 */
function getFontsDir(): string {
  // In Bun, import.meta.dir gives the directory of this file
  // Assets are at ../../assets/fonts relative to src/lib/og/
  if (typeof import.meta.dir === 'string') {
    return join(import.meta.dir, '..', '..', '..', 'assets', 'fonts');
  }
  // Fallback: resolve from CWD
  return join(process.cwd(), 'assets', 'fonts');
}

const FONT_FILES: Array<{ file: string; name: string; weight: SatoriFont['weight'] }> = [
  { file: 'CrimsonPro-Variable.ttf', name: 'Crimson Pro', weight: 300 },
  { file: 'CrimsonPro-Variable.ttf', name: 'Crimson Pro', weight: 400 },
  { file: 'DMSans-Variable.ttf', name: 'DM Sans', weight: 400 },
  { file: 'DMSans-Variable.ttf', name: 'DM Sans', weight: 500 },
];

export async function loadFonts(): Promise<SatoriFont[]> {
  if (fontCache) return fontCache;

  const fontsDir = getFontsDir();
  const fonts: SatoriFont[] = [];

  for (const entry of FONT_FILES) {
    const filePath = join(fontsDir, entry.file);
    const file = Bun.file(filePath);
    const exists = await file.exists();
    if (!exists) {
      throw new Error(`Font file not found: ${entry.file} at ${filePath}`);
    }
    const data = await file.arrayBuffer();
    fonts.push({
      name: entry.name,
      data,
      weight: entry.weight,
      style: 'normal',
    });
  }

  fontCache = fonts;
  return fonts;
}

/**
 * Reset the font cache (for testing).
 */
export function resetFontCache(): void {
  fontCache = null;
}

// ---------------------------------------------------------------------------
// WASM initialization (cached)
// ---------------------------------------------------------------------------

let wasmInitialized = false;

async function ensureWasm(): Promise<void> {
  if (wasmInitialized) return;

  // Load the WASM binary from the package
  const wasmPath = require.resolve('@resvg/resvg-wasm/index_bg.wasm');
  const wasmFile = Bun.file(wasmPath);
  const wasmBuffer = await wasmFile.arrayBuffer();
  await initWasm(wasmBuffer);
  wasmInitialized = true;
}

/**
 * Reset WASM init state (for testing).
 */
export function resetWasmInit(): void {
  wasmInitialized = false;
}

// ---------------------------------------------------------------------------
// Render pipeline
// ---------------------------------------------------------------------------

/**
 * Render a Satori-compatible JSX element to a PNG buffer.
 *
 * Pipeline: JSX -> SVG (via Satori) -> PNG (via resvg-wasm).
 * Errors propagate to the caller. Route handlers catch and fall back
 * to the default OG image.
 */
export async function renderOgImage(
  element: React.ReactNode,
  options?: RenderOptions,
): Promise<Buffer> {
  const width = options?.width ?? 1200;
  const height = options?.height ?? 630;

  // 1. Load fonts
  const fonts = await loadFonts();

  // 2. JSX -> SVG
  const svg = await satori(element as React.ReactNode, {
    width,
    height,
    fonts,
  });

  // 3. Initialize WASM if needed
  await ensureWasm();

  // 4. SVG -> PNG
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width' as const, value: width },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return Buffer.from(pngBuffer);
}
