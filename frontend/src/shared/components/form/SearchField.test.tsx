import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SearchField } from './SearchField';

describe('SearchField', () => {
  it('renders as a searchbox and calls onChange while typing', () => {
    const onChange = vi.fn();
    render(<SearchField label="Search" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'acme' } });
    expect(onChange).toHaveBeenCalledWith('acme');
  });

  it('shows a clear button only when there is a value, and Escape clears (AC16)', () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchField label="Search" value="" onChange={onChange} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<SearchField label="Search" value="acme" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith('');

    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
    expect(onChange).toHaveBeenCalledWith('');
  });
});
