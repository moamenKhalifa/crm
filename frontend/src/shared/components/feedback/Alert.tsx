import { useState, type ReactNode } from 'react';

import styles from './Alert.module.css';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({ variant = 'info', children, dismissible = false, onDismiss }: AlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className={styles.alert} data-variant={variant} role="alert">
      <div className={styles.content}>{children}</div>
      {dismissible && (
        <button
          type="button"
          className={styles.dismiss}
          aria-label="Dismiss"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
