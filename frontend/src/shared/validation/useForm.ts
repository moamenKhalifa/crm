import { useCallback, useEffect, useRef, useState } from 'react';
import type { ZodSchema } from 'zod';

export interface UseFormOptions<T extends Record<string, string>> {
  initial: T;
  schema?: ZodSchema<T>;
  onSubmit(values: T): Promise<void> | void;
}

export interface UseFormResult<T extends Record<string, string>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  setField(name: keyof T, value: string): void;
  handleSubmit(event?: { preventDefault(): void }): Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

/** Minimal typed form hook — deliberately has no `react-hook-form` dependency. */
export function useForm<T extends Record<string, string>>({
  initial,
  schema,
  onSubmit,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const setField = useCallback((name: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const validate = useCallback(
    (candidate: T): boolean => {
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
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return false;
    },
    [schema],
  );

  const handleSubmit = useCallback(
    async (event?: { preventDefault(): void }) => {
      event?.preventDefault();
      setSubmitError(null);
      if (!validate(values)) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        if (mounted.current) {
          setSubmitError(error instanceof Error ? error.message : 'errors.unexpected');
        }
      } finally {
        if (mounted.current) {
          setIsSubmitting(false);
        }
      }
    },
    [onSubmit, validate, values],
  );

  return { values, errors, touched, setField, handleSubmit, isSubmitting, submitError };
}
