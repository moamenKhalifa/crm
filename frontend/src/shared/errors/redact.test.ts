import { describe, expect, it } from 'vitest';

import { redactForTelemetry } from './redact';

describe('redactForTelemetry', () => {
  it('redacts Authorization, password, password_confirmation, refresh_token, access_token (case-insensitive)', () => {
    const input = {
      Authorization: 'Bearer abc',
      authorization: 'Bearer abc',
      password: 'secret',
      password_confirmation: 'secret',
      refresh_token: 'r1',
      access_token: 'a1',
      refreshToken: 'r1',
      accessToken: 'a1',
      TOKEN: 'x',
    };

    const result = redactForTelemetry(input) as Record<string, unknown>;

    for (const key of Object.keys(input)) {
      expect(result[key]).toBe('[REDACTED]');
    }
  });

  it('recurses into nested objects and arrays', () => {
    const input = {
      user: { email: 'a@b.com', password: 'secret' },
      items: [{ token: 'x' }, { name: 'ok' }],
    };

    const result = redactForTelemetry(input) as {
      user: { email: string; password: string };
      items: [{ token: string }, { name: string }];
    };

    expect(result.user.email).toBe('a@b.com');
    expect(result.user.password).toBe('[REDACTED]');
    expect(result.items[0].token).toBe('[REDACTED]');
    expect(result.items[1].name).toBe('ok');
  });

  it('leaves unrelated keys and primitive values untouched', () => {
    expect(redactForTelemetry({ email: 'a@b.com', count: 3 })).toEqual({ email: 'a@b.com', count: 3 });
    expect(redactForTelemetry('plain string')).toBe('plain string');
    expect(redactForTelemetry(42)).toBe(42);
    expect(redactForTelemetry(null)).toBeNull();
  });
});
