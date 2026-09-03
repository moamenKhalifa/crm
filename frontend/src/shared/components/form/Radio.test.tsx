import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Radio } from './Radio';

describe('Radio', () => {
  it('renders the label, associated via a wrapping <label>, with the box preceding it in reading order (AC6)', () => {
    render(<Radio name="plan" label="Basic" value="basic" onChange={() => {}} />);
    const input = screen.getByLabelText('Basic') as HTMLInputElement;
    expect(input.type).toBe('radio');

    const label = input.closest('label');
    expect(label?.firstElementChild).toBe(input);
  });
});
