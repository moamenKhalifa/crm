import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
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
});
