import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import type { UserResponse } from '@features/authentication/api';
import { isApiError, isValidationError, useApiClient } from '@shared/api';
import { AsyncBoundary, Button, EmailInput, FormActions, FormError, TextInput, useToast } from '@shared/components';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';
import { emailSchema, nonEmptyStringSchema, resolveValidationMessage, useForm } from '@shared/validation';

import { getUser, updateUser } from './api';

interface EditUserFormValues extends Record<string, string> {
  email: string;
  full_name: string;
}

const editUserSchema = z.object({
  email: emailSchema,
  full_name: nonEmptyStringSchema.max(200, 'validation.maxLength|200'),
});

function UserEditForm({ user, onSaved }: { user: UserResponse; onSaved(): void }) {
  const { t } = useT();
  const client = useApiClient();

  // mode omitted — retains submit-only validation
  const { values, errors, setField, handleSubmit, isSubmitting, submitError } = useForm<EditUserFormValues>({
    initial: { email: user.email, full_name: user.full_name },
    schema: editUserSchema,
    onSubmit: async (formValues) => {
      try {
        // Only send fields that actually changed — `PATCH` semantics.
        const body: { email?: string; full_name?: string } = {};
        if (formValues.email !== user.email) {
          body.email = formValues.email;
        }
        if (formValues.full_name !== user.full_name) {
          body.full_name = formValues.full_name;
        }
        await updateUser(client, user.id, body);
        onSaved();
      } catch (error) {
        if (isApiError(error) && isValidationError(error)) {
          throw new Error('admin.users.errors.validation');
        }
        throw new Error('errors.unexpected');
      }
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <TextInput
        label={t('admin.users.fields.fullName')}
        value={values.full_name}
        onChange={(event) => setField('full_name', event.target.value)}
        error={errors.full_name ? resolveValidationMessage(t, errors.full_name) : undefined}
        required
      />
      <EmailInput
        label={t('auth.email')}
        value={values.email}
        onChange={(event) => setField('email', event.target.value)}
        error={errors.email ? resolveValidationMessage(t, errors.email) : undefined}
        required
      />
      <FormError errorKey={submitError} />
      <FormActions>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {t('admin.users.actions.save')}
        </Button>
      </FormActions>
    </form>
  );
}

export default function UserEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useT();
  const toast = useToast();
  const navigate = useNavigate();

  const query = useApiData({ fetch: (c) => getUser(c, id), deps: [id] });

  return (
    <main>
      <h1>{t('admin.users.editTitle')}</h1>
      <AsyncBoundary query={query}>
        {(user) => (
          <UserEditForm
            user={user}
            onSaved={() => {
              toast.show({ variant: 'success', message: t('admin.users.toasts.updated') });
              navigate(`/admin/users/${id}`);
            }}
          />
        )}
      </AsyncBoundary>
    </main>
  );
}
