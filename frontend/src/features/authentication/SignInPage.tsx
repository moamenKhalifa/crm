import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { getRetryAfter, isApiError, isUnauthorized } from '@shared/api';
import { Button } from '@shared/components/button/Button';
import { Checkbox } from '@shared/components/form/Checkbox';
import { EmailInput } from '@shared/components/form/EmailInput';
import { FormActions } from '@shared/components/form/FormActions';
import { PasswordInput } from '@shared/components/form/PasswordInput';
import { LanguageSwitcher } from '@shared/components/navigation/LanguageSwitcher';
import { useT } from '@shared/i18n';
import { defaultBranding } from '@shared/theme';
import { formatCountdown } from '@shared/utils';
import { useForm } from '@shared/validation';

import styles from './AuthCard.module.css';
import { useAuth } from './AuthProvider';

interface SignInFormValues extends Record<string, string> {
  email: string;
  password: string;
}

const signInSchema = z.object({
  email: z.string().min(1, 'auth.validation.email.required').email('auth.validation.email.invalid'),
  password: z.string().min(1, 'auth.validation.password.required'),
});

// Matches an absolute URL (`https://...`) or a protocol-relative one
// (`//evil.example`) — both are rejected as a post-sign-in redirect target
// (AC10). A bare `/` prefix without a following `/` is the only shape
// accepted; `safeRedirectTarget` also requires that leading `/`.
const ABSOLUTE_OR_PROTOCOL_RELATIVE = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;

function roleHome(roles: string[]): string {
  if (roles.includes('admin')) {
    return '/admin';
  }
  if (roles.includes('agent')) {
    return '/agent';
  }
  return '/portal';
}

function safeRedirectTarget(raw: string | null | undefined, fallback: string): string {
  if (!raw || !raw.startsWith('/') || ABSOLUTE_OR_PROTOCOL_RELATIVE.test(raw)) {
    if (raw) {
      console.warn('Rejected unsafe sign-in redirect target:', raw);
    }
    return fallback;
  }
  return raw;
}

interface LockoutError {
  key: string;
  endsAt: number;
}

/** `submitError` is either a plain i18n key, `common.error.unexpected|<id>`, or this JSON shape for a timed lockout. */
function parseLockoutError(submitError: string | null): LockoutError | null {
  if (!submitError) {
    return null;
  }
  try {
    const parsed = JSON.parse(submitError) as Partial<LockoutError>;
    if (typeof parsed.key === 'string' && typeof parsed.endsAt === 'number') {
      return { key: parsed.key, endsAt: parsed.endsAt };
    }
  } catch {
    // Not a lockout payload — a plain i18n key or the correlation-id-tagged unexpected-error string.
  }
  return null;
}

function resolveSubmitErrorMessage(
  submitError: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (submitError.startsWith('common.error.unexpected|')) {
    const correlationId = submitError.slice('common.error.unexpected|'.length);
    return t('common.error.unexpected', { correlationId });
  }
  return t(submitError);
}

