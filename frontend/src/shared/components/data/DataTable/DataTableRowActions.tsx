import { Button } from '@shared/components/button/Button';
import { Dropdown, type DropdownItem } from '@shared/components/overlay/Dropdown';
import { useT } from '@shared/i18n';

import type { DataTableRowAction } from './types';
import styles from './DataTableRowActions.module.css';

const INLINE_LIMIT = 3;

export interface DataTableRowActionsProps<T> {
  row: T;
  actions: DataTableRowAction<T>[];
  rowLabel: string;
  /** Attached to the first rendered action button — used by `DataTable` to restore focus after a row is removed. */
  registerFirstActionRef?: (el: HTMLButtonElement | null) => void;
}

export function DataTableRowActions<T>({ row, actions, rowLabel, registerFirstActionRef }: DataTableRowActionsProps<T>) {
  const { t } = useT();

  if (actions.length === 0) {
    return null;
  }

  const overflow = actions.length > INLINE_LIMIT;
  const inlineActions = overflow ? actions.slice(0, 2) : actions;
  const overflowActions = overflow ? actions.slice(2) : [];

  return (
    <div className={styles.actions}>
      {inlineActions.map((action, index) => {
        const isDisallowed = action.isAllowed === false;
        return (
          <Button
            key={action.key}
            ref={index === 0 ? registerFirstActionRef : undefined}
            variant={action.variant === 'danger' ? 'danger-subtle' : 'tertiary'}
            size="sm"
            disabled={isDisallowed}
            disabledReason={isDisallowed ? action.disabledReason : undefined}
            aria-label={`${t(action.labelKey)} — ${rowLabel}`}
            leadingIcon={action.icon}
            onClick={() => action.onSelect(row)}
          >
            {t(action.labelKey)}
          </Button>
        );
      })}
      {overflow && (
        <Dropdown
          align="end"
          trigger={
            <>
              <span aria-hidden="true">⋯</span>
              <span className={styles.srOnly}>{t('dataTable.moreActions', { row: rowLabel })}</span>
            </>
          }
          items={overflowActions.map<DropdownItem>((action) => ({
            key: action.key,
            label: (
              <>
                {t(action.labelKey)}
                {action.isAllowed === false && action.disabledReason && (
                  <span className={styles.disabledHint}> ({action.disabledReason})</span>
                )}
              </>
            ),
            disabled: action.isAllowed === false,
            onSelect: () => action.onSelect(row),
          }))}
        />
      )}
    </div>
  );
}
