import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('renders the label, associated via htmlFor, defaulting to 4 rows and full width', () => {
    render(<TextArea label="Notes" />);
    const textarea = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.rows).toBe(4);
    expect(textarea.closest('div')).toHaveAttribute('data-max-width', 'full');
  });

  it('error sets aria-invalid and renders the error text', () => {
    render(<TextArea label="Notes" error="Too long" />);
    expect(screen.getByLabelText('Notes')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Too long')).toBeInTheDocument();
  });
});
