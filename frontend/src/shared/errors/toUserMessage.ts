import { isApiError, isForbidden, isNetworkError, isNotFound, isUnauthorized } from '@shared/api';

/** Maps an error (typically an `ApiError`) to an i18n key describing it to the user. */
export function toUserMessage(error: unknown, t: (key: string) => string): string {
  if (isUnauthorized(error)) {
    return t('auth.errors.sessionExpired');
  }
  if (isForbidden(error)) {
    return t('errors.forbidden');
  }
  if (isNotFound(error)) {
    return t('errors.notFound');
  }
  if (isNetworkError(error)) {
    return t('errors.network');
  }
  return t('errors.unexpected');
}

/** i18n keys for error `code`s the message catalogue has a dedicated translation for. */
const KNOWN_ERROR_CODES: Record<string, string> = {
  duplicate_account: 'auth.register.errors.duplicateAccount',
  duplicate_role: 'admin.roles.errors.duplicateRole',
  duplicate_permission: 'admin.permissions.errors.duplicatePermission',
  invalid_credentials: 'auth.errors.invalidCredentials',
};

/**
 * AC9: an error `code` with no catalogue entry falls back to the
 * server-supplied `message` (never a generic hard-coded string) and the
 * unknown code is logged for follow-up.
 */
export function resolveErrorMessage(error: unknown, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (!isApiError(error)) {
    return t('errors.unexpected');
  }
  const knownKey = KNOWN_ERROR_CODES[error.code];
  if (knownKey) {
    return t(knownKey);
  }
  console.warn('Unknown error code:', error.code);
  return t('errors.unknownCode', { message: error.message });
}
