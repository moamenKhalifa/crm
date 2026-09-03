import { useId } from 'react';

import { Radio } from './Radio';
import styles from './RadioGroup.module.css';

export interface RadioGroupOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange(value: string): void;
  options: RadioGroupOption[];
}

// No custom keyboard handling is needed (G3/AC16): native radio inputs
// sharing one `name` already move focus and selection with the arrow keys,
// and select on Space, regardless of the wrapping element.
export function RadioGroup({ name, label, hint, error, required, value, onChange, options }: RadioGroupProps) {
  const generatedId = useId();
  const labelId = label ? `${generatedId}-label` : undefined;
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;

  return (
    <div className={styles.field}>
      {label && (
        <span id={labelId} className={styles.groupLabel}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        className={styles.options}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            label={option.label}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
        ))}
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
}
