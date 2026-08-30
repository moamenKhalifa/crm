import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { isApiError, isUnauthorized } from '@shared/api';
import { Button } from '@shared/components/button/Button';
import { Checkbox } from '@shared/components/form/Checkbox';
import { EmailInput } from '@shared/components/form/EmailInput';
import { FormActions } from '@shared/components/form/FormActions';
import { FormError } from '@shared/components/form/FormError';
import { PasswordInput } from '@shared/components/form/PasswordInput';
import { useT } from '@shared/i18n';
import { emailSchema, useForm } from '@shared/validation';

import { useAuth } from './AuthProvider';

interface SignInFormValues extends Record<string, string> {
  email: string;
  password: string;
}

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.required'),
});

export default function SignInPage() {
  const { t } = useT();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rememberMe, setRememberMe] = useState(false);

  const { values, errors, setField, handleSubmit, isSubmitting, submitError } = useForm<SignInFormValues>({
    initial: { email: '', password: '' },
    schema: signInSchema,
    onSubmit: async (formValues) => {
      try {
        await signIn({ email: formValues.email, password: formValues.password, rememberMe });
        const from = (location.state as { from?: string } | null)?.from ?? '/agent';
        navigate(from, { replace: true });
      } catch (error) {
        if (isApiError(error) && isUnauthorized(error)) {
          throw new Error('auth.errors.invalidCredentials');
        }
        throw new Error('errors.unexpected');
      }
    },
  });

  return (
    <main>
      <h1>{t('auth.signIn')}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <EmailInput
          label={t('auth.email')}
          value={values.email}
          onChange={(event) => setField('email', event.target.value)}
          error={errors.email ? t(errors.email) : undefined}
          required
        />
        <PasswordInput
          label={t('auth.password')}
          value={values.password}
          onChange={(event) => setField('password', event.target.value)}
          error={errors.password ? t(errors.password) : undefined}
          required
        />
        <Checkbox
          label={t('auth.rememberMe')}
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
        />
        <FormError errorKey={submitError} />
        <FormActions>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {t('auth.signIn')}
          </Button>
        </FormActions>
      </form>
    </main>
  );
}
