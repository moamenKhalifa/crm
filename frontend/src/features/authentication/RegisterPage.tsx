import { useEffect, useRef, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { hasErrorCode, isApiError, isConflict, isValidationError, useApiClient } from '@shared/api';
import { Button } from '@shared/components/button/Button';
import { EmailInput } from '@shared/components/form/EmailInput';
import { FormActions } from '@shared/components/form/FormActions';
import { FormError } from '@shared/components/form/FormError';
import { PasswordInput } from '@shared/components/form/PasswordInput';
import { TextInput } from '@shared/components/form/TextInput';
import { useUnsavedChangesGuard } from '@shared/hooks';
import { useT } from '@shared/i18n';
import { defaultBranding } from '@shared/theme';
import { emailSchema, passwordSchema, resolveValidationMessage, useForm } from '@shared/validation';

import styles from './AuthCard.module.css';
import { register } from './api';
import { useAuth } from './AuthProvider';

interface RegisterFormValues extends Record<string, string> {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, 'validation.required').max(200, 'validation.maxLength|200'),
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string().min(1, 'validation.required'),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'auth.register.errors.passwordMismatch',
  });

export default function RegisterPage() {
  const { t } = useT();
  const { signIn } = useAuth();
  const client = useApiClient();
  const navigate = useNavigate();

  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);

  const {
    values,
    errors,
    setField,
    handleBlur,
    handleSubmit,
    isSubmitting,
    submitError,
    submitCount,
    firstInvalidField,
  } = useForm<RegisterFormValues>({
    initial: { fullName: '', email: '', password: '', passwordConfirm: '' },
    schema: registerSchema,
    mode: 'blur-then-live',
    onSubmit: async (formValues) => {
      try {
        // If `register` throws, `signIn` never runs and the error propagates
        // unchanged — the user stays anonymous rather than being silently
        // signed in on a failed registration attempt.
        await register(client, {
          email: formValues.email,
          password: formValues.password,
          full_name: formValues.fullName,
        });
        await signIn({ email: formValues.email, password: formValues.password, rememberMe: false });
        // Never retain the password in form state once it's no longer needed.
        setField('password', '');
        setField('passwordConfirm', '');
        navigate('/agent', { replace: true });
      } catch (error) {
        if (isConflict(error) && hasErrorCode(error, 'duplicate_account')) {
          throw new Error('auth.register.errors.duplicateAccount');
        }
        if (isApiError(error) && isValidationError(error)) {
          throw new Error('auth.register.errors.validation');
        }
        throw new Error('errors.unexpected');
      }
    },
  });

  // The guard disarms itself before the success-path `navigate(...)` above
  // runs, because `isSubmitting` flips back to `false` only *after*
  // `onSubmit` resolves — by which point the redirect has already fired —
  // so there is no window where a stale prompt could interrupt it.
  useUnsavedChangesGuard(Object.values(values).some(Boolean) && !isSubmitting);

  const fieldRefs: Record<keyof RegisterFormValues, RefObject<HTMLInputElement>> = {
    fullName: fullNameRef,
    email: emailRef,
    password: passwordRef,
    passwordConfirm: passwordConfirmRef,
  };

  // A failed submit focuses the first invalid field, mirroring SignInPage (AC8/G3).
  useEffect(() => {
    if (submitCount === 0) {
      return;
    }
    const invalidField = firstInvalidField();
    if (invalidField) {
      fieldRefs[invalidField].current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <img className={styles.logo} src={defaultBranding.logoUrl} alt={defaultBranding.logoAlt} />
        <h1 className={styles.heading}>{t('auth.register.title')}</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <p className={styles.requiredNote}>{t('forms.requiredNote')}</p>

          <TextInput
            ref={fullNameRef}
            label={t('auth.register.fullName')}
            autoComplete="name"
            value={values.fullName}
            onChange={(event) => setField('fullName', event.target.value)}
            onBlur={() => handleBlur('fullName')}
            error={errors.fullName ? resolveValidationMessage(t, errors.fullName) : undefined}
            maxWidth="full"
            required
          />
          <EmailInput
            ref={emailRef}
            label={t('auth.email')}
            value={values.email}
            onChange={(event) => setField('email', event.target.value)}
            onBlur={() => handleBlur('email')}
            error={errors.email ? resolveValidationMessage(t, errors.email) : undefined}
            maxWidth="full"
            required
          />
          <PasswordInput
            ref={passwordRef}
            label={t('auth.password')}
            autoComplete="new-password"
            value={values.password}
            onChange={(event) => setField('password', event.target.value)}
            onBlur={() => handleBlur('password')}
            error={errors.password ? resolveValidationMessage(t, errors.password) : undefined}
            maxWidth="full"
            required
          />
          <PasswordInput
            ref={passwordConfirmRef}
            label={t('auth.register.confirmPassword')}
            autoComplete="new-password"
            value={values.passwordConfirm}
            onChange={(event) => setField('passwordConfirm', event.target.value)}
            onBlur={() => handleBlur('passwordConfirm')}
            error={errors.passwordConfirm ? resolveValidationMessage(t, errors.passwordConfirm) : undefined}
            maxWidth="full"
            required
          />
          <FormError errorKey={submitError} />
          <FormActions align="stretch">
            <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
              {t('auth.register.submit')}
            </Button>
          </FormActions>
        </form>

        <div className={styles.footerLinks}>
          <p>
            {t('auth.register.haveAccount')} <Link to="/sign-in">{t('auth.register.signInLink')}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
