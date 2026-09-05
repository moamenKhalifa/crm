import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from './ConfirmDialog';

// jsdom doesn't reliably apply CSS Modules stylesheet rules for
// attribute/pseudo-class selectors when resolving `getComputedStyle` — the
// same limitation seen with Button's `:disabled` rules. Assert against the
// source instead of trusting the cascade.
const confirmDialogCss = readFileSync(
  join(process.cwd(), 'src/shared/components/overlay/ConfirmDialog.module.css'),
  'utf-8',
);

describe('ConfirmDialog', () => {
  afterEach(() => {
    document.documentElement.dir = '';
  });

  it('onConfirm and cancel are wired to their buttons', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDialog open onClose={onClose} onConfirm={onConfirm} title="Delete?" />);

    screen.getByRole('button', { name: 'Cancel' }).click();
    expect(onClose).toHaveBeenCalledTimes(1);

    screen.getByRole('button', { name: 'Confirm' }).click();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('keyboard Enter inside the body triggers confirm', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open onClose={() => {}} onConfirm={onConfirm} title="Delete?">
        <p>Are you sure?</p>
      </ConfirmDialog>,
    );

    fireEvent.keyDown(screen.getByText('Are you sure?'), { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders Cancel then Confirm in LTR physical DOM order', () => {
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} title="Delete?" />);

    const buttons = screen.getAllByRole('button').filter((button) => button.getAttribute('aria-label') !== 'Close');
    expect(buttons.map((button) => button.textContent)).toEqual(['Cancel', 'Confirm']);
  });

  it('flips physical order under RTL via CSS, without changing DOM order', () => {
    document.documentElement.dir = 'rtl';
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} title="Delete?" />);

    // DOM order is unchanged — [Cancel][Confirm] — the visual swap is CSS-only.
    const buttons = screen.getAllByRole('button').filter((button) => button.getAttribute('aria-label') !== 'Close');
    expect(buttons.map((button) => button.textContent)).toEqual(['Cancel', 'Confirm']);

    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    const actions = confirmButton.parentElement as HTMLElement;
    expect(actions.className).toMatch(/actions/);
  });

  it('CSS source flips the actions row under RTL without a component-level branch', () => {
    expect(confirmDialogCss).toMatch(/\[dir=['"]rtl['"]\]\s*\.actions\s*\{[^}]*flex-direction:\s*row-reverse/);
  });

  it('destructive forces the Confirm button to variant="danger", regardless of `variant` (AC5)', () => {
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} title="Delete?" variant="primary" destructive />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveAttribute('data-variant', 'danger');
  });

  it('renders the consequence in the dialog body (AC5)', () => {
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete user?"
        consequence={<p>Delete Alice (owner of 3 tickets)</p>}
      />,
    );
    expect(screen.getByText('Delete Alice (owner of 3 tickets)')).toBeInTheDocument();
  });

  it('disables Confirm until the typed phrase exactly matches confirmationPhrase (AC5)', () => {
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete?"
        destructive
        confirmationPhrase="alice@example.com"
      />,
    );
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmButton).toBeDisabled();

    const input = screen.getByLabelText('Type “alice@example.com” to confirm');
    fireEvent.change(input, { target: { value: 'alice@example.com' } });
    expect(confirmButton).not.toBeDisabled();
  });

  it('typed confirmation is case-sensitive and is never lower-cased for the comparison', () => {
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} title="Delete?" confirmationPhrase="Alice" />);
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    const input = screen.getByLabelText('Type “Alice” to confirm');

    fireEvent.change(input, { target: { value: 'alice' } });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(confirmButton).not.toBeDisabled();
  });

  it('trims surrounding whitespace when comparing the typed phrase', () => {
    render(<ConfirmDialog open onClose={() => {}} onConfirm={() => {}} title="Delete?" confirmationPhrase="Alice" />);
    const input = screen.getByLabelText('Type “Alice” to confirm');
    fireEvent.change(input, { target: { value: '  Alice  ' } });
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled();
  });

  it('onConfirm only fires once Confirm is enabled (typed confirmation gate)', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open onClose={() => {}} onConfirm={onConfirm} title="Delete?" confirmationPhrase="Alice" />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Type “Alice” to confirm'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
