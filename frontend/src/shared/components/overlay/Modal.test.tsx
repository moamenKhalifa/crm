import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

describe('Modal', () => {
  it('Esc closes the modal', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Test">
        <button>inside</button>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('focus is trapped inside the dialog on open', () => {
    render(
      <Modal open onClose={() => {}} title="Test">
        <button>only</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('open=false unmounts the content', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Test">
        <button>inside</button>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
