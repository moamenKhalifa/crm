import { describe, expect, it } from 'vitest';

import { formatCountdown } from './formatCountdown';

describe('formatCountdown', () => {
  it('renders seconds-only below a minute', () => {
    expect(formatCountdown(0)).toBe('0s');
    expect(formatCountdown(1)).toBe('1s');
    expect(formatCountdown(59)).toBe('59s');
  });

  it('renders mm:ss from a minute onward', () => {
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(61)).toBe('1:01');
    expect(formatCountdown(3600)).toBe('60:00');
  });

  it('clamps negative input to 0s', () => {
    expect(formatCountdown(-5)).toBe('0s');
  });
});
