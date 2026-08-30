import { describe, expect, it } from 'vitest';

import { emailSchema, nonEmptyStringSchema, passwordSchema, zodToFieldError } from './schemas';

describe('schemas', () => {
  it('passwordSchema rejects "short"', () => {
    expect(passwordSchema.safeParse('short').success).toBe(false);
  });

  it('passwordSchema accepts "Password1"', () => {
    expect(passwordSchema.safeParse('Password1').success).toBe(true);
  });

  it('emailSchema rejects malformed emails and accepts valid ones', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
    expect(emailSchema.safeParse('a@b.com').success).toBe(true);
  });

  it('nonEmptyStringSchema rejects blank strings', () => {
    expect(nonEmptyStringSchema.safeParse('   ').success).toBe(false);
    expect(nonEmptyStringSchema.safeParse('ok').success).toBe(true);
  });

  it('zodToFieldError returns the first issue message', () => {
    const result = passwordSchema.safeParse('short');
    if (result.success) {
      throw new Error('expected failure');
    }
    expect(zodToFieldError(result.error)).toBe('validation.passwordStrength');
  });
});
