import { forwardRef, useState } from 'react';

import { TextInput, type TextInputProps } from './TextInput';
import styles from './PasswordInput.module.css';

export interface PasswordInputProps extends Omit<TextInputProps, 'type' | 'endIcon'> {
  autoComplete?: 'current-password' | 'new-password';
  showToggle?: boolean;
}

// Never logs or otherwise persists `value` outside the controlled input —
// the toggle only flips the native `type` attribute, it never reads the value.
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { autoComplete = 'current-password', showToggle = true, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <TextInput
      ref={ref}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      endIcon={
        showToggle ? (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? '🙈' : '👁'}
          </button>
        ) : undefined
      }
      {...rest}
    />
  );
});
