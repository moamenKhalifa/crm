// Raw scale — never referenced by components. Semantic aliases below re-point
// here; a component that references `rawScale` (or `--blue-600` etc.)
// directly is a defect (see the design-system intake).
export const rawScale = {
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue50: '#EFF6FF',
  neutral900: '#101828',
  neutral700: '#344054',
  neutral500: '#667085',
  neutral400: '#858FA0',
  neutral300: '#D0D5DD',
  neutral200: '#E4E7EC',
  neutral100: '#F2F4F7',
  neutral50: '#F9FAFB',
  white: '#FFFFFF',
  green700: '#027A48',
  green50: '#ECFDF3',
  amber700: '#B54708',
  amber50: '#FFFAEB',
  red700: '#B42318',
  red600: '#D92D20',
  red50: '#FEF3F2',
} as const;

export type RawScale = typeof rawScale;

export interface SemanticColorAliases {
  action: string;
  actionHover: string;
  actionSubtle: string;
  textStrong: string;
  textDefault: string;
  textMuted: string;
  textDisabled: string;
  borderInput: string;
  borderSubtle: string;
  surface: string;
  surfaceSunken: string;
  surfaceDisabled: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  dangerSolid: string;
}

/** Legacy re-export — `ColorTokens` is now shaped like `SemanticColorAliases`. */
export type ColorTokens = SemanticColorAliases;

export const lightAliases: SemanticColorAliases = {
  action: rawScale.blue600,
  actionHover: rawScale.blue700,
  actionSubtle: rawScale.blue50,
  textStrong: rawScale.neutral900,
  textDefault: rawScale.neutral700,
  textMuted: rawScale.neutral500,
  textDisabled: rawScale.neutral500,
  borderInput: rawScale.neutral400,
  borderSubtle: rawScale.neutral200,
  surface: rawScale.white,
  surfaceSunken: rawScale.neutral50,
  surfaceDisabled: rawScale.neutral100,
  success: rawScale.green700,
  successBg: rawScale.green50,
  warning: rawScale.amber700,
  warningBg: rawScale.amber50,
  danger: rawScale.red700,
  dangerBg: rawScale.red50,
  dangerSolid: rawScale.red600,
};

export interface SpacingScale {
  s1: string;
  s2: string;
  s3: string;
  s4: string;
  s5: string;
  s6: string;
  s7: string;
  s8: string;
  s9: string;
  s10: string;
  // Legacy aliases — each resolves to one of the steps above.
  xxs: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface RadiusScale {
  sm: string;
  md: string;
  lg: string;
  full: string;
  /** Legacy alias for `full`. */
  pill: string;
}

export interface ShadowScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
}

export interface MotionTokens {
  durationFast: string;
  durationBase: string;
  easeOut: string;
  focusRing: string;
  focusRingOffset: string;
}

export interface TypeStep {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface TypographyTokens {
  fontFamilyLatin: string;
  fontFamilyArabic: string;
  weightRegular: number;
  weightMedium: number;
  weightBold: number;
  size: TypeStep;
  lineHeightLatin: TypeStep;
  lineHeightArabic: TypeStep;
  /** Arabic reads optically smaller than Latin at the same pixel size. */
  arabicSizeAdjust: number;
}

export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface ThemeTokens {
  name: 'light' | 'dark';
  colors: SemanticColorAliases;
  spacing: SpacingScale;
  radii: RadiusScale;
  shadows: ShadowScale;
  typography: TypographyTokens;
  motion: MotionTokens;
  breakpoints: Breakpoints;
}

const spacing: SpacingScale = {
  s1: '4px',
  s2: '8px',
  s3: '12px',
  s4: '16px',
  s5: '20px',
  s6: '24px',
  s7: '32px',
  s8: '40px',
  s9: '48px',
  s10: '64px',
  xxs: 'var(--space-1)',
  xs: 'var(--space-2)',
  sm: 'var(--space-3)',
  md: 'var(--space-4)',
  lg: 'var(--space-5)',
  xl: 'var(--space-6)',
  xxl: 'var(--space-8)',
};

const radii: RadiusScale = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  full: '9999px',
  pill: 'var(--radius-full)',
};

const shadows: ShadowScale = {
  xs: '0 1px 2px rgba(16, 24, 40, 0.05)',
  sm: '0 1px 3px rgba(16, 24, 40, 0.10)',
  md: '0 4px 8px rgba(16, 24, 40, 0.10)',
  lg: '0 12px 24px rgba(16, 24, 40, 0.12)',
};

const motion: MotionTokens = {
  durationFast: '150ms',
  durationBase: '200ms',
  easeOut: 'cubic-bezier(0.2, 0, 0, 1)',
  focusRing: '2px solid var(--color-action)',
  focusRingOffset: '2px',
};

const typography: TypographyTokens = {
  fontFamilyLatin: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontFamilyArabic: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', Tahoma, sans-serif",
  weightRegular: 400,
  weightMedium: 500,
  weightBold: 600,
  size: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px', '2xl': '24px', '3xl': '30px' },
  lineHeightLatin: { xs: '18px', sm: '20px', base: '24px', lg: '28px', xl: '30px', '2xl': '32px', '3xl': '38px' },
  lineHeightArabic: { xs: '20px', sm: '24px', base: '28px', lg: '32px', xl: '34px', '2xl': '38px', '3xl': '44px' },
  arabicSizeAdjust: 1.05,
};

const breakpoints: Breakpoints = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
  wide: 1440,
};

export const lightTheme: ThemeTokens = {
  name: 'light',
  colors: lightAliases,
  spacing,
  radii,
  shadows,
  typography,
  motion,
  breakpoints,
};

export const darkTheme: ThemeTokens = {
  name: 'dark',
  // TODO: dark alias values (out of scope for Story 10). Reusing the light
  // aliases keeps `setThemeName('dark')` wired end-to-end — switching this
  // to a real dark palette later is exactly "supply a second
  // `SemanticColorAliases` object", not a component rewrite (AC12).
  colors: lightAliases,
  spacing,
  radii,
  shadows,
  typography,
  motion,
  breakpoints,
};
