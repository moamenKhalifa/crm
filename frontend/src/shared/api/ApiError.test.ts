import { describe, expect, it } from 'vitest';

import {
  ApiError,
  getFieldErrors,
  getRetryAfter,
  hasErrorCode,
  isConflict,
  isForbidden,
  isNetworkError,
  isNotFound,
  isRateLimited,
  isServerError,
  isUnauthorized,
  isValidationError,
} from './ApiError';

function err(status: number): ApiError {
  return new ApiError({ status, code: 'X', message: 'x' });
}

describe('ApiError narrowing helpers', () => {
  it('isUnauthorized is true only for 401', () => {
    expect(isUnauthorized(err(401))).toBe(true);
    expect(isUnauthorized(err(403))).toBe(false);
  });

  it('isForbidden is true only for 403', () => {
    expect(isForbidden(err(403))).toBe(true);
    expect(isForbidden(err(401))).toBe(false);
  });

  it('isNotFound is true only for 404', () => {
    expect(isNotFound(err(404))).toBe(true);
    expect(isNotFound(err(400))).toBe(false);
  });

  it('isValidationError is true for 400 and 422', () => {
    expect(isValidationError(err(400))).toBe(true);
    expect(isValidationError(err(422))).toBe(true);
    expect(isValidationError(err(404))).toBe(false);
  });

  it('isNetworkError is true only for status 0', () => {
    expect(isNetworkError(err(0))).toBe(true);
    expect(isNetworkError(err(500))).toBe(false);
  });

  it('isServerError is true for 5xx', () => {
    expect(isServerError(err(500))).toBe(true);
    expect(isServerError(err(404))).toBe(false);
  });

  it('isConflict is true only for 409', () => {
    expect(isConflict(err(409))).toBe(true);
    expect(isConflict(err(400))).toBe(false);
  });

  it('hasErrorCode matches the ApiError.code exactly', () => {
    const duplicate = new ApiError({ status: 409, code: 'duplicate_account', message: 'x' });
    expect(hasErrorCode(duplicate, 'duplicate_account')).toBe(true);
    expect(hasErrorCode(duplicate, 'other_code')).toBe(false);
    expect(hasErrorCode(new Error('x'), 'duplicate_account')).toBe(false);
  });

  it('all helpers return false for non-ApiError values', () => {
    expect(isUnauthorized(new Error('x'))).toBe(false);
    expect(isForbidden('x')).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
    expect(isConflict(null)).toBe(false);
  });

  it('fieldErrors defaults to an empty array when not supplied', () => {
    expect(err(422).fieldErrors).toEqual([]);
  });

  it('getFieldErrors returns all field errors, or only those matching a given field', () => {
    const error = new ApiError({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      fieldErrors: [
        { field: 'email', code: 'EMAIL_INVALID', message: 'bad email' },
        { field: 'password', code: 'TOO_SHORT', message: 'too short' },
      ],
    });

    expect(getFieldErrors(error)).toHaveLength(2);
    expect(getFieldErrors(error, 'email')).toEqual([{ field: 'email', code: 'EMAIL_INVALID', message: 'bad email' }]);
    expect(getFieldErrors(error, 'missing')).toEqual([]);
    expect(getFieldErrors(new Error('x'))).toEqual([]);
  });

  it('isRateLimited is true only for 429', () => {
    expect(isRateLimited(err(429))).toBe(true);
    expect(isRateLimited(err(400))).toBe(false);
  });

  it('getRetryAfter returns the retryAfterSeconds value, or undefined for non-ApiError', () => {
    const error = new ApiError({ status: 429, code: 'RATE_LIMITED', message: 'slow down', retryAfterSeconds: 30 });
    expect(getRetryAfter(error)).toBe(30);
    expect(getRetryAfter(new Error('x'))).toBeUndefined();
  });
});
