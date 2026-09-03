import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { applyDocumentDirection } from './documentDirection';
import { LocaleProvider, useLocale } from './LocaleProvider';
import { useT } from './useT';

function Probe() {
  const { locale, setLocale, dir } = useLocale();
  const { t } = useT();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="sign-in">{t('auth.signIn')}</span>
      <button onClick={() => setLocale('ar')}>go arabic</button>
    </div>
  );
}

describe('LocaleProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  it('switching locale to ar sets <html dir="rtl">/<html lang="ar"> and useT returns Arabic strings', async () => {
    render(
      <LocaleProvider defaultLocale="en">
        <Probe />
      </LocaleProvider>,
    );

    expect(screen.getByTestId('sign-in')).toHaveTextContent('Sign in');

    screen.getByText('go arabic').click();

    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(document.documentElement.lang).toBe('ar');
    await waitFor(() => expect(screen.getByTestId('sign-in')).toHaveTextContent('تسجيل الدخول'));
  });

  it('defaults to ltr for en', async () => {
    render(
      <LocaleProvider defaultLocale="en">
        <Probe />
      </LocaleProvider>,
    );

    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));
  });

  it('throws when used outside LocaleProvider', () => {
    expect(() => renderHook(() => useLocale())).toThrow('useLocale must be used within LocaleProvider');
  });

  it('applyDocumentDirection sets dir="rtl"/lang="ar" for Arabic and dir="ltr" for English', () => {
    applyDocumentDirection('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');

    applyDocumentDirection('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('calls applyDocumentDirection on every locale change at runtime', async () => {
    render(
      <LocaleProvider defaultLocale="en">
        <Probe />
      </LocaleProvider>,
    );

    screen.getByText('go arabic').click();

    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(document.documentElement.lang).toBe('ar');
  });
});
