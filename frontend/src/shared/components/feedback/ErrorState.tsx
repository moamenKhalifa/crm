import type { ReactNode } from 'react';

import { Button } from '@shared/components/button/Button';
import { useT } from '@shared/i18n';

import styles from './StatePanel.module.css';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  onRetry?: () => void;
  /**
   * Rendered as `Reference: {{id}}` alongside the retry action. Falls back
   * to a "(no reference)" placeholder rather than crashing if the value is
   * falsy (e.g. an offline/cancelled request never got a synthesised id).
   */
  correlationId?: string;
}

export function ErrorState({ title, description, action, onRetry, correlationId }: ErrorStateProps) {
  const { t } = useT();

  return (
    <div className={styles.panel} role="alert">
      <p className={styles.title}>{title ?? t('errors.unexpected')}</p>
      {description && <p className={styles.description}>{description}</p>}
      {correlationId !== undefined && (
        <p className={styles.description} data-role="error-reference">
          {t('states.errorReference', { id: correlationId || t('states.noReference') })}
        </p>
      )}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('states.retry')}
        </Button>
      )}
      {action}
    </div>
  );
}
