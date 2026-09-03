import type { ReactNode } from 'react';

import styles from './FormActions.module.css';

export interface FormActionsProps {
  children: ReactNode;
  /** `'stretch'` stacks actions and lets a `fullWidth` `<Button>` span the row — used by the auth cards' primary submit action. */
  align?: 'start' | 'end' | 'space-between' | 'stretch';
}

export function FormActions({ children, align = 'end' }: FormActionsProps) {
  return (
    <div className={styles.actions} data-align={align}>
      {children}
    </div>
  );
}
