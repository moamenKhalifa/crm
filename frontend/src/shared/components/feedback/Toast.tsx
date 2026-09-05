import { useT } from '@shared/i18n';

import styles from './Toast.module.css';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps {
  id: number;
  variant: ToastVariant;
  message: string;
  onDismiss: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
}

/**
 * A single toast. The viewport (see `ToastProvider`) owns the polite
 * `role="status" aria-live="polite"` region — this element itself carries no
 * role of its own (AC11: the viewport is polite, never `role="alert"`).
 *
 * Hover/focus pause the auto-dismiss timer and mouse-leave/blur resume it —
 * `onFocus`/`onBlur` bubble in React (unlike native `focus`/`blur`), so a
 * single pair of handlers on the root element covers the dismiss button too.
 */
export function Toast({ id, variant, message, onDismiss, onPause, onResume }: ToastProps) {
  const { t } = useT();

  return (
    <div
      className={styles.toast}
      data-variant={variant}
      onMouseEnter={() => onPause(id)}
      onMouseLeave={() => onResume(id)}
      onFocus={() => onPause(id)}
      onBlur={() => onResume(id)}
    >
      <span className={styles.message}>{message}</span>
      <button type="button" className={styles.dismiss} aria-label={t('toast.dismiss')} onClick={() => onDismiss(id)}>
        ×
      </button>
    </div>
  );
}
