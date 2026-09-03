import type { KeyboardEvent, ReactNode } from 'react';

import { Button, type ButtonVariant } from '@shared/components/button/Button';
import { useT } from '@shared/i18n';

import { Modal } from './Modal';
import styles from './ConfirmDialog.module.css';

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
        // Physical DOM order is always [Cancel][Confirm] — `.actions:dir(rtl)`
        // flips it visually so Confirm still sits on the reading-end side in
        // both directions, with no JS branch (AC per the intake).
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button variant={variant} onClick={onConfirm}>
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      }
    >
      <div onKeyDown={handleKeyDown}>{children}</div>
    </Modal>
  );
}
