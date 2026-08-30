import type { ReactNode } from 'react';

import { Button } from '@shared/components/button/Button';
import { useT } from '@shared/i18n';

import styles from './StatePanel.module.css';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  onRetry?: () => void;
}

export function ErrorState({ title, description, action, onRetry }: ErrorStateProps) {
  const { t } = useT();

  return (
    <div className={styles.panel} role="alert">
      <p className={styles.title}>{title ?? t('errors.unexpected')}</p>
      {description && <p className={styles.description}>{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('states.retry')}
        </Button>
      )}
      {action}
    </div>
  );
}
