import { forwardRef } from 'react';

import { TextInput, type TextInputProps } from './TextInput';

import styles from './CodeInput.module.css';

// Verification codes are digits read left-to-right even inside an Arabic
// form (AC11), and are short enough that the field should never grow to the
// full 480px single-column measure.
export const CodeInput = forwardRef<HTMLInputElement, Omit<TextInputProps, 'type' | 'dir' | 'maxWidth'>>(
  function CodeInput({ className, ...props }, ref) {
    return (
      <TextInput
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        dir="ltr"
        className={[styles.code, className].filter(Boolean).join(' ')}
        {...props}
      />
    );
  },
);
