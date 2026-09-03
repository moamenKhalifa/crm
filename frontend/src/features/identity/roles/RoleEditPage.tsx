import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { useAuth } from '@features/authentication/AuthProvider';
import type { RoleSummaryResponse } from '@features/authentication/api';
import { isApiError, isValidationError, useApiClient } from '@shared/api';
import { AsyncBoundary, Button, FormActions, FormError, TextInput, useToast } from '@shared/components';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';
import { resolveValidationMessage, useForm } from '@shared/validation';

import { getRole, updateRole } from './api';

interface EditRoleFormValues extends Record<string, string> {
  name: string;
  description: string;
}

const editRoleSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(100, 'validation.maxLength|100'),
  description: z.string().max(500, 'validation.maxLength|500'),
});

function RoleEditForm({ role, onSaved }: { role: RoleSummaryResponse; onSaved(): void }) {
  const { t } = useT();
  const client = useApiClient();
  const { roles: currentUserRoles, reloadAuthContext } = useAuth();

  // mode omitted — retains submit-only validation
  const { values, errors, setField, handleSubmit, isSubmitting, submitError } = useForm<EditRoleFormValues>({
    initial: { name: role.name, description: role.description ?? '' },
    schema: editRoleSchema,
    onSubmit: async (formValues) => {
      try {
        const body: { name?: string; description?: string | null } = {};
        if (formValues.name !== role.name) {
          body.name = formValues.name;
        }
        const nextDescription = formValues.description.trim() || null;
        if (nextDescription !== (role.description ?? null)) {
          body.description = nextDescription;
        }
        await updateRole(client, role.id, body);
        // The role NAME is what `useAuthorization().hasRole` matches (see
        // `AuthProvider.tsx`'s `roles: me.roles.map((r) => r.name)`) —
        // renaming a role the current admin holds must refresh the session.
        if (currentUserRoles.includes(role.name)) {
          await reloadAuthContext();
        }
        onSaved();
      } catch (error) {
        if (isApiError(error) && isValidationError(error)) {
          throw new Error('admin.roles.errors.validation');
        }
        throw new Error('errors.unexpected');
      }
    },
  });

  return (
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
          {t('admin.roles.actions.save')}
        </Button>
      </FormActions>
    </form>
  );
}

export default function RoleEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useT();
  const toast = useToast();
  const navigate = useNavigate();

  const query = useApiData({ fetch: (c) => getRole(c, id), deps: [id] });

  return (
    <main>
      <h1>{t('admin.roles.editTitle')}</h1>
      <AsyncBoundary query={query}>
        {(role) => (
          <RoleEditForm
            role={role}
            onSaved={() => {
              toast.show({ variant: 'success', message: t('admin.roles.toasts.updated') });
              navigate(`/admin/roles/${id}`);
            }}
          />
        )}
      </AsyncBoundary>
    </main>
  );
}
