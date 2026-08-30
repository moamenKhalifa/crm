import { describe, expect, it } from 'vitest';

import { ApiError } from '@shared/api';

import { toUserMessage } from './toUserMessage';

const t = (key: string) => key;

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
