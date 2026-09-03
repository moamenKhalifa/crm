import { forwardRef, type InputHTMLAttributes } from 'react';

import styles from './Switch.module.css';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  label: string;
  checked: boolean;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, checked, id, className, ...rest },
  ref,
) {
  return (
    <label className={[styles.label, className].filter(Boolean).join(' ')}>
      {/* Track precedes the label text in reading order (AC6), same invariant as `Checkbox`/`Radio`. */}
      <span className={styles.track}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          aria-checked={checked}
          className={styles.input}
          {...rest}
        />
        <span className={styles.thumb} />
      </span>
      <span>{label}</span>
    </label>
  );
});
