import { describe, expect, it } from 'vitest';

import themeSource from './tokens.ts?raw';
import { darkTheme, lightAliases, lightTheme, rawScale } from './tokens';

describe('lightAliases', () => {
  it('every field resolves from rawScale', () => {
    expect(lightAliases.action).toBe(rawScale.blue600);
    expect(lightAliases.actionHover).toBe(rawScale.blue700);
    expect(lightAliases.actionSubtle).toBe(rawScale.blue50);
    expect(lightAliases.textStrong).toBe(rawScale.neutral900);
    expect(lightAliases.textDefault).toBe(rawScale.neutral700);
    expect(lightAliases.textMuted).toBe(rawScale.neutral500);
    expect(lightAliases.textDisabled).toBe(rawScale.neutral500);
    expect(lightAliases.borderInput).toBe(rawScale.neutral400);
    expect(lightAliases.borderSubtle).toBe(rawScale.neutral200);
    expect(lightAliases.surface).toBe(rawScale.white);
    expect(lightAliases.surfaceSunken).toBe(rawScale.neutral50);
    expect(lightAliases.surfaceDisabled).toBe(rawScale.neutral100);
    expect(lightAliases.success).toBe(rawScale.green700);
    expect(lightAliases.successBg).toBe(rawScale.green50);
    expect(lightAliases.warning).toBe(rawScale.amber700);
    expect(lightAliases.warningBg).toBe(rawScale.amber50);
    expect(lightAliases.danger).toBe(rawScale.red700);
    expect(lightAliases.dangerBg).toBe(rawScale.red50);
    expect(lightAliases.dangerSolid).toBe(rawScale.red600);
  });
});

describe('lightTheme', () => {
  it('colors are exactly lightAliases', () => {
    expect(lightTheme.colors).toEqual(lightAliases);
  });
});

describe('darkTheme placeholder (AC12)', () => {
  it('colors deep-equal lightTheme.colors', () => {
    expect(darkTheme.colors).toEqual(lightTheme.colors);
  });

  it('the source file documents the placeholder with a TODO', () => {
    expect(themeSource).toContain('TODO: dark alias values');
  });
});
