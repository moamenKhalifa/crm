import type { ReactNode } from 'react';

import { useT } from '@shared/i18n';

import styles from './StatePanel.module.css';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const { t } = useT();

  return (
    <div className={styles.panel} role="status">
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M3 7l3-4h12l3 4" />
        <path d="M9 12h6" />
      </svg>
      <p className={styles.title}>{title ?? t('states.empty')}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
