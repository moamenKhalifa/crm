import { forwardRef, useId, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from 'react';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'danger-subtle' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Reason surfaced when `disabled` is true. Exposed via `title` and `aria-describedby`. */
  disabledReason?: string;
  /** Leading icon rendered before the label. Replaced by the spinner while `loading`. */
  leadingIcon?: ReactNode;
  /** Trailing icon rendered after the label. */
  trailingIcon?: ReactNode;
  /** Marks the button as icon-only. Requires `aria-label` (or `aria-labelledby`). */
  iconOnly?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    disabledReason,
    leadingIcon,
    trailingIcon,
    iconOnly = false,
    fullWidth = false,
    type = 'button',
    className,
    children,
    onClick,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  },
  ref,
) {
  const reasonId = useId();
  const isDisabled = disabled || loading;
  const hasReason = Boolean(disabled && disabledReason);

  if (import.meta.env.DEV && iconOnly && !ariaLabel && !ariaLabelledBy) {
    console.warn('Button: `iconOnly` requires an `aria-label` (or `aria-labelledby`) for assistive technology.');
  }

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // Belt-and-suspenders: the native `disabled` attribute already blocks
    // this while loading, but a guard here keeps "cannot be activated a
    // second time" true even if a future change ever decouples the two.
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <>
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={hasReason ? reasonId : undefined}
        title={hasReason ? disabledReason : undefined}
        data-variant={variant}
        data-size={size}
        data-loading={loading || undefined}
        data-icon-only={iconOnly || undefined}
        data-disabled-reason={disabledReason || undefined}
        className={[styles.button, fullWidth && styles.fullWidth, className].filter(Boolean).join(' ')}
        onClick={handleClick}
        {...rest}
      >
        {loading ? (
          <span className={styles.spinner} aria-hidden="true" data-testid="button-spinner" />
        ) : (
          leadingIcon != null && (
            <span className={styles.icon} aria-hidden="true">
              {leadingIcon}
            </span>
          )
        )}
        <span>{children}</span>
        {!loading && trailingIcon != null && (
          <span className={styles.icon} aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </button>
      {/* Kept outside the `<button>` — a descendant text node would be folded
          into the accessible *name* computation, not just the description,
          turning e.g. "Delete" into "Delete <reason text>". `aria-describedby`
          only needs the id to exist in the document, not to nest inside. */}
      {hasReason && (
        <span id={reasonId} className={styles.srOnly}>
          {disabledReason}
        </span>
      )}
    </>
  );
});
