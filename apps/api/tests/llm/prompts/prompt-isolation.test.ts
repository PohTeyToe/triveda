import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Cross-isolation tests.
 *
 * Verifies that tradition prompt files do not import from each other.
 * This is the architectural enforcement that prevents tradition bleed.
 */

const promptDir = resolve(import.meta.dir, '../../../src/llm/prompts/v1');

function readPromptFile(name: string): string {
  return readFileSync(resolve(promptDir, name), 'utf-8');
}

describe('Prompt isolation -- no cross-tradition imports', () => {
  it('ayurveda.ts has zero imports from tcm.ts or naturopathy.ts', () => {
    const content = readPromptFile('ayurveda.ts');
    expect(content).not.toContain("from './tcm");
    expect(content).not.toContain("from './naturopathy");
    expect(content).not.toContain('from "./tcm');
    expect(content).not.toContain('from "./naturopathy');
  });

  it('tcm.ts has zero imports from ayurveda.ts or naturopathy.ts', () => {
    const content = readPromptFile('tcm.ts');
    expect(content).not.toContain("from './ayurveda");
    expect(content).not.toContain("from './naturopathy");
    expect(content).not.toContain('from "./ayurveda');
    expect(content).not.toContain('from "./naturopathy');
  });

  it('naturopathy.ts has zero imports from ayurveda.ts or tcm.ts', () => {
    const content = readPromptFile('naturopathy.ts');
    expect(content).not.toContain("from './ayurveda");
    expect(content).not.toContain("from './tcm");
    expect(content).not.toContain('from "./ayurveda');
    expect(content).not.toContain('from "./tcm');
  });

  it('no prompt file imports another prompt file', () => {
    const files = ['ayurveda.ts', 'tcm.ts', 'naturopathy.ts', 'synthesis.ts'];
    for (const file of files) {
      const content = readPromptFile(file);
      for (const other of files) {
        if (other === file) continue;
        const baseName = other.replace('.ts', '');
        expect(content).not.toContain(`from './${baseName}`);
        expect(content).not.toContain(`from "./${baseName}`);
      }
    }
  });
});
