import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const COMPONENTS_ROOT = join(process.cwd(), 'src/shared/components');

// A `--custom-property: <hex-or-px>;` *definition* line is legitimate only
// inside `src/shared/theme/**` (this file's sibling directory); nothing
// under `shared/components` should ever define one, so no such exemption is
// needed here — every hex/px hit below is a real violation.
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/;

function collectCssModuleFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectCssModuleFiles(fullPath));
    } else if (entry.endsWith('.module.css')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('token layer boundary', () => {
  it('no *.module.css under shared/components references a raw hex colour', () => {
    const violations = collectCssModuleFiles(COMPONENTS_ROOT)
      .map((file) => ({ file, source: readFileSync(file, 'utf-8') }))
      .filter(({ source }) => HEX_PATTERN.test(source));

    expect(violations.map((v) => v.file)).toEqual([]);
  });

  it('no *.module.css under shared/components references a raw pixel value', () => {
    const violations = collectCssModuleFiles(COMPONENTS_ROOT)
      .map((file) => ({ file, source: readFileSync(file, 'utf-8') }))
      // `width: 24px` on a fixed-size logo/icon glyph is a legitimate literal
      // (not a token-governed spacing/type value) — only flag px used with a
      // property this story's token set actually covers.
      .filter(({ source }) =>
        /(?:font-size|line-height|padding[a-z-]*|margin[a-z-]*|gap|border-radius|inset[a-z-]*)\s*:\s*\d+px/.test(
          source,
        ),
      );

    expect(violations.map((v) => v.file)).toEqual([]);
  });
});
