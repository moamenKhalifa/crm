import { describe, expect, it, vi } from 'vitest';

import { applyServerErrors } from './applyServerErrors';

interface Values extends Record<string, string> {
  email: string;
  password: string;
}

const KNOWN: readonly (keyof Values)[] = ['email', 'password'];

describe('applyServerErrors', () => {
  it('routes known field paths to setFieldErrors', () => {
    const setFieldErrors = vi.fn();
    const setFormError = vi.fn();

    applyServerErrors<Values>(
      { email: 'errors.email.taken' },
      KNOWN,
      { setFieldErrors, setFormError },
      'errors.unexpected',
    );

    expect(setFieldErrors).toHaveBeenCalledWith({ email: 'errors.email.taken' });
    expect(setFormError).not.toHaveBeenCalled();
  });

  it('routes an unrecognised path to the form-level banner instead of dropping it (AC10)', () => {
    const setFieldErrors = vi.fn();
    const setFormError = vi.fn();

    applyServerErrors<Values>(
      { nickname: 'errors.nickname.tooLong' },
      KNOWN,
      { setFieldErrors, setFormError },
      'errors.unexpected',
    );

    expect(setFieldErrors).not.toHaveBeenCalled();
    expect(setFormError).toHaveBeenCalledWith('errors.unexpected');
  });

  it('routes known and unknown paths together in the same call', () => {
    const setFieldErrors = vi.fn();
    const setFormError = vi.fn();

    applyServerErrors<Values>(
      { email: 'errors.email.taken', nickname: 'errors.nickname.tooLong' },
      KNOWN,
      { setFieldErrors, setFormError },
      'errors.unexpected',
    );

    expect(setFieldErrors).toHaveBeenCalledWith({ email: 'errors.email.taken' });
    expect(setFormError).toHaveBeenCalledWith('errors.unexpected');
  });

  it('is a no-op for empty or undefined input', () => {
    const setFieldErrors = vi.fn();
    const setFormError = vi.fn();

    applyServerErrors<Values>(undefined, KNOWN, { setFieldErrors, setFormError }, 'errors.unexpected');
    applyServerErrors<Values>({}, KNOWN, { setFieldErrors, setFormError }, 'errors.unexpected');

    expect(setFieldErrors).not.toHaveBeenCalled();
    expect(setFormError).not.toHaveBeenCalled();
  });
});
