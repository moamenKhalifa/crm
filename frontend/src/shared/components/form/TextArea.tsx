import { forwardRef, useId, useRef, type MutableRefObject, type Ref, type TextareaHTMLAttributes } from 'react';

import type { FieldMaxWidth } from './TextInput';
import styles from './TextArea.module.css';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
  /** Grows the textarea's block-size to fit its content as the user types. */
  autoResize?: boolean;
  maxWidth?: FieldMaxWidth;
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as MutableRefObject<T | null>).current = node;
      }
    }
  };
}

// Textarea and rich-text fields are the only controls that take the full
// available width (`maxWidth` defaults to `'full'`) — every other field
// defaults to the constrained `'field'` measure (AC3).
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    label,
    error,
    hint,
    rows = 4,
    autoResize = false,
    maxWidth = 'full',
    required,
    readOnly,
    id,
    className,
    onChange,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const internalRef = useRef<HTMLTextAreaElement>(null);

  const resize = (element: HTMLTextAreaElement) => {
    if (!autoResize) {
      return;
    }
    element.style.blockSize = 'auto';
    element.style.blockSize = `${element.scrollHeight}px`;
  };

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')} data-max-width={maxWidth}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <textarea
        ref={mergeRefs(ref, internalRef)}
        id={textareaId}
        rows={rows}
        required={required}
        readOnly={readOnly}
        aria-required={required || undefined}
        aria-readonly={readOnly || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={styles.textarea}
        onChange={(event) => {
          resize(event.currentTarget);
          onChange?.(event);
        }}
        {...rest}
      />
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
});
