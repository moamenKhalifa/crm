import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { useAuth } from '@features/authentication/AuthProvider';
import type { PermissionSummaryResponse } from '@features/authentication/api';
import { isApiError, isValidationError, useApiClient } from '@shared/api';
import { AsyncBoundary, Button, FormActions, FormError, TextInput, useToast } from '@shared/components';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';
import { resolveValidationMessage, useForm } from '@shared/validation';

import { getPermission, updatePermission } from './api';

interface EditPermissionFormValues extends Record<string, string> {
  code: string;
  description: string;
}

const CODE_PATTERN = /^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)*$/;

const editPermissionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(150, 'validation.maxLength|150')
    .regex(CODE_PATTERN, 'admin.permissions.errors.codeFormat'),
  description: z.string().max(500, 'validation.maxLength|500'),
});

function PermissionEditForm({
  permission,
  onSaved,
}: {
  permission: PermissionSummaryResponse;
  onSaved(): void;
}) {
  const { t } = useT();
  const client = useApiClient();
  const { permissions: currentUserPermissions, reloadAuthContext } = useAuth();

  const { values, errors, setField, handleSubmit, isSubmitting, submitError } =
    // mode omitted — retains submit-only validation
    useForm<EditPermissionFormValues>({
      initial: { code: permission.code, description: permission.description ?? '' },
      schema: editPermissionSchema,
      onSubmit: async (formValues) => {
        try {
          const body: { code?: string; description?: string | null } = {};
          if (formValues.code !== permission.code) {
            body.code = formValues.code;
          }
          const nextDescription = formValues.description.trim() || null;
          if (nextDescription !== (permission.description ?? null)) {
            body.description = nextDescription;
          }
          await updatePermission(client, permission.id, body);
          // The admin may be editing a permission code that's part of their
          // own effective set — re-hydrate immediately so a renamed/revoked
          // code doesn't linger in memory after the backend has moved on.
          if (currentUserPermissions.includes(permission.code)) {
            await reloadAuthContext();
          }
          onSaved();
        } catch (error) {
          if (isApiError(error) && isValidationError(error)) {
            throw new Error('admin.permissions.errors.validation');
          }
          throw new Error('errors.unexpected');
        }
      },
    });

  return (
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
          {t('admin.permissions.actions.save')}
        </Button>
      </FormActions>
    </form>
  );
}

export default function PermissionEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useT();
  const toast = useToast();
  const navigate = useNavigate();

  const query = useApiData({ fetch: (c) => getPermission(c, id), deps: [id] });

  return (
    <main>
      <h1>{t('admin.permissions.editTitle')}</h1>
      <AsyncBoundary query={query}>
        {(permission) => (
          <PermissionEditForm
            permission={permission}
            onSaved={() => {
              toast.show({ variant: 'success', message: t('admin.permissions.toasts.updated') });
              navigate(`/admin/permissions/${id}`);
            }}
          />
        )}
      </AsyncBoundary>
    </main>
  );
}
