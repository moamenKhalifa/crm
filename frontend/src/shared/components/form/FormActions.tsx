import type { ReactNode } from 'react';

import styles from './FormActions.module.css';

export interface FormActionsProps {
  children: ReactNode;
  align?: 'start' | 'end' | 'space-between';
}

export function FormActions({ children, align = 'end' }: FormActionsProps) {
  return (
    <div className={styles.actions} data-align={align}>
      {children}
    </div>
  );
}
