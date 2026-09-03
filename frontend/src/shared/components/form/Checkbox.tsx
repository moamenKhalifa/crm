import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  hint?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, hint, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const hintId = hint ? `${checkboxId}-hint` : undefined;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label htmlFor={checkboxId} className={styles.label}>
        {/* Box precedes the label text in reading order (AC6) — under RTL
            the physical side swaps because this is source order, not a
            direction-specific override. */}
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={styles.checkbox}
          aria-invalid={Boolean(error)}
          aria-describedby={hintId}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
