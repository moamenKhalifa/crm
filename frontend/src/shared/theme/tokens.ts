export interface ColorTokens {
  primary: string;
  primaryHover: string;
  primaryContrast: string;
  secondary: string;
  secondaryHover: string;
  secondaryContrast: string;
  danger: string;
  dangerHover: string;
  dangerContrast: string;
  success: string;
  warning: string;
  info: string;
  bg: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  focus: string;
}

export interface SpacingScale {
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
  pill: string;
}

export interface ShadowScale {
  sm: string;
  md: string;
  lg: string;
}

export interface TypographyTokens {
  fontFamilyBase: string;
  fontFamilyHeading: string;
  fontFamilyMono: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontWeightRegular: number;
  fontWeightMedium: number;
  fontWeightBold: number;
  lineHeightBase: number;
  lineHeightTight: number;
}

export interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface ThemeTokens {
  name: 'light' | 'dark';
  colors: ColorTokens;
  spacing: SpacingScale;
  radii: RadiusScale;
  shadows: ShadowScale;
  typography: TypographyTokens;
  breakpoints: Breakpoints;
}

const spacing: SpacingScale = {
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
};

const radii: RadiusScale = {
  sm: '4px',
  md: '6px',
  lg: '12px',
  pill: '999px',
};

const typography: TypographyTokens = {
  fontFamilyBase: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontFamilyHeading: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontFamilyMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSizeXs: '12px',
  fontSizeSm: '13px',
  fontSizeMd: '14px',
  fontSizeLg: '16px',
  fontSizeXl: '20px',
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  lineHeightBase: 1.4,
  lineHeightTight: 1.2,
};

const breakpoints: Breakpoints = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
  wide: 1440,
};

export const lightTheme: ThemeTokens = {
  name: 'light',
  colors: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryContrast: '#ffffff',
    secondary: '#64748b',
    secondaryHover: '#475569',
    secondaryContrast: '#ffffff',
    danger: '#dc2626',
    dangerHover: '#b91c1c',
    dangerContrast: '#ffffff',
    success: '#16a34a',
    warning: '#d97706',
    info: '#0891b2',
    bg: '#ffffff',
    surface: '#f8fafc',
    surfaceMuted: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    focus: '#2563eb',
  },
  spacing,
  radii,
  shadows: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
    md: '0 4px 6px rgba(15, 23, 42, 0.10)',
    lg: '0 10px 15px rgba(15, 23, 42, 0.15)',
  },
  typography,
  breakpoints,
};

export const darkTheme: ThemeTokens = {
  name: 'dark',
  colors: {
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    primaryContrast: '#0f172a',
    secondary: '#94a3b8',
    secondaryHover: '#cbd5e1',
    secondaryContrast: '#0f172a',
    danger: '#f87171',
    dangerHover: '#fca5a5',
    dangerContrast: '#450a0a',
    success: '#4ade80',
    warning: '#fbbf24',
    info: '#22d3ee',
    bg: '#0f172a',
    surface: '#1e293b',
    surfaceMuted: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    border: '#334155',
    focus: '#60a5fa',
  },
  spacing,
  radii,
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.30)',
    md: '0 4px 6px rgba(0, 0, 0, 0.40)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.50)',
  },
  typography,
  breakpoints,
};
