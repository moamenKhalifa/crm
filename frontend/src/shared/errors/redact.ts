const REDACT_KEYS = /^(authorization|password|password_confirmation|refresh_token|access_token|token|refreshToken|accessToken)$/i;

/** Strips Authorization headers, password fields and tokens from any payload before it is logged. */
export function redactForTelemetry(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactForTelemetry);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.test(k) ? '[REDACTED]' : redactForTelemetry(v);
    }
    return out;
  }
  return value;
}
