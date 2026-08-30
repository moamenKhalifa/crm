import type { KeyboardEvent, ReactNode } from 'react';

import { Button, type ButtonVariant } from '@shared/components/button/Button';
import { useT } from '@shared/i18n';

import { Modal } from './Modal';

export interface ConfirmDialogProps {
  open: boolean;
  onClose(): void;
  onConfirm(): void;
  title?: string;
  variant?: ButtonVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  variant = 'primary',
  confirmLabel,
  cancelLabel,
  children,
}: ConfirmDialogProps) {
  const { t } = useT();

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </>
      }
    >
      <div onKeyDown={handleKeyDown}>{children}</div>
    </Modal>
  );
}
