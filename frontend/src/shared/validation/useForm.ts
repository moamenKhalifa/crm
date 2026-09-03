import { useCallback, useEffect, useRef, useState } from 'react';
import type { ZodSchema } from 'zod';

export type UseFormMode = 'submit' | 'blur-then-live';

export interface UseFormOptions<T extends Record<string, string>> {
  initial: T;
  schema?: ZodSchema<T>;
  onSubmit(values: T): Promise<void> | void;
  /**
   * `'submit'` (default) validates only on submit, preserving every existing
   * caller's behaviour unchanged. `'blur-then-live'` additionally validates a
   * field the first time it's blurred, then live on every keystroke
   * thereafter — errors never surface for a field the user hasn't touched
   * yet and hasn't attempted to submit (G2).
   */
  mode?: UseFormMode;
}

export interface UseFormResult<T extends Record<string, string>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  setField(name: keyof T, value: string): void;
  /** Sets a value without running validation — for clearing a sensitive field (e.g. password) after submit without conjuring a fresh "required" error for it. */
  resetField(name: keyof T, value: string): void;
  /** Merges server-returned field errors into the existing error map, without touching internal validation state (AC10). */
  setFieldErrors(errors: Partial<Record<keyof T, string>>): void;
  /** Sets (or clears, with `null`) the top-of-form submit error banner directly — for server errors that don't map to a known field (AC10). */
  setFormError(message: string | null): void;
  handleBlur(name: keyof T): void;
  handleSubmit(event?: { preventDefault(): void }): Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  submitCount: number;
  /** First key of `initial`'s declaration order whose `errors[key]` is truthy, or `null`. */
  firstInvalidField(): keyof T | null;
}

/** Minimal typed form hook — deliberately has no `react-hook-form` dependency. */
export function useForm<T extends Record<string, string>>({
  initial,
  schema,
  onSubmit,
  mode = 'submit',
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [visited, setVisited] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mounted = useRef(true);
  // A ref (not the `isSubmitting` state) guards re-entrancy: state updates
  // are async, so a second `handleSubmit` call fired before React re-renders
  // could still read a stale `isSubmitting === false` from its own closure.
  const submitting = useRef(false);
  const fieldOrder = useRef(Object.keys(initial) as (keyof T)[]);
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  useEffect(() => {
    // Reset on every mount — in React 18 StrictMode's dev-only
    // mount→cleanup→remount cycle, the cleanup below runs during the
    // synthetic unmount, and without this reset `mounted.current` would
    // stay `false` forever afterwards. That would silently drop every
    // `setSubmitError`/`setIsSubmitting(false)` call below, leaving a
    // submitted form stuck spinning with no error shown.
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /** Full-schema validation, optionally surfacing only errors for `filterKeys` (undefined = show all). */
  const runValidation = useCallback(
    (candidate: T, filterKeys?: Set<keyof T>): boolean => {
      if (!schema) {
        return true;
      }
      const result = schema.safeParse(candidate);
      if (result.success) {
        setErrors({});
        return true;
      }
      const nextErrors: Partial<Record<keyof T, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof T | undefined;
        if (key && !nextErrors[key] && (!filterKeys || filterKeys.has(key))) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return false;
    },
    [schema],
  );

  const setField = useCallback(
    (name: keyof T, value: string) => {
      const nextValues = { ...values, [name]: value };
      setValues(nextValues);
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (mode === 'blur-then-live') {
        const eligible =
          submitCount > 0
            ? undefined
            : new Set([...(Object.keys(visited) as (keyof T)[]).filter((key) => visited[key]), name]);
        runValidation(nextValues, eligible);
      }
    },
    [values, mode, submitCount, visited, runValidation],
  );

  const resetField = useCallback((name: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldErrors = useCallback((fieldErrors: Partial<Record<keyof T, string>>) => {
    setErrors((prev) => ({ ...prev, ...fieldErrors }));
  }, []);

  const setFormError = useCallback((message: string | null) => {
    setSubmitError(message);
  }, []);

  const handleBlur = useCallback(
    (name: keyof T) => {
      setVisited((prev) => ({ ...prev, [name]: true }));

      if (mode === 'blur-then-live') {
        const eligible =
          submitCount > 0
            ? undefined
            : new Set([...(Object.keys(visited) as (keyof T)[]).filter((key) => visited[key]), name]);
        runValidation(values, eligible);
      }
    },
    [values, mode, submitCount, visited, runValidation],
  );

  const handleSubmit = useCallback(
    async (event?: { preventDefault(): void }) => {
      event?.preventDefault();
      if (submitting.current) {
        return;
      }
      setSubmitError(null);
      setSubmitCount((count) => count + 1);
      if (!runValidation(values)) {
        return;
      }

      submitting.current = true;
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        if (mounted.current) {
          setSubmitError(error instanceof Error ? error.message : 'errors.unexpected');
        }
      } finally {
        submitting.current = false;
        if (mounted.current) {
          setIsSubmitting(false);
        }
      }
    },
    [onSubmit, runValidation, values],
  );

  const firstInvalidField = useCallback((): keyof T | null => {
    for (const key of fieldOrder.current) {
      if (errorsRef.current[key]) {
        return key;
      }
    }
    return null;
  }, []);

  return {
    values,
    errors,
    touched,
    setField,
    resetField,
    setFieldErrors,
    setFormError,
    handleBlur,
    handleSubmit,
    isSubmitting,
    submitError,
    submitCount,
    firstInvalidField,
  };
}
