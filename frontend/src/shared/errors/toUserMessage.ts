import { isForbidden, isNetworkError, isNotFound, isUnauthorized } from '@shared/api';

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
