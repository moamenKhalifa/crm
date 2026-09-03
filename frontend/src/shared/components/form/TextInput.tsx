import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

import styles from './TextInput.module.css';

export type FieldMaxWidth = 'field' | 'wide' | 'full';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'dir'> {
  label?: string;
  error?: string;
  hint?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  dir?: 'ltr' | 'rtl' | 'auto';
  /** Id of an external description node to fold into `aria-describedby`, ahead of the hint/error ids. */
  descriptionId?: string;
  /** Caps the field's measure (AC3). `'field'` (480px, default) for single-column forms, `'wide'` (720px) for a two-column pair, `'full'` for textarea/rich-text only. */
  maxWidth?: FieldMaxWidth;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    label,
    error,
    hint,
    startIcon,
    endIcon,
    dir,
    descriptionId,
    maxWidth = 'field',
    required,
    readOnly,
    id,
    className,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')} data-max-width={maxWidth}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {startIcon && <span className={styles.icon}>{startIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          dir={dir}
          required={required}
          readOnly={readOnly}
          aria-required={required || undefined}
          aria-invalid={Boolean(error)}
          aria-readonly={readOnly || undefined}
          aria-describedby={[descriptionId, hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={styles.input}
          {...rest}
        />
        {endIcon && <span className={styles.icon}>{endIcon}</span>}
      </div>
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
