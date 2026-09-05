import { rawScale, type RawScale, type ThemeTokens, type TypeStep } from './tokens';

const TYPE_STEPS: (keyof TypeStep)[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl'];

/** `blue600` -> `blue-600`, `neutral900` -> `neutral-900`. */
function toKebabRaw(key: string): string {
  return key.replace(/([a-z])(\d)/i, '$1-$2');
}

export function themeToCssVariables(theme: ThemeTokens, locale: 'en' | 'ar' = 'en'): Record<string, string> {
  const { spacing, radii, shadows, typography, motion, breakpoints } = theme;
  const vars: Record<string, string> = {};

  // 1. Raw scale — the only layer that ever carries a literal value.
  for (const [key, value] of Object.entries(rawScale) as [keyof RawScale, string][]) {
    vars[`--${toKebabRaw(key)}`] = value;
  }

  // 2. Semantic aliases — always `var(--<raw>)`, never a literal hex.
  vars['--color-action'] = 'var(--blue-600)';
  vars['--color-action-hover'] = 'var(--blue-700)';
  vars['--color-action-subtle'] = 'var(--blue-50)';
  vars['--color-text-strong'] = 'var(--neutral-900)';
  vars['--color-text-default'] = 'var(--neutral-700)';
  vars['--color-text-muted'] = 'var(--neutral-500)';
  vars['--color-text-disabled'] = 'var(--neutral-500)';
  vars['--color-border-input'] = 'var(--neutral-400)';
  vars['--color-border-subtle'] = 'var(--neutral-200)';
  vars['--color-surface'] = 'var(--white)';
  vars['--color-surface-sunken'] = 'var(--neutral-50)';
  vars['--color-surface-disabled'] = 'var(--neutral-100)';
  vars['--color-success'] = 'var(--green-700)';
  vars['--color-success-bg'] = 'var(--green-50)';
  vars['--color-warning'] = 'var(--amber-700)';
  vars['--color-warning-bg'] = 'var(--amber-50)';
  vars['--color-danger'] = 'var(--red-700)';
  vars['--color-danger-bg'] = 'var(--red-50)';
  vars['--color-danger-solid'] = 'var(--red-600)';

  // Status colour map (Badge/Status "documented state" colours — AC7/AC8).
  // Named separately from the generic semantic aliases above so a component
  // that renders a *status* never has to reach for `--color-success` etc.
  // directly; today they resolve to the same values.
  vars['--color-status-success'] = 'var(--color-success)';
  vars['--color-status-warning'] = 'var(--color-warning)';
  vars['--color-status-neutral'] = 'var(--color-text-muted)';
  vars['--color-status-danger'] = 'var(--color-danger-solid)';

  // 3. Legacy aliases — every pre-Story-10 name, re-pointed at the semantic
  // layer so existing `*.module.css` files keep resolving during the sweep.
  vars['--color-primary'] = 'var(--color-action)';
  vars['--color-primary-hover'] = 'var(--color-action-hover)';
  vars['--color-primary-contrast'] = 'var(--color-surface)';
  vars['--color-secondary'] = 'var(--color-text-muted)';
  vars['--color-secondary-hover'] = 'var(--color-text-default)';
  vars['--color-secondary-contrast'] = 'var(--color-surface)';
  vars['--color-focus'] = 'var(--color-action)';
  vars['--color-bg'] = 'var(--color-surface)';
  vars['--color-surface-muted'] = 'var(--color-surface-sunken)';
  vars['--color-border'] = 'var(--color-border-subtle)';
  vars['--color-text'] = 'var(--color-text-default)';
  vars['--color-danger-hover'] = 'var(--color-danger-solid)';
  vars['--color-danger-contrast'] = 'var(--color-surface)';
  vars['--color-info'] = 'var(--color-action)';

  // Spacing — `--space-1`..`--space-10` from the raw scale; legacy names as `var(--space-N)`.
  vars['--space-1'] = spacing.s1;
  vars['--space-2'] = spacing.s2;
  vars['--space-3'] = spacing.s3;
  vars['--space-4'] = spacing.s4;
  vars['--space-5'] = spacing.s5;
  vars['--space-6'] = spacing.s6;
  vars['--space-7'] = spacing.s7;
  vars['--space-8'] = spacing.s8;
  vars['--space-9'] = spacing.s9;
  vars['--space-10'] = spacing.s10;
  vars['--space-xxs'] = 'var(--space-1)';
  vars['--space-xs'] = 'var(--space-2)';
  vars['--space-sm'] = 'var(--space-3)';
  vars['--space-md'] = 'var(--space-4)';
  vars['--space-lg'] = 'var(--space-5)';
  vars['--space-xl'] = 'var(--space-6)';
  vars['--space-xxl'] = 'var(--space-8)';

  // Radii
  vars['--radius-sm'] = radii.sm;
  vars['--radius-md'] = radii.md;
  vars['--radius-lg'] = radii.lg;
  vars['--radius-full'] = radii.full;
  vars['--radius-pill'] = 'var(--radius-full)';

  // Shadows
  vars['--shadow-xs'] = shadows.xs;
  vars['--shadow-sm'] = shadows.sm;
  vars['--shadow-md'] = shadows.md;
  vars['--shadow-lg'] = shadows.lg;

  // Motion
  vars['--duration-fast'] = motion.durationFast;
  vars['--duration-base'] = motion.durationBase;
  vars['--ease-out'] = motion.easeOut;
  vars['--focus-ring'] = motion.focusRing;
  vars['--focus-ring-offset'] = motion.focusRingOffset;

  // Type sizes + both locale-scoped line-height sets. The *resolved*
  // `--line-height-*` (no suffix) is also emitted for the given `locale` —
  // `global.css`'s `html[data-locale]` selector performs the same switch
  // declaratively for any element rendered before this runs, so the two
  // mechanisms agree once React mounts.
  for (const step of TYPE_STEPS) {
    vars[`--text-${step}`] = typography.size[step];
    vars[`--line-height-${step}-latin`] = typography.lineHeightLatin[step];
    vars[`--line-height-${step}-arabic`] = typography.lineHeightArabic[step];
    vars[`--line-height-${step}`] =
      locale === 'ar' ? `var(--line-height-${step}-arabic)` : `var(--line-height-${step}-latin)`;
  }
  vars['--arabic-size-adjust'] = String(typography.arabicSizeAdjust);

  // Legacy font-size names (current baseline was 14px, i.e. `--text-sm`).
  vars['--font-size-xs'] = 'var(--text-xs)';
  vars['--font-size-sm'] = 'var(--text-xs)';
  vars['--font-size-md'] = 'var(--text-sm)';
  vars['--font-size-lg'] = 'var(--text-base)';
  vars['--font-size-xl'] = 'var(--text-xl)';

  vars['--font-family-latin'] = typography.fontFamilyLatin;
  vars['--font-family-arabic'] = typography.fontFamilyArabic;
  vars['--font-weight-regular'] = String(typography.weightRegular);
  vars['--font-weight-medium'] = String(typography.weightMedium);
  vars['--font-weight-bold'] = String(typography.weightBold);

  vars['--bp-mobile'] = `${breakpoints.mobile}px`;
  vars['--bp-tablet'] = `${breakpoints.tablet}px`;
  vars['--bp-desktop'] = `${breakpoints.desktop}px`;
  vars['--bp-wide'] = `${breakpoints.wide}px`;

  return vars;
}

export function applyThemeToRoot(theme: ThemeTokens, locale: 'en' | 'ar' = 'en'): void {
  const variables = themeToCssVariables(theme, locale);
  const root = document.documentElement.style;
  for (const [name, value] of Object.entries(variables)) {
    root.setProperty(name, value);
  }
}
