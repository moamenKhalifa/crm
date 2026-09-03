import { forwardRef, type InputHTMLAttributes } from 'react';

import styles from './Radio.module.css';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, id, className, ...rest },
  ref,
) {
  return (
    <label className={[styles.label, className].filter(Boolean).join(' ')}>
      {/* Box precedes the label text in reading order (AC6), same invariant as `Checkbox`. */}
      <input ref={ref} id={id} type="radio" className={styles.radio} {...rest} />
      <span>{label}</span>
    </label>
  );
});
