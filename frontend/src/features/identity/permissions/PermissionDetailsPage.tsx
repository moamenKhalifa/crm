import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@features/authentication/AuthProvider';
import { useApiClient } from '@shared/api';
import { PermissionGate } from '@shared/authorization';
import { AsyncBoundary, Button, ConfirmDialog, useToast } from '@shared/components';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';

import { deletePermission, getPermission } from './api';

export default function PermissionDetailsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const client = useApiClient();
  const { permissions: currentUserPermissions, reloadAuthContext } = useAuth();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const query = useApiData({ fetch: (c) => getPermission(c, id), deps: [id] });

  const handleDelete = async (code: string) => {
    setConfirmDeleteOpen(false);
    try {
      await deletePermission(client, id);
      toast.show({ variant: 'success', message: t('admin.permissions.toasts.deleted') });
      // Deleting a permission the current admin's own effective set includes
      // must not leave it lingering in memory once the backend has revoked it.
      if (currentUserPermissions.includes(code)) {
        await reloadAuthContext();
      }
      navigate('/admin/permissions');
    } catch {
      toast.show({ variant: 'danger', message: t('errors.unexpected') });
    }
  };

  return (
    <AsyncBoundary query={query}>
      {(permission) => (
        <div>
          <h1>
            <code>{permission.code}</code>
          </h1>
          {permission.description && <p>{permission.description}</p>}

          {/* No backend endpoint exposes which roles reference a permission
              (see `backend/.../api/routers/permissions.py`) — omitted per
              plan, documented as a follow-up rather than guessed at. */}

          <PermissionGate permission="Permission.Delete">
            <Button variant="danger-subtle" onClick={() => setConfirmDeleteOpen(true)}>
              {t('admin.permissions.actions.delete')}
            </Button>
          </PermissionGate>

          <ConfirmDialog
            open={confirmDeleteOpen}
            onClose={() => setConfirmDeleteOpen(false)}
            onConfirm={() => void handleDelete(permission.code)}
            title={t('admin.permissions.confirmDelete.title')}
            variant="danger"
          >
            <p>{t('admin.permissions.confirmDelete.body')}</p>
          </ConfirmDialog>
        </div>
      )}
    </AsyncBoundary>
  );
}
