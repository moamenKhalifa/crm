import { useEffect, useState } from 'react';

import { useAuth } from '@features/authentication/AuthProvider';
import type { PermissionSummaryResponse, RoleSummaryResponse } from '@features/authentication/api';
import { listPermissions } from '@features/identity/permissions/api';
import { useApiClient } from '@shared/api';
import { Button, Checkbox, Modal, useToast } from '@shared/components';
import { useT } from '@shared/i18n';

import { assignRolePermissions, removeRolePermissions } from './api';

export interface RolePermissionAssignModalProps {
  open: boolean;
  onClose(): void;
  role: RoleSummaryResponse;
  currentPermissions: PermissionSummaryResponse[];
  onSaved(): void;
}

/**
 * `PUT .../permissions` only ADDS ids to the role's set and `DELETE
 * .../permissions` only removes them (see `api.ts`) — there is no single
 * "replace the whole set" call. Saving here diffs the checked selection
 * against the role's original permissions and issues whichever of the two
 * calls are actually needed.
 */
export function RolePermissionAssignModal({
  open,
  onClose,
  role,
  currentPermissions,
  onSaved,
}: RolePermissionAssignModalProps) {
  const { t } = useT();
  const client = useApiClient();
  const toast = useToast();
  const { roles: currentUserRoles, reloadAuthContext } = useAuth();

  const [allPermissions, setAllPermissions] = useState<PermissionSummaryResponse[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelected(new Set(currentPermissions.map((permission) => permission.id)));
    setIsLoading(true);
    listPermissions(client, { limit: 100, offset: 0 })
      .then(setAllPermissions)
      .catch(() => toast.show({ variant: 'danger', message: t('errors.unexpected') }))
      .finally(() => setIsLoading(false));
  }, [open, client, currentPermissions, t, toast]);

  const toggle = (permissionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const originalIds = new Set(currentPermissions.map((permission) => permission.id));
    const toAdd = Array.from(selected).filter((id) => !originalIds.has(id));
    const toRemove = Array.from(originalIds).filter((id) => !selected.has(id));

    if (toAdd.length === 0 && toRemove.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      if (toAdd.length > 0) {
        await assignRolePermissions(client, role.id, toAdd);
      }
      if (toRemove.length > 0) {
        await removeRolePermissions(client, role.id, toRemove);
      }
      toast.show({ variant: 'success', message: t('admin.roles.toasts.permissionsUpdated') });
      // The parent owns the permissions query and reloads it via `onSaved`,
      // so this modal doesn't need to re-fetch the role's permissions itself.
      if (currentUserRoles.includes(role.name)) {
        await reloadAuthContext();
      }
      onSaved();
      onClose();
    } catch {
      toast.show({ variant: 'danger', message: t('admin.roles.errors.assignFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('admin.roles.assignPermissions.title')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={() => void handleSave()} loading={isSaving}>
            {t('common.confirm')}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <p>{t('states.loading')}</p>
      ) : (
        <div>
          {allPermissions.map((permission) => (
            <Checkbox
              key={permission.id}
              label={permission.code}
              checked={selected.has(permission.id)}
              onChange={() => toggle(permission.id)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
