import { useId, type ReactNode } from 'react';

import styles from './FormSection.module.css';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;

  return (
    <section aria-labelledby={titleId} className={styles.section}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {description && <p className={styles.description}>{description}</p>}
      <div className={styles.fields}>{children}</div>
    </section>
  );
}
