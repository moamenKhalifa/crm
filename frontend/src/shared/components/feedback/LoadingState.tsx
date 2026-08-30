import type { ReactNode } from 'react';

import { useT } from '@shared/i18n';

import styles from './StatePanel.module.css';

export interface LoadingStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function LoadingState({ title, description, action }: LoadingStateProps) {
  const { t } = useT();

  return (
    <div className={styles.panel} role="status">
      <p className={styles.title}>{title ?? t('states.loading')}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
