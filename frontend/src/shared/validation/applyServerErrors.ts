/**
 * Routes server-returned field errors (`error.fieldErrors`) onto their own
 * field via `setFieldErrors`; any path the caller doesn't recognise is
 * aggregated into the top-of-form banner via `setFormError` instead of being
 * silently dropped (AC10).
 */
export function applyServerErrors<T extends Record<string, string>>(
  fieldErrors: Record<string, string> | undefined,
  known: readonly (keyof T)[],
  push: {
    setFieldErrors: (errs: Partial<Record<keyof T, string>>) => void;
    setFormError: (message: string | null) => void;
  },
  fallbackKey: string,
): void {
  if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
    return;
  }

  const knownSet = new Set<string>(known as readonly string[]);
  const recognised: Partial<Record<keyof T, string>> = {};
  let hasUnrecognised = false;

  for (const [path, message] of Object.entries(fieldErrors)) {
    if (knownSet.has(path)) {
      recognised[path as keyof T] = message;
    } else {
      hasUnrecognised = true;
    }
  }

  if (Object.keys(recognised).length > 0) {
    push.setFieldErrors(recognised);
  }
  if (hasUnrecognised) {
    push.setFormError(fallbackKey);
  }
}
