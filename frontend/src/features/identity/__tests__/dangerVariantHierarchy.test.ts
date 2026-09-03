import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const FEATURES_ROOT = join(process.cwd(), 'src/features');
const EXCLUDED_DIRS = new Set(['design-system', '__tests__']);

function collectTsxFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED_DIRS.has(entry)) {
      continue;
    }
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsxFiles(fullPath));
    } else if (entry.endsWith('.tsx') && !entry.includes('.test.')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Matches a JSX opening tag (`<Button ...>` or `<ConfirmDialog ...>`),
// attributes included, across however many lines it's formatted on — `[^>]`
// already matches newlines without needing the `s` flag.
const OPENING_TAG_PATTERN = /<(Button|ConfirmDialog)\b([^>]*)>/g;

describe('danger variant hierarchy guardrail (AC5)', () => {
  it('the solid variant="danger" never appears on a bare <Button> — only as a <ConfirmDialog> prop', () => {
    const violations: string[] = [];

    for (const file of collectTsxFiles(FEATURES_ROOT)) {
      const source = readFileSync(file, 'utf-8');
      for (const match of source.matchAll(OPENING_TAG_PATTERN)) {
        const [, tagName, attrs] = match;
        // The exact-quote match (`"danger"`, not `"danger-subtle"`) already
        // excludes the subtle variant — "danger" is only a prefix of
        // "danger-subtle", not a full match of the quoted string.
        if (tagName === 'Button' && /variant="danger"/.test(attrs)) {
          violations.push(`${file}: ${match[0].slice(0, 80)}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
