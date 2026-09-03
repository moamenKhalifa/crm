import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LocaleProvider } from '@shared/i18n';

import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('the show/hide toggle flips the input type', () => {
    render(<PasswordInput label="Password" value="secret" onChange={() => {}} />);

    const input = screen.getByLabelText(/Password/) as HTMLInputElement;
    expect(input.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.type).toBe('text');

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input.type).toBe('password');
  });

  it('never renders the value via component internals', () => {
    render(<PasswordInput label="Password" value="super-secret-value" onChange={() => {}} />);
    expect(screen.queryByText('super-secret-value')).not.toBeInTheDocument();
  });

  it('exposes the toggle pressed state via aria-pressed (AC5)', () => {
    render(<PasswordInput label="Password" value="secret" onChange={() => {}} />);
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('forces dir="ltr" on the input regardless of document direction (AC5)', () => {
    render(<PasswordInput label="Password" value="secret" onChange={() => {}} />);
    expect(screen.getByLabelText(/Password/)).toHaveAttribute('dir', 'ltr');
  });

  it('under RTL, the toggle still sits in the trailing endIcon slot after the input in DOM order (AC5)', () => {
    document.documentElement.dir = 'rtl';
    render(
      <LocaleProvider defaultLocale="ar">
        <PasswordInput label="Password" value="secret" onChange={() => {}} />
      </LocaleProvider>,
    );

    const input = screen.getByLabelText(/Password/);
    const toggle = screen.getByRole('button');
    // The toggle sits inside the input's next sibling (the `endIcon` slot) —
    // the flex order is unchanged by direction, so it stays visually
    // trailing under both LTR and RTL.
    expect(input.nextElementSibling).toContainElement(toggle);

    document.documentElement.dir = '';
  });
});
