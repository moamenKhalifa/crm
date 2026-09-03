import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RadioGroup } from './RadioGroup';

const OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
];

describe('RadioGroup', () => {
  it('renders role="radiogroup" with the group label linked via aria-labelledby', () => {
    render(<RadioGroup name="plan" label="Plan" value="basic" onChange={() => {}} options={OPTIONS} />);
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    expect(group).toBeInTheDocument();
  });

  it('reflects the selected option and calls onChange when a different option is clicked (AC16)', () => {
    const onChange = vi.fn();
    render(<RadioGroup name="plan" label="Plan" value="basic" onChange={onChange} options={OPTIONS} />);

    expect(screen.getByLabelText('Basic')).toBeChecked();
    expect(screen.getByLabelText('Pro')).not.toBeChecked();

    fireEvent.click(screen.getByLabelText('Pro'));
    expect(onChange).toHaveBeenCalledWith('pro');
  });

  it('renders every option under the same native radio group name, so arrow-key navigation and Space-to-select work for free (AC16)', () => {
    render(<RadioGroup name="plan" label="Plan" value="basic" onChange={() => {}} options={OPTIONS} />);
    const basic = screen.getByLabelText('Basic') as HTMLInputElement;
    const pro = screen.getByLabelText('Pro') as HTMLInputElement;
    expect(basic.name).toBe(pro.name);
  });
});
