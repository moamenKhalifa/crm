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
    <div className={styles.panel} role="status" aria-live="polite">
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" />
      </svg>
      <p className={styles.title}>{title ?? t('states.loading')}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
