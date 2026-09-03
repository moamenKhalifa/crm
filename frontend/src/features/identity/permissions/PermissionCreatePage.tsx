import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { hasErrorCode, isApiError, isConflict, isValidationError, useApiClient } from '@shared/api';
import { Button, FormActions, FormError, TextInput, useToast } from '@shared/components';
import { useT } from '@shared/i18n';
import { resolveValidationMessage, useForm } from '@shared/validation';

import { createPermission } from './api';

interface CreatePermissionFormValues extends Record<string, string> {
  code: string;
  description: string;
}

// `Section.Action` convention (matches the seeded values in
// `backend/.../infrastructure/seed.py`) — this is a UX hint only, the
// backend does not enforce the format.
const CODE_PATTERN = /^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)*$/;

const createPermissionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(150, 'validation.maxLength|150')
    .regex(CODE_PATTERN, 'admin.permissions.errors.codeFormat'),
  description: z.string().max(500, 'validation.maxLength|500'),
});

export default function PermissionCreatePage() {
  const { t } = useT();
  const client = useApiClient();
  const toast = useToast();
  const navigate = useNavigate();

  const { values, errors, setField, handleSubmit, isSubmitting, submitError } =
    // mode omitted — retains submit-only validation
    useForm<CreatePermissionFormValues>({
      initial: { code: '', description: '' },
      schema: createPermissionSchema,
      onSubmit: async (formValues) => {
        try {
          await createPermission(client, {
            code: formValues.code,
            description: formValues.description.trim() || null,
          });
          toast.show({ variant: 'success', message: t('admin.permissions.toasts.created') });
          navigate('..');
        } catch (error) {
          if (isConflict(error) && hasErrorCode(error, 'duplicate_permission')) {
            throw new Error('admin.permissions.errors.duplicatePermission');
          }
          if (isApiError(error) && isValidationError(error)) {
            throw new Error('admin.permissions.errors.validation');
          }
          throw new Error('errors.unexpected');
        }
      },
    });

  return (
    <main>
      <h1>{t('admin.permissions.create')}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <TextInput
          label={t('admin.permissions.fields.code')}
          hint={t('admin.permissions.fields.codeHint')}
          value={values.code}
          onChange={(event) => setField('code', event.target.value)}
          error={errors.code ? resolveValidationMessage(t, errors.code) : undefined}
          required
        />
        <TextInput
          label={t('admin.permissions.fields.description')}
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
          error={errors.description ? resolveValidationMessage(t, errors.description) : undefined}
        />
        <FormError errorKey={submitError} />
        <FormActions>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {t('admin.permissions.create')}
          </Button>
        </FormActions>
      </form>
    </main>
  );
}
