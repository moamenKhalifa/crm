import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@shared/api';

import { resolveErrorMessage, toUserMessage } from './toUserMessage';

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key;

function err(status: number): ApiError {
  return new ApiError({ status, code: 'X', message: 'x' });
}

describe('toUserMessage', () => {
  it('maps 401 to auth.errors.sessionExpired', () => {
    expect(toUserMessage(err(401), t)).toBe('auth.errors.sessionExpired');
  });

  it('maps 403 to errors.forbidden', () => {
    expect(toUserMessage(err(403), t)).toBe('errors.forbidden');
  });

  it('maps 404 to errors.notFound', () => {
    expect(toUserMessage(err(404), t)).toBe('errors.notFound');
  });

  it('maps a network error to errors.network', () => {
    expect(toUserMessage(err(0), t)).toBe('errors.network');
  });

  it('defaults to errors.unexpected', () => {
    expect(toUserMessage(new Error('boom'), t)).toBe('errors.unexpected');
    expect(toUserMessage(err(500), t)).toBe('errors.unexpected');
  });
});

describe('resolveErrorMessage (AC9)', () => {
  it('returns the catalogue translation for a known code', () => {
    const error = new ApiError({ status: 409, code: 'duplicate_account', message: 'server text' });
    expect(resolveErrorMessage(error, t)).toBe('auth.register.errors.duplicateAccount');
  });

  it('falls back to the server-supplied message and logs the unknown code', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new ApiError({ status: 500, code: 'SOME_NEW_CODE', message: 'server-supplied text' });

    const result = resolveErrorMessage(error, t);

    expect(result).toBe('errors.unknownCode:{"message":"server-supplied text"}');
    expect(warnSpy).toHaveBeenCalledWith('Unknown error code:', 'SOME_NEW_CODE');
    warnSpy.mockRestore();
  });

  it('defaults to errors.unexpected for a non-ApiError value', () => {
    expect(resolveErrorMessage(new Error('boom'), t)).toBe('errors.unexpected');
  });
});
