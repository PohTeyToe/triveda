/**
 * Structural test — the service role key must never be bundled into the
 * frontend. We search apps/web for any of the known identifier patterns.
 */

import { describe, expect, it } from 'bun:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WEB_DIR = join(
  import.meta.dir ?? new URL('.', import.meta.url).pathname.replace(/^\//, ''),
  '..',
  '..',
  '..',
  'web',
  'src',
);

const BAD_PATTERNS = [/service_role/i, /SERVICE_ROLE/, /serviceRole/, /supabaseServiceKey/];
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.vite']);
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts']);

function walk(dir: string, files: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else {
      const dot = entry.lastIndexOf('.');
      const ext = dot >= 0 ? entry.slice(dot) : '';
      if (ALLOWED_EXTENSIONS.has(ext)) files.push(full);
    }
  }
  return files;
}

describe('Service role key isolation', () => {
  it('apps/web contains no service_role references', () => {
    const matches: Array<{ file: string; line: number; content: string }> = [];
    for (const file of walk(WEB_DIR)) {
      let content: string;
      try {
        content = readFileSync(file, 'utf8');
      } catch {
        continue;
      }
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i += 1) {
        for (const p of BAD_PATTERNS) {
          if (p.test(lines[i] ?? '')) {
            matches.push({ file, line: i + 1, content: (lines[i] ?? '').trim() });
          }
        }
      }
    }
    expect(matches).toEqual([]);
  });
});
