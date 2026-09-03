import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import type { RoleSummaryResponse } from '@features/authentication/api';
import { listRoles } from '@features/identity/roles/api';
import { hasErrorCode, isApiError, isConflict, isValidationError, useApiClient } from '@shared/api';
import {
  Button,
  Checkbox,
  EmailInput,
  FormActions,
  FormError,
  PasswordInput,
  TextInput,
  useToast,
} from '@shared/components';
import { useT } from '@shared/i18n';
import {
  emailSchema,
  nonEmptyStringSchema,
  passwordSchema,
  resolveValidationMessage,
  useForm,
} from '@shared/validation';

import { createUser } from './api';

interface CreateUserFormValues extends Record<string, string> {
  email: string;
  password: string;
  full_name: string;
}

const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: nonEmptyStringSchema.max(200, 'validation.maxLength|200'),
});

export default function UserCreatePage() {
  const { t } = useT();
  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [isCustomer, setIsCustomer] = useState(false);
  const [roles, setRoles] = useState<RoleSummaryResponse[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    listRoles(client, { limit: 100, offset: 0 })
      .then(setRoles)
      .catch(() => {
        // Role checkboxes stay empty — the form still works without them.
      });
  }, [client]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  // mode omitted — retains submit-only validation
  const { values, errors, setField, handleSubmit, isSubmitting, submitError } = useForm<CreateUserFormValues>({
    initial: { email: '', password: '', full_name: '' },
    schema: createUserSchema,
    onSubmit: async (formValues) => {
      try {
        await createUser(client, {
          email: formValues.email,
          password: formValues.password,
          full_name: formValues.full_name,
          is_customer: isCustomer,
          role_ids: Array.from(selectedRoleIds),
        });
        // Never retain the password once the account has been created.
        setField('password', '');
        toast.show({ variant: 'success', message: t('admin.users.toasts.created') });
        navigate('..');
      } catch (error) {
        if (isConflict(error) && hasErrorCode(error, 'duplicate_account')) {
          throw new Error('admin.users.errors.duplicateAccount');
        }
        if (isApiError(error) && isValidationError(error)) {
          throw new Error('admin.users.errors.validation');
        }
        throw new Error('errors.unexpected');
      }
    },
  });

  return (
    <main>
      <h1>{t('admin.users.create')}</h1>
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
        <PasswordInput
          label={t('auth.password')}
          autoComplete="new-password"
          value={values.password}
          onChange={(event) => setField('password', event.target.value)}
          error={errors.password ? resolveValidationMessage(t, errors.password) : undefined}
          required
        />
        <Checkbox
          label={t('admin.users.fields.isCustomer')}
          checked={isCustomer}
          onChange={(event) => setIsCustomer(event.target.checked)}
        />
        <fieldset>
          <legend>{t('admin.users.fields.roles')}</legend>
          {roles.map((role) => (
            <Checkbox
              key={role.id}
              label={role.name}
              checked={selectedRoleIds.has(role.id)}
              onChange={() => toggleRole(role.id)}
            />
          ))}
        </fieldset>
        <FormError errorKey={submitError} />
        <FormActions>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {t('admin.users.create')}
          </Button>
        </FormActions>
      </form>
    </main>
  );
}
