import { useEffect, useState } from 'react';

import { useAuth } from '@features/authentication/AuthProvider';
import type { RoleSummaryResponse, UserResponse } from '@features/authentication/api';
import { listRoles } from '@features/identity/roles/api';
import { useApiClient } from '@shared/api';
import { Button, Checkbox, Modal, useToast } from '@shared/components';
import { useT } from '@shared/i18n';

import { assignRoles } from './api';

export interface UserRoleAssignModalProps {
  open: boolean;
  onClose(): void;
  user: UserResponse;
  onSaved(user: UserResponse): void;
}

export function UserRoleAssignModal({ open, onClose, user, onSaved }: UserRoleAssignModalProps) {
  const { t } = useT();
  const client = useApiClient();
  const toast = useToast();
  const { user: currentUser, reloadAuthContext } = useAuth();

  const [roles, setRoles] = useState<RoleSummaryResponse[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelected(new Set(user.roles.map((role) => role.id)));
    setIsLoading(true);
    listRoles(client, { limit: 100, offset: 0 })
      .then(setRoles)
      .catch(() => toast.show({ variant: 'danger', message: t('errors.unexpected') }))
      .finally(() => setIsLoading(false));
  }, [open, client, user, t, toast]);

  const toggle = (roleId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await assignRoles(client, user.id, Array.from(selected).sort());
      onSaved(updated);
      toast.show({ variant: 'success', message: t('admin.users.toasts.rolesUpdated') });
      // The admin may have just changed their own roles — re-hydrate the
      // session's permission set immediately rather than waiting for a
      // future request to eventually 403 and force a re-login.
      if (currentUser?.id === user.id) {
        await reloadAuthContext();
      }
      onClose();
    } catch {
      toast.show({ variant: 'danger', message: t('admin.users.errors.assignFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('admin.users.assignRoles.title')}
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
          {roles.map((role) => (
            <Checkbox
              key={role.id}
              label={role.name}
              checked={selected.has(role.id)}
              onChange={() => toggle(role.id)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
