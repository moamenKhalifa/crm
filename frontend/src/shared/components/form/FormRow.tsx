import type { ReactNode } from 'react';

import styles from './FormRow.module.css';

export interface FormRowProps {
  children: ReactNode;
  /** `2` lays the pair side by side only from the 768px breakpoint up — it never splits below that (per the intake's field-width rule). */
  columns?: 1 | 2;
}

export function FormRow({ children, columns = 1 }: FormRowProps) {
  return (
    <div className={styles.row} data-columns={columns}>
      {children}
    </div>
  );
}
