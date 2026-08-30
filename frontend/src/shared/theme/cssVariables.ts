import type { ThemeTokens } from './tokens';

export function themeToCssVariables(theme: ThemeTokens): Record<string, string> {
  const { colors, spacing, radii, shadows, typography, breakpoints } = theme;

  return {
    '--color-primary': colors.primary,
    '--color-primary-hover': colors.primaryHover,
    '--color-primary-contrast': colors.primaryContrast,
    '--color-secondary': colors.secondary,
    '--color-secondary-hover': colors.secondaryHover,
    '--color-secondary-contrast': colors.secondaryContrast,
    '--color-danger': colors.danger,
    '--color-danger-hover': colors.dangerHover,
    '--color-danger-contrast': colors.dangerContrast,
    '--color-success': colors.success,
    '--color-warning': colors.warning,
    '--color-info': colors.info,
    '--color-bg': colors.bg,
    '--color-surface': colors.surface,
    '--color-surface-muted': colors.surfaceMuted,
    '--color-text': colors.text,
    '--color-text-muted': colors.textMuted,
    '--color-border': colors.border,
    '--color-focus': colors.focus,

    '--space-xxs': spacing.xxs,
    '--space-xs': spacing.xs,
    '--space-sm': spacing.sm,
    '--space-md': spacing.md,
    '--space-lg': spacing.lg,
    '--space-xl': spacing.xl,
    '--space-xxl': spacing.xxl,

    '--radius-sm': radii.sm,
    '--radius-md': radii.md,
    '--radius-lg': radii.lg,
    '--radius-pill': radii.pill,

    '--shadow-sm': shadows.sm,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,

    '--font-family-base': typography.fontFamilyBase,
    '--font-family-heading': typography.fontFamilyHeading,
    '--font-family-mono': typography.fontFamilyMono,
    '--font-size-xs': typography.fontSizeXs,
    '--font-size-sm': typography.fontSizeSm,
    '--font-size-md': typography.fontSizeMd,
    '--font-size-lg': typography.fontSizeLg,
    '--font-size-xl': typography.fontSizeXl,
    '--font-weight-regular': String(typography.fontWeightRegular),
    '--font-weight-medium': String(typography.fontWeightMedium),
    '--font-weight-bold': String(typography.fontWeightBold),
    '--line-height-base': String(typography.lineHeightBase),
    '--line-height-tight': String(typography.lineHeightTight),

    '--bp-mobile': `${breakpoints.mobile}px`,
    '--bp-tablet': `${breakpoints.tablet}px`,
    '--bp-desktop': `${breakpoints.desktop}px`,
    '--bp-wide': `${breakpoints.wide}px`,
  };
}

export function applyThemeToRoot(theme: ThemeTokens): void {
  const variables = themeToCssVariables(theme);
  const root = document.documentElement.style;
  for (const [name, value] of Object.entries(variables)) {
    root.setProperty(name, value);
  }
}
