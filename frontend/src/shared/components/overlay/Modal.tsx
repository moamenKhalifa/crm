import { useEffect, useId, useRef, type ReactNode } from 'react';

import styles from './Modal.module.css';

export interface ModalProps {
  open: boolean;
  onClose(): void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog. Uses a plain `role="dialog"` element with a manual
 * focus trap rather than the native `<dialog>` element — jsdom (used by the
 * test suite) does not implement `showModal()`, and this keeps behaviour
 * (Esc, focus trap, unmount-on-close) reliably testable.
 */
export function Modal({ open, onClose, title, size = 'md', footer, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Captured on open, restored on close (AC6) — a plain ref, not state, since
  // writing it must never itself trigger a render.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (!focusable || focusable.length === 0) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // The trigger may have been unmounted while the dialog was open (e.g.
      // a row action button in a virtualised table) — fall back to the body
      // rather than focusing a detached node.
      const previous = previouslyFocusedRef.current;
      if (previous && previous.isConnected) {
        previous.focus();
      } else {
        document.body.focus();
      }
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={styles.dialog}
        data-size={size}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {title && (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
              ×
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
