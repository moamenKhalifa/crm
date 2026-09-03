import { describe, expect, it } from 'vitest';

import { themeToCssVariables } from './cssVariables';
import { lightTheme } from './tokens';

describe('themeToCssVariables', () => {
  it('emits the raw scale as literal values', () => {
    const vars = themeToCssVariables(lightTheme, 'en');
    expect(vars['--blue-600']).toBe('#2563EB');
  });

  it('emits semantic aliases as var(--raw) references, never a literal hex', () => {
    const vars = themeToCssVariables(lightTheme, 'en');
    expect(vars['--color-action']).toBe('var(--blue-600)');
  });

  it('emits legacy aliases as var(--color-<semantic>) references', () => {
    const vars = themeToCssVariables(lightTheme, 'en');
    expect(vars['--color-primary']).toBe('var(--color-action)');
  });

  it('emits the focus-ring shorthand', () => {
    const vars = themeToCssVariables(lightTheme, 'en');
    expect(vars['--focus-ring']).toBe('2px solid var(--color-action)');
    expect(vars['--focus-ring-offset']).toBe('2px');
  });

  it('emits the 4px-grid spacing scale, with legacy names as var() references', () => {
    const vars = themeToCssVariables(lightTheme, 'en');
    expect(vars['--space-4']).toBe('16px');
    expect(vars['--space-md']).toBe('var(--space-4)');
  });

  it('emits locale-scoped line-heights for both Latin and Arabic', () => {
    const vars = themeToCssVariables(lightTheme, 'en');
    expect(vars['--line-height-sm-latin']).toBe('20px');
    expect(vars['--line-height-sm-arabic']).toBe('24px');
  });

  it('resolves --line-height-sm to the Arabic alias when called with locale "ar"', () => {
    const vars = themeToCssVariables(lightTheme, 'ar');
    expect(vars['--line-height-sm']).toBe('var(--line-height-sm-arabic)');
  });

  it('resolves --line-height-sm to the Latin alias when called with locale "en"', () => {
    const vars = themeToCssVariables(lightTheme, 'en');
    expect(vars['--line-height-sm']).toBe('var(--line-height-sm-latin)');
  });

  it('emits radii, including --radius-full and the legacy --radius-pill alias', () => {
    const vars = themeToCssVariables(lightTheme, 'en');
    expect(vars['--radius-full']).toBe('9999px');
    expect(vars['--radius-pill']).toBe('var(--radius-full)');
  });

  it('emits motion tokens', () => {
    const vars = themeToCssVariables(lightTheme, 'en');
    expect(vars['--duration-fast']).toBe('150ms');
    expect(vars['--duration-base']).toBe('200ms');
    expect(vars['--ease-out']).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });
});
