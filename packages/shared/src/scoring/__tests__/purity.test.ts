import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Purity contract: scoring source files must contain no IO, no DB
 * imports, no Date.now(), and no process.env access. This ensures
 * the scoring engine remains a pure, deterministic computation.
 */

const SCORING_SRC = path.resolve(__dirname, '..');
const FORBIDDEN = [
  { pattern: /from\s+['"].*packages\/db/g, label: 'import from packages/db' },
  { pattern: /\bfetch\s*\(/g, label: 'fetch() call' },
  { pattern: /globalThis\.fetch/g, label: 'globalThis.fetch' },
  { pattern: /Date\.now\(\)/g, label: 'Date.now()' },
  { pattern: /process\.env/g, label: 'process.env' },
  { pattern: /from\s+['"]node:fs['"]/g, label: 'import node:fs' },
  { pattern: /from\s+['"]node:http['"]/g, label: 'import node:http' },
  { pattern: /from\s+['"]node:net['"]/g, label: 'import node:net' },
  { pattern: /from\s+['"]node:path['"]/g, label: 'import node:path' },
];

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'tests') continue;
      results.push(...collectSourceFiles(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      results.push(full);
    }
  }
  return results;
}

describe('scoring purity contract', () => {
  const sourceFiles = collectSourceFiles(SCORING_SRC);
  const allSource = sourceFiles.map((f) => fs.readFileSync(f, 'utf-8')).join('\n');

  it('has at least one source file to check', () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  for (const { pattern, label } of FORBIDDEN) {
    it(`source files contain no ${label}`, () => {
      expect(allSource).not.toMatch(pattern);
    });
  }
});
