import { describe, expect, it } from 'vitest';

import {
  compose,
  email,
  maxLength,
  minLength,
  passwordStrength,
  required,
  resolveValidationMessage,
} from './rules';

describe('rules', () => {
  it('required returns null for a non-empty value and the key otherwise', () => {
    expect(required('hi')).toBeNull();
    expect(required('  ')).toBe('validation.required');
  });

  it('email validates format', () => {
    expect(email('a@b.com')).toBeNull();
    expect(email('not-an-email')).toBe('validation.email');
  });

  it('minLength/maxLength encode their parameter', () => {
    expect(minLength(3)('ab')).toBe('validation.minLength|3');
    expect(minLength(3)('abc')).toBeNull();
    expect(maxLength(3)('abcd')).toBe('validation.maxLength|3');
    expect(maxLength(3)('abc')).toBeNull();
  });

  it('passwordStrength enforces length, letter, and digit', () => {
    expect(passwordStrength('Passw0rd')).toBeNull();
    expect(passwordStrength('short1')).toBe('validation.passwordStrength');
    expect(passwordStrength('alllettersnodigits')).toBe('validation.passwordStrength');
    expect(passwordStrength('12345678')).toBe('validation.passwordStrength');
  });

  it('compose short-circuits on the first error', () => {
    const rule = compose(required, minLength(5));
    expect(rule('')).toBe('validation.required');
    expect(rule('ab')).toBe('validation.minLength|5');
    expect(rule('abcdef')).toBeNull();
  });

  it('resolveValidationMessage decodes a parametric key', () => {
    const t = (key: string, options?: { count: number }) => (options ? `${key}:${options.count}` : key);
    expect(resolveValidationMessage(t, 'validation.minLength|5')).toBe('validation.minLength:5');
    expect(resolveValidationMessage(t, 'validation.required')).toBe('validation.required');
  });
});
