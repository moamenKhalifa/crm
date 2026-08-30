import type { ReactNode } from 'react';

import styles from './StatePanel.module.css';

export interface SuccessStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SuccessState({ title, description, action }: SuccessStateProps) {
  return (
    <div className={styles.panel} role="status">
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
