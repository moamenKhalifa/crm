import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@features/authentication/AuthProvider';
import type { UserResponse } from '@features/authentication/api';
import { useApiClient } from '@shared/api';
import { PermissionGate } from '@shared/authorization';
import { AsyncBoundary, Badge, Button, ConfirmDialog, useToast } from '@shared/components';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';

import { deleteUser, getUser } from './api';
import { UserActivationToggle } from './UserActivationToggle';
import { UserRoleAssignModal } from './UserRoleAssignModal';

export default function UserDetailsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const client = useApiClient();
  const { user: currentUser } = useAuth();

  const [overrideUser, setOverrideUser] = useState<UserResponse | null>(null);
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const query = useApiData({ fetch: (c) => getUser(c, id), deps: [id] });
  const user = overrideUser ?? query.data;
  const isSelf = user?.id === currentUser?.id;

  const handleDelete = async () => {
    if (!user) {
      return;
    }
    setConfirmDeleteOpen(false);
    try {
      await deleteUser(client, user.id);
      toast.show({ variant: 'success', message: t('admin.users.toasts.deleted') });
      navigate('/admin/users');
    } catch {
      toast.show({ variant: 'danger', message: t('errors.unexpected') });
    }
  };

  return (
    <AsyncBoundary query={query}>
      {() =>
        user && (
          <div>
            <h1>{user.full_name}</h1>
            <p>{user.email}</p>
            <p>{user.is_customer ? t('admin.users.customer') : t('admin.users.staff')}</p>

            <PermissionGate permission="User.Update">
              <UserActivationToggle user={user} disabled={isSelf} onChanged={setOverrideUser} />
            </PermissionGate>

            <section>
              <h2>{t('admin.users.rolesSection.title')}</h2>
              {user.roles.map((role) => (
                <Badge key={role.id}>{role.name}</Badge>
              ))}
              <PermissionGate permission="User.AssignRole">
                <Button variant="secondary" onClick={() => setRolesModalOpen(true)}>
                  {t('admin.users.rolesSection.manage')}
                </Button>
              </PermissionGate>
            </section>

            <PermissionGate permission="User.Delete">
              <Button
                variant="danger-subtle"
                disabled={isSelf}
                onClick={() => setConfirmDeleteOpen(true)}
                disabledReason={isSelf ? t('admin.common.actions.reason.cannotDeleteSelf') : undefined}
              >
                {t('admin.users.actions.delete')}
              </Button>
            </PermissionGate>

            <UserRoleAssignModal
              open={rolesModalOpen}
              onClose={() => setRolesModalOpen(false)}
              user={user}
              onSaved={setOverrideUser}
            />
            <ConfirmDialog
              open={confirmDeleteOpen}
              onClose={() => setConfirmDeleteOpen(false)}
              onConfirm={() => void handleDelete()}
              title={t('admin.users.confirmDelete.title')}
              variant="danger"
            >
              <p>{t('admin.users.confirmDelete.body')}</p>
            </ConfirmDialog>
          </div>
        )
      }
    </AsyncBoundary>
  );
}
