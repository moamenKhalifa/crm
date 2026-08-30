import { describe, expect, it } from 'vitest';

import {
  ApiError,
  isForbidden,
  isNetworkError,
  isNotFound,
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

  it('all helpers return false for non-ApiError values', () => {
    expect(isUnauthorized(new Error('x'))).toBe(false);
    expect(isForbidden('x')).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});
