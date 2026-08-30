export type FieldRule = (value: string) => string | null;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;

export function required(value: string): string | null {
  return value.trim().length > 0 ? null : 'validation.required';
}

export function email(value: string): string | null {
  return EMAIL_RE.test(value) ? null : 'validation.email';
}

// `minLength`/`maxLength` encode their parameter as `"<key>|<n>"` since
// rules return a plain string — see `resolveValidationMessage` for the
// matching decode step used when rendering the message with `t()`.
export function minLength(n: number): FieldRule {
  return (value: string) => (value.length >= n ? null : `validation.minLength|${n}`);
}

export function maxLength(n: number): FieldRule {
  return (value: string) => (value.length <= n ? null : `validation.maxLength|${n}`);
}

/** Mirrors the backend `RawPassword` value object (min 8 chars, letter + digit). */
export function passwordStrength(value: string): string | null {
  if (value.length < 8 || !HAS_LETTER.test(value) || !HAS_DIGIT.test(value)) {
    return 'validation.passwordStrength';
  }
  return null;
}

export function compose(...rules: FieldRule[]): FieldRule {
  return (value: string) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        return error;
      }
    }
    return null;
  };
}

/** Resolves a rule's error string (plain key, or `"key|count"`) via `t`. */
export function resolveValidationMessage(t: (key: string, options?: { count: number }) => string, error: string): string {
  const [key, param] = error.split('|');
  return param !== undefined ? t(key, { count: Number(param) }) : t(key);
}
