import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
});