export default function SignInPage() {
  const { t } = useT();
  const { signIn, status, roles } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rememberMe, setRememberMe] = useState(false);
  const [showSignedOutBanner] = useState(() => searchParams.get('signedOut') === '1');
  const [now, setNow] = useState(() => Date.now());

  const summaryRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSignedOutBanner) {
      const next = new URLSearchParams(searchParams);
      next.delete('signedOut');
      setSearchParams(next, { replace: true });
    }
    // Strip the query param exactly once, on mount — re-running this on every
    // `searchParams` change would fight `setSearchParams` itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    values,
    errors,
    setField,
    resetField,
    handleBlur,
    handleSubmit,
    isSubmitting,
    submitError,
    submitCount,
    firstInvalidField,
  } = useForm<SignInFormValues>({
      initial: { email: '', password: '' },
      schema: signInSchema,
      mode: 'blur-then-live',
      onSubmit: async (formValues) => {
        try {
          await signIn({ email: formValues.email, password: formValues.password, rememberMe });
        } catch (error) {
          if (isApiError(error)) {
            switch (error.code) {
              case 'INVALID_CREDENTIALS':
                throw new Error('auth.login.error.invalidCredentials');
              case 'ACCOUNT_DISABLED':
                throw new Error('auth.login.error.accountDisabled');
              case 'INVITE_PENDING':
                throw new Error('auth.login.error.invitePending');
              case 'ACCOUNT_LOCKED':
                throw new Error(
                  JSON.stringify({
                    key: 'auth.login.error.accountLocked',
                    endsAt: Date.now() + (getRetryAfter(error) ?? 60) * 1000,
                  }),
                );
              case 'RATE_LIMITED':
                throw new Error(
                  JSON.stringify({
                    key: 'auth.login.error.rateLimited',
                    endsAt: Date.now() + (getRetryAfter(error) ?? 60) * 1000,
                  }),
                );
              default:
                if (isUnauthorized(error)) {
                  // Legacy backend: every failure resolves to a generic 401 today.
                  throw new Error('auth.login.error.invalidCredentials');
                }
                if (error.status === 0 || error.status >= 500) {
                  throw new Error(`common.error.unexpected|${error.correlationId ?? ''}`);
                }
            }
          }
          throw new Error('common.error.unexpected|');
        } finally {
          // Never retain the password once dispatch is done, success or
          // failure (AC13, G9) — `resetField`, not `setField`, so clearing
          // it doesn't conjure a fresh "password required" validation error
          // that would hijack the summary banner over the real server error.
          // This is also why the sign-in form does not opt into
          // `useUnsavedChangesGuard` (unlike RegisterPage): its only
          // sensitive field is cleared on every submit outcome, so there is
          // never a "changes to lose" state worth warning about.
          resetField('password', '');
        }
      },
    });

  const lockout = useMemo(() => parseLockoutError(submitError), [submitError]);
  const lockoutRemainingSeconds = lockout ? Math.max(0, Math.ceil((lockout.endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!lockout) {
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [lockout]);

  // Focus management (G3/AC17): a validation failure focuses the first
  // invalid field; a server-side submit failure focuses the summary banner.
  useEffect(() => {
    if (submitCount === 0) {
      return;
    }
    const invalidField = firstInvalidField();
    if (invalidField === 'email') {
      emailRef.current?.focus();
    } else if (invalidField === 'password') {
      passwordRef.current?.focus();
    } else if (submitError) {
      summaryRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount, submitError]);

  // Covers both AC11 (already authenticated visitor hits /login) and the
  // post-sign-in redirect (AC9/AC10): once `status` flips to 'authenticated'
  // — whichever way that happened — this render reads the freshly updated
  // `roles`, so there's no stale-closure risk from redirecting inside the
  // async `onSubmit` handler itself.
  if (status === 'authenticated') {
    const raw = (location.state as { from?: string } | null)?.from ?? searchParams.get('from');
    return <Navigate to={safeRedirectTarget(raw, roleHome(roles))} replace />;
  }

  const hasValidationSummary = submitCount > 0 && Object.keys(errors).length > 0;

  return (
    <div className={styles.page}>
      <header role="banner" className={styles.publicHeader}>
        <LanguageSwitcher />
      </header>

      <section className={styles.card}>
        <img className={styles.logo} src={defaultBranding.logoUrl} alt={defaultBranding.logoAlt} />

        {showSignedOutBanner && (
          <p role="status" aria-live="polite" className={styles.infoBanner}>
            {t('auth.login.info.signedOut')}
          </p>
        )}

        <h1 id="page-heading" tabIndex={-1} className={styles.heading}>
          {t('auth.login.title')}
        </h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <p className={styles.requiredNote}>{t('forms.requiredNote')}</p>

          <EmailInput
            ref={emailRef}
            label={t('auth.email')}
            value={values.email}
            onChange={(event) => setField('email', event.target.value)}
            onBlur={() => handleBlur('email')}
            error={errors.email ? t(errors.email) : undefined}
            maxWidth="full"
            required
          />
          <PasswordInput
            ref={passwordRef}
            label={t('auth.password')}
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => setField('password', event.target.value)}
            onBlur={() => handleBlur('password')}
            error={errors.password ? t(errors.password) : undefined}
            maxWidth="full"
            required
          />
          <Checkbox
            label={t('auth.rememberMe')}
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />

          {hasValidationSummary && (
            <div ref={summaryRef} role="alert" aria-live="assertive" tabIndex={-1} className={styles.errorBanner}>
              {t('auth.login.summaryHeading')}
            </div>
          )}

          {!hasValidationSummary && lockout && lockoutRemainingSeconds > 0 && (
            <div ref={summaryRef} role="alert" aria-live="assertive" tabIndex={-1} className={styles.errorBanner}>
              {t(lockout.key, { countdown: formatCountdown(lockoutRemainingSeconds) })}
            </div>
          )}

          {!hasValidationSummary && !lockout && submitError && (
            <div ref={summaryRef} role="alert" aria-live="assertive" tabIndex={-1} className={styles.errorBanner}>
              {resolveSubmitErrorMessage(submitError, t)}
            </div>
          )}

          <FormActions align="stretch">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting || lockoutRemainingSeconds > 0}
            >
              {t('auth.signIn')}
            </Button>
          </FormActions>
        </form>

        <div className={styles.footerLinks}>
          <Link to="/forgot-password">{t('auth.links.forgotPassword')}</Link>
          <Link to="/register">{t('auth.links.createAccount')}</Link>
        </div>
      </section>
    </div>
  );
}
