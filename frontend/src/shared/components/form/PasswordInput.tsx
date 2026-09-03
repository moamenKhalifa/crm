import { forwardRef, useState } from 'react';

import { useT } from '@shared/i18n';

import { TextInput, type TextInputProps } from './TextInput';
import styles from './PasswordInput.module.css';

export interface PasswordInputProps extends Omit<TextInputProps, 'type' | 'endIcon' | 'dir'> {
  autoComplete?: 'current-password' | 'new-password';
  showToggle?: boolean;
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" />
      <circle cx="8" cy="8" r="2" />
      {off && <path d="M1.5 1.5l13 13" />}
    </svg>
  );
}

// Never logs or otherwise persists `value` outside the controlled input —
// the toggle only flips the native `type` attribute, it never reads the value.
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { autoComplete = 'current-password', showToggle = true, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const { t } = useT();

  return (
    <TextInput
      ref={ref}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      // Forces the caret to start on the left regardless of document
      // direction, so the toggle — rendered in the trailing `endIcon` slot —
      // always sits on the caret's trailing side in both LTR and RTL (AC5).
      dir="ltr"
      endIcon={
        showToggle ? (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
            aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            <EyeIcon off={visible} />
          </button>
        ) : undefined
      }
      {...rest}
    />
  );
});
