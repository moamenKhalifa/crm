import type { SemanticColorAliases } from '@shared/theme';

/**
 * Measured contrast strings from the design-system intake's core-palette
 * table. Hard-coded rather than computed at runtime — these are the
 * verified values the palette was designed against (AC3, AC13).
 */
export const contrastMap: Record<keyof SemanticColorAliases, string> = {
  action: '5.17:1 with white text',
  actionHover: '6.70:1 with white text',
  actionSubtle: 'Background only',
  textStrong: '17.75:1 on white',
  textDefault: '10.46:1 on white',
  textMuted: '4.97:1 on white',
  textDisabled: '4.51:1 — disabled but still legible',
  borderInput: '3.26:1 on white — meets WCAG 1.4.11',
  borderSubtle: "Decorative — never a control's only boundary",
  surface: '—',
  surfaceSunken: '—',
  surfaceDisabled: '—',
  success: '5.13:1',
  successBg: '—',
  warning: '5.20:1',
  warningBg: '—',
  danger: '6.05:1',
  dangerBg: '—',
  dangerSolid: '4.83:1 with white text',
};
