import { useState } from 'react';

import type { UserResponse } from '@features/authentication/api';
import { useApiClient } from '@shared/api';
import { Button, useToast } from '@shared/components';
import { useT } from '@shared/i18n';

import { setUserActive } from './api';

export interface UserActivationToggleProps {
  user: UserResponse;
  disabled?: boolean;
  onChanged(user: UserResponse): void;
}

/** `disabled` is passed by the caller for the "can't deactivate yourself" edge case. */
export function UserActivationToggle({ user, disabled, onChanged }: UserActivationToggleProps) {
  const { t } = useT();
  const client = useApiClient();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = async () => {
    setIsSubmitting(true);
    try {
      const updated = await setUserActive(client, user.id, !user.is_active);
      onChanged(updated);
      toast.show({
        variant: 'success',
        message: t(updated.is_active ? 'admin.users.toasts.activated' : 'admin.users.toasts.deactivated'),
      });
    } catch {
      toast.show({ variant: 'danger', message: t('errors.unexpected') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={() => void handleToggle()}
      loading={isSubmitting}
      disabled={disabled}
      disabledReason={disabled ? t('admin.common.actions.reason.cannotDeactivateSelf') : undefined}
    >
      {user.is_active ? t('admin.users.actions.deactivate') : t('admin.users.actions.activate')}
    </Button>
  );
}
