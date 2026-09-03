import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@features/authentication/AuthProvider';
import { useApiClient } from '@shared/api';
import { PermissionGate } from '@shared/authorization';
import { AsyncBoundary, Badge, Button, ConfirmDialog, useToast } from '@shared/components';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';

import { deleteRole, getRole, getRolePermissions, removeRolePermissions } from './api';
import { RolePermissionAssignModal } from './RolePermissionAssignModal';

export default function RoleDetailsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const client = useApiClient();
  const { roles: currentUserRoles, reloadAuthContext } = useAuth();

  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const roleQuery = useApiData({ fetch: (c) => getRole(c, id), deps: [id] });
  const permissionsQuery = useApiData({ fetch: (c) => getRolePermissions(c, id), deps: [id] });

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      await deleteRole(client, id);
      toast.show({ variant: 'success', message: t('admin.roles.toasts.deleted') });
      navigate('/admin/roles');
    } catch {
      toast.show({ variant: 'danger', message: t('errors.unexpected') });
    }
  };

  const handleRemovePermission = async (permissionId: string, roleName: string) => {
    try {
      await removeRolePermissions(client, id, [permissionId]);
      permissionsQuery.reload();
      if (currentUserRoles.includes(roleName)) {
        await reloadAuthContext();
      }
    } catch {
      toast.show({ variant: 'danger', message: t('admin.roles.errors.assignFailed') });
    }
  };

  return (
    <AsyncBoundary query={roleQuery}>
      {(role) => (
        <div>
          <h1>{role.name}</h1>
          {role.description && <p>{role.description}</p>}

          <section>
            <h2>{t('admin.roles.permissionsSection.title')}</h2>
            <AsyncBoundary query={permissionsQuery}>
              {(permissions) => (
                <>
                  {permissions.map((permission) => (
                    <Badge key={permission.id}>
                      {permission.code}
                      <PermissionGate permission="Role.AssignPermission">
                        <button
                          type="button"
                          aria-label={t('admin.roles.permissionsSection.remove', { code: permission.code })}
                          onClick={() => void handleRemovePermission(permission.id, role.name)}
                        >
                          ×
                        </button>
                      </PermissionGate>
                    </Badge>
                  ))}
                  <PermissionGate permission="Role.AssignPermission">
                    <Button variant="secondary" onClick={() => setPermissionsModalOpen(true)}>
                      {t('admin.roles.permissionsSection.manage')}
                    </Button>
                  </PermissionGate>
                  <RolePermissionAssignModal
                    open={permissionsModalOpen}
                    onClose={() => setPermissionsModalOpen(false)}
                    role={role}
                    currentPermissions={permissions}
                    onSaved={() => permissionsQuery.reload()}
                  />
                </>
              )}
            </AsyncBoundary>
          </section>

          <PermissionGate permission="Role.Delete">
            <Button variant="danger-subtle" onClick={() => setConfirmDeleteOpen(true)}>
              {t('admin.roles.actions.delete')}
            </Button>
          </PermissionGate>

          <ConfirmDialog
            open={confirmDeleteOpen}
            onClose={() => setConfirmDeleteOpen(false)}
            onConfirm={() => void handleDelete()}
            title={t('admin.roles.confirmDelete.title')}
            variant="danger"
          >
            <p>{t('admin.roles.confirmDelete.body')}</p>
          </ConfirmDialog>
        </div>
      )}
    </AsyncBoundary>
  );
}
