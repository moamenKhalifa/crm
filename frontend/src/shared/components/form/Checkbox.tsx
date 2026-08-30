import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={checkboxId} className={styles.label}>
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={styles.checkbox}
          aria-invalid={Boolean(error)}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
