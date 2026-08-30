import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('renders the label, associated via htmlFor', () => {
    render(<TextInput label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('error sets aria-invalid and renders the error text', () => {
    render(<TextInput label="Email" error="Required" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('required reflects on the input', () => {
    render(<TextInput label="Email" required />);
    expect(screen.getByLabelText(/Email/)).toBeRequired();
  });
});
