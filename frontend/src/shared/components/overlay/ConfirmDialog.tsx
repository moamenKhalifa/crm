import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';

import { Button, type ButtonVariant } from '@shared/components/button/Button';
import { TextInput } from '@shared/components/form/TextInput';
import { useT } from '@shared/i18n';

import { Modal } from './Modal';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  open: boolean;
  onClose(): void;
  onConfirm(): void;
  title: string;
  variant?: ButtonVariant;
  /** Forces the Confirm button to `variant="danger"`, regardless of `variant`. */
  destructive?: boolean;
  /** The real consequence — e.g. "Delete user Alice (owner of 3 tickets)" — rendered in the body. */
  consequence?: ReactNode;
  /** When set, Confirm stays disabled until the user types this exact phrase. */
  confirmationPhrase?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  children?: ReactNode;
}

/** Unicode-normalised, trimmed — but never lower-cased: the phrase is case-sensitive by design, so the user has to actually read it. */
function normalize(value: string): string {
  return value.normalize('NFC').trim();
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  variant = 'primary',
  destructive = false,
  consequence,
  confirmationPhrase,
  confirmLabel,
  cancelLabel,
  children,
}: ConfirmDialogProps) {
  const { t } = useT();
  const [typed, setTyped] = useState('');

  // Reset the typed value every time the dialog (re)opens — it stays mounted
  // (with its state) between opens since `Modal` only unmounts its content,
  // not `ConfirmDialog` itself.
  useEffect(() => {
    if (open) {
      setTyped('');
    }
  }, [open]);

  const effectiveVariant: ButtonVariant = destructive ? 'danger' : variant;
  const confirmationRequired = Boolean(confirmationPhrase);
  const confirmationSatisfied = !confirmationRequired || normalize(typed) === normalize(confirmationPhrase ?? '');

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && confirmationSatisfied) {
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
          <Button variant={effectiveVariant} onClick={onConfirm} disabled={!confirmationSatisfied}>
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      }
    >
      <div onKeyDown={handleKeyDown}>
        {consequence && <div className={styles.consequence}>{consequence}</div>}
        {children}
        {confirmationRequired && (
          <TextInput
            label={t('dialog.typeToConfirm', { phrase: confirmationPhrase })}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
          />
        )}
      </div>
    </Modal>
  );
}
