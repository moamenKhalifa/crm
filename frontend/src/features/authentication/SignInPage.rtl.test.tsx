import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { LocaleProvider } from '@shared/i18n';

import { AuthProvider } from './AuthProvider';
import SignInPage from './SignInPage';

function renderSignInAr() {
  return render(
    <ConfigProvider>
      <LocaleProvider defaultLocale="ar">
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<SignInPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </LocaleProvider>
    </ConfigProvider>,
  );
}

describe('SignInPage under RTL (Arabic locale)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the email input dir="ltr" (AC11)', () => {
    renderSignInAr();
    expect(screen.getByLabelText(/Email|البريد/)).toHaveAttribute('dir', 'ltr');
  });

  it('keeps the password input dir="ltr" and the toggle in the trailing endIcon slot (AC5, AC11)', () => {
    renderSignInAr();
    const input = screen.getByLabelText(/^Password|^كلمة/);
    expect(input).toHaveAttribute('dir', 'ltr');

    const toggle = screen.getByRole('button', { name: /Show password|إظهار/ });
    expect(input.nextElementSibling).toContainElement(toggle);
  });
});
