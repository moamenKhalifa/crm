import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Switch } from './Switch';

const switchCss = readFileSync(join(process.cwd(), 'src/shared/components/form/Switch.module.css'), 'utf-8');

describe('Switch', () => {
  it('renders role="switch" with aria-checked reflecting the checked prop', () => {
    render(<Switch label="Notifications" checked={false} onChange={() => {}} />);
    const input = screen.getByRole('switch', { name: 'Notifications' });
    expect(input).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles via onChange like a native checkbox (AC16)', () => {
    const onChange = vi.fn();
    render(<Switch label="Notifications" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Notifications' }));
    expect(onChange).toHaveBeenCalled();
  });

  it('collapses the thumb transition under prefers-reduced-motion (G9)', () => {
    expect(switchCss).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
