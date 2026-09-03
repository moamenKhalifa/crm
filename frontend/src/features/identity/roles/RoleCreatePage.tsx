import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { hasErrorCode, isApiError, isConflict, isValidationError, useApiClient } from '@shared/api';
import { Button, FormActions, FormError, TextInput, useToast } from '@shared/components';
import { useT } from '@shared/i18n';
import { resolveValidationMessage, useForm } from '@shared/validation';

import { createRole } from './api';

interface CreateRoleFormValues extends Record<string, string> {
  name: string;
  description: string;
}

const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(100, 'validation.maxLength|100'),
  description: z.string().max(500, 'validation.maxLength|500'),
});

export default function RoleCreatePage() {
  const { t } = useT();
  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();

  // mode omitted — retains submit-only validation
  const { values, errors, setField, handleSubmit, isSubmitting, submitError } = useForm<CreateRoleFormValues>({
    initial: { name: '', description: '' },
    schema: createRoleSchema,
    onSubmit: async (formValues) => {
      try {
        await createRole(client, {
          name: formValues.name,
          description: formValues.description.trim() || null,
        });
        toast.show({ variant: 'success', message: t('admin.roles.toasts.created') });
        navigate('..');
      } catch (error) {
        if (isConflict(error) && hasErrorCode(error, 'duplicate_role')) {
          throw new Error('admin.roles.errors.duplicateRole');
        }
        if (isApiError(error) && isValidationError(error)) {
          throw new Error('admin.roles.errors.validation');
        }
        throw new Error('errors.unexpected');
      }
    },
  });

  return (
    <main>
      <h1>{t('admin.roles.create')}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          label={t('admin.roles.fields.name')}
          value={values.name}
          onChange={(event) => setField('name', event.target.value)}
          error={errors.name ? resolveValidationMessage(t, errors.name) : undefined}
          required
        />
        <TextInput
          label={t('admin.roles.fields.description')}
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
          error={errors.description ? resolveValidationMessage(t, errors.description) : undefined}
        />
        <FormError errorKey={submitError} />
        <FormActions>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {t('admin.roles.create')}
          </Button>
        </FormActions>
      </form>
    </main>
  );
}
