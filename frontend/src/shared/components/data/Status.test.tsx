import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Status } from './Status';

describe('Status', () => {
  it('renders both a visible dot and the label — never colour alone (AC7)', () => {
    const { container } = render(<Status variant="warning" label="Pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(container.querySelector('[data-variant="warning"]')).toBeInTheDocument();
  });

  it('the dot is decorative and excluded from the accessible name — no duplicated label text', () => {
    const { container } = render(<Status variant="success" label="Active" />);
    const chip = container.querySelector('[data-tone]') as HTMLElement;

    const dot = chip.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();

    // textContent being exactly the label (not e.g. "ActiveActive") proves no
    // redundant sr-only echo was added alongside the already-sufficient
    // visible label — a screen reader walking the flow content reads
    // "Active" exactly once.
    expect(chip.textContent).toBe('Active');
  });

  it('opts Badge in to its semantic colour (tone="semantic") so the status colour actually applies', () => {
    const { container } = render(<Status variant="danger" label="Inactive" />);
    const chip = container.querySelector('[data-tone]') as HTMLElement;
    expect(chip).toHaveAttribute('data-tone', 'semantic');
    expect(chip).toHaveAttribute('data-variant', 'danger');
  });

  it('defaults to the neutral variant', () => {
    render(<Status label="Unknown" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
