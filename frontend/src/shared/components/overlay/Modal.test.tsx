import { useState } from 'react';

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

  it('aria-labelledby references the heading id (AC6)', () => {
    render(
      <Modal open onClose={() => {}} title="Test">
        <button>inside</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent('Test');
    expect(dialog).toHaveAccessibleName('Test');
  });

  it('returns focus to the previously focused trigger element on close (AC6)', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>trigger</button>
          <Modal open={open} onClose={() => setOpen(false)} title="Test">
            <button>inside</button>
          </Modal>
        </>
      );
    }
    render(<Harness />);

    const trigger = screen.getByText('trigger');
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('falls back to document.body when the previously focused trigger was unmounted while the dialog was open', () => {
    function Harness() {
      const [showTrigger, setShowTrigger] = useState(true);
      const [open, setOpen] = useState(false);
      return (
        <>
          {showTrigger && (
            <button
              onClick={() => {
                setOpen(true);
                setShowTrigger(false);
              }}
            >
              trigger
            </button>
          )}
          <Modal open={open} onClose={() => setOpen(false)} title="Test">
            <button>inside</button>
          </Modal>
        </>
      );
    }
    render(<Harness />);

    const trigger = screen.getByText('trigger');
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('trigger')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
  });
});
