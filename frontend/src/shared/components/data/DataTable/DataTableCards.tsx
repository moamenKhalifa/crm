import type { ReactNode } from 'react';

import { useT } from '@shared/i18n';

import { DataTableRowActions } from './DataTableRowActions';
import type { DataTableColumn, DataTableRowAction } from './types';
import styles from './DataTableCards.module.css';

function cellContent<T>(column: DataTableColumn<T>, row: T): ReactNode {
  return column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '');
}

export interface DataTableCardsProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey(row: T): string;
  rowActions?: (row: T) => DataTableRowAction<T>[];
  rowLabel?: (row: T) => string;
  registerFirstActionRef?(key: string, el: HTMLButtonElement | null): void;
  isRefetching?: boolean;
}

/**
 * Mobile (< 768px) card layout — one `<article>` per row. Every column is
 * shown here, including `hideBelow: 'tablet'` ones (those only hide in the
 * desktop table, per AC — the card view has no column-width pressure).
 */
export function DataTableCards<T>({
  columns,
  rows,
  rowKey,
  rowActions,
  rowLabel,
  registerFirstActionRef,
  isRefetching,
}: DataTableCardsProps<T>) {
  const { t } = useT();
  const [primaryColumn, ...restColumns] = columns;

  return (
    <ul className={styles.list} aria-busy={isRefetching || undefined}>
      {rows.map((row) => {
        const key = rowKey(row);
        const label = rowLabel ? rowLabel(row) : key;
        const actions = rowActions ? rowActions(row) : [];
        return (
          <li key={key} className={styles.item}>
            <article className={styles.card} aria-label={label}>
              {primaryColumn && (
                <h3 className={styles.heading}>
                  {primaryColumn.dir === 'ltr' ? (
                    <span dir="ltr">{cellContent(primaryColumn, row)}</span>
                  ) : (
                    cellContent(primaryColumn, row)
                  )}
                </h3>
              )}
              {restColumns.length > 0 && (
                <dl className={styles.fields}>
                  {restColumns.map((column) => (
                    <div key={column.key} className={styles.field}>
                      <dt className={styles.fieldLabel}>{t(column.labelKey)}</dt>
                      <dd className={styles.fieldValue}>
                        {column.dir === 'ltr' ? (
                          <span dir="ltr">{cellContent(column, row)}</span>
                        ) : (
                          cellContent(column, row)
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {rowActions && (
                <div className={styles.actionsRow}>
                  <DataTableRowActions
                    row={row}
                    actions={actions}
                    rowLabel={label}
                    registerFirstActionRef={(el) => registerFirstActionRef?.(key, el)}
                  />
                </div>
              )}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
