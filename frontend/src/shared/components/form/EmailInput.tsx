import { forwardRef } from 'react';

import { TextInput, type TextInputProps } from './TextInput';

export const EmailInput = forwardRef<HTMLInputElement, Omit<TextInputProps, 'type'>>(function EmailInput(
  props,
  ref,
) {
  return <TextInput ref={ref} type="email" autoComplete="email" inputMode="email" {...props} />;
});
