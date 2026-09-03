import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders the label, associated via a wrapping <label>', () => {
    render(<Checkbox label="Remember me" onChange={() => {}} />);
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
  });

  it('renders an optional hint below the label', () => {
    render(<Checkbox label="Remember me" hint="Keeps you signed in on this device" onChange={() => {}} />);
    expect(screen.getByText('Keeps you signed in on this device')).toBeInTheDocument();
  });

  it('the box precedes the label text in reading order, in both LTR and RTL (AC6)', () => {
    const { container, rerender } = render(<Checkbox label="Remember me" onChange={() => {}} />);
    const input = screen.getByLabelText('Remember me') as HTMLInputElement;
    expect(input.closest('label')?.firstElementChild).toBe(input);

    document.documentElement.dir = 'rtl';
    rerender(<Checkbox label="Remember me" onChange={() => {}} />);
    // Source (DOM) order is unchanged under RTL — no component-level
    // direction branch — the physical swap is purely a CSS/browser effect
    // of the box preceding the label in a document with dir="rtl" (G7).
    expect(input.closest('label')?.firstElementChild).toBe(input);
    document.documentElement.dir = '';

    expect(container).toBeTruthy();
  });

  it('has no automated axe violations', async () => {
    const { container } = render(<Checkbox label="Remember me" onChange={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
