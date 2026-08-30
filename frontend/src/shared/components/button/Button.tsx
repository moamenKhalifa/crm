import { forwardRef, type ButtonHTMLAttributes } from 'react';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, type = 'button', className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      className={[styles.button, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" data-testid="button-spinner" />}
      <span>{children}</span>
    </button>
  );
});
