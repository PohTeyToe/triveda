#!/usr/bin/env node
/**
 * Generates favicon / PWA icon set from the existing 512x512 source.
 *
 * Outputs (apps/web/public/icons/):
 *   - icon-16.png, icon-32.png, icon-48.png
 *   - icon-96.png, icon-192.png, icon-256.png, icon-384.png, icon-512.png (no-op resize)
 *   - apple-touch-icon.png (180x180)
 *   - maskable-192.png, maskable-512.png (20% safe-zone padding on #14b8a6)
 *
 * Run: node apps/web/scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '..', 'public', 'icons');
const source = resolve(iconsDir, 'icon-512.png');

const plainSizes = [16, 32, 48, 96, 192, 256, 384, 512];
const appleSize = 180;
const maskableSizes = [192, 512];
const THEME = { r: 20, g: 184, b: 166, alpha: 1 }; // #14b8a6

const sourceBuffer = readFileSync(source);

async function generate() {
  for (const size of plainSizes) {
    const outPath = resolve(iconsDir, `icon-${size}.png`);
    await sharp(sourceBuffer).resize(size, size, { fit: 'contain' }).png().toFile(outPath);
    console.log(`wrote ${outPath}`);
  }

  // Apple touch icon
  const applePath = resolve(iconsDir, 'apple-touch-icon.png');
  await sharp(sourceBuffer).resize(appleSize, appleSize, { fit: 'contain' }).png().toFile(applePath);
  console.log(`wrote ${applePath}`);

  // Maskable variants: content in inner 80% safe zone, theme background fills
  for (const size of maskableSizes) {
    const inner = Math.round(size * 0.8);
    const innerBuf = await sharp(sourceBuffer).resize(inner, inner, { fit: 'contain' }).png().toBuffer();
    const outPath = resolve(iconsDir, `maskable-${size}.png`);
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: THEME,
      },
    })
      .composite([{ input: innerBuf, gravity: 'center' }])
      .png()
      .toFile(outPath);
    console.log(`wrote ${outPath}`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
