import { useState, type ReactNode } from 'react';

import { Button } from '@shared/components/button/Button';
import { useT } from '@shared/i18n';

import styles from './Alert.module.css';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Shows a Retry button, in the reading-start position ahead of Dismiss. */
  onRetry?: () => void;
  /** Rendered as `Reference: {{id}}` via the `alert.correlationId` key. */
  correlationId?: string;
  /**
   * `role="alert"` (assertive) vs `role="status"` (polite). Defaults to
   * `true` for `variant="danger"` and `false` otherwise — pass explicitly to
   * override either way (AC11).
   */
  assertive?: boolean;
  /** Extra actions (e.g. a "view details" link) rendered after Retry. */
  actions?: ReactNode;
}

export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  onRetry,
  correlationId,
  assertive,
  actions,
}: AlertProps) {
  const { t } = useT();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const isAssertive = assertive ?? variant === 'danger';

  return (
    <div
      className={styles.alert}
      data-variant={variant}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? undefined : 'polite'}
    >
      <div className={styles.content}>
        {title && <strong className={styles.title}>{title}</strong>}
        <div className={styles.body}>{children}</div>
        {correlationId && (
          <span className={styles.correlationId} data-role="correlation-id">
            {t('alert.correlationId', { id: correlationId })}
          </span>
        )}
        {(onRetry || actions) && (
          // Plain flex row, no hard-coded `row-reverse` — under `dir="rtl"`
          // the inline axis flips on its own, so [Retry][…actions] mirrors
          // to the reading-end side automatically (AC12).
          <div className={styles.actions}>
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                {t('alert.retry')}
              </Button>
            )}
            {actions}
          </div>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          className={styles.dismiss}
          aria-label={t('common.dismiss')}
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
