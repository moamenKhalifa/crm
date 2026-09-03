import { forwardRef } from 'react';

import { TextInput, type TextInputProps } from './TextInput';

// Email addresses always read left-to-right, even inside an Arabic form
// (AC11) — `dir` is force-set here, not left to the caller or to inherited
// document direction.
export const EmailInput = forwardRef<HTMLInputElement, Omit<TextInputProps, 'type' | 'dir'>>(function EmailInput(
  props,
  ref,
) {
  return <TextInput ref={ref} type="email" autoComplete="email" inputMode="email" dir="ltr" {...props} />;
});
