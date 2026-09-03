import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CodeInput } from './CodeInput';

describe('CodeInput', () => {
  it('renders with dir="ltr", numeric inputMode and one-time-code autocomplete (AC11)', () => {
    render(<CodeInput label="Verification code" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Verification code');
    expect(input).toHaveAttribute('dir', 'ltr');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
  });
});
