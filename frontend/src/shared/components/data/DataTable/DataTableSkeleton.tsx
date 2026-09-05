import { useT } from '@shared/i18n';

import type { DataTableColumn } from './types';
import styles from './DataTableSkeleton.module.css';

export interface DataTableSkeletonProps<T> {
  columns: DataTableColumn<T>[];
  rowCount: number;
  hasActionsColumn?: boolean;
}

/**
 * Shimmer placeholder rows rendered inside the live `<tbody>` while the
 * first page of data is still loading (header stays rendered/visible).
 * The shimmer rows themselves are `aria-hidden` — a single visually-hidden
 * status row carries the "Loading" announcement for assistive tech (G9).
 */
export function DataTableSkeleton<T>({ columns, rowCount, hasActionsColumn }: DataTableSkeletonProps<T>) {
  const { t } = useT();
  const totalColumns = columns.length + (hasActionsColumn ? 1 : 0);

  return (
    <>
      <tr>
        <td colSpan={totalColumns} className={styles.srOnlyCell}>
          <span role="status" className={styles.srOnly}>
            {t('dataTable.loading')}
          </span>
        </td>
      </tr>
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <tr key={rowIndex} aria-hidden="true" className={styles.skeletonRow}>
          {columns.map((column) => (
            <td key={column.key} className={styles.skeletonCell}>
              <span
                className={styles.skeletonBlock}
                style={column.skeletonWidth ? { inlineSize: `${column.skeletonWidth}ch` } : undefined}
              />
            </td>
          ))}
          {hasActionsColumn && (
            <td className={styles.skeletonCell}>
              <span className={styles.skeletonBlock} style={{ inlineSize: '6ch' }} />
            </td>
          )}
        </tr>
      ))}
    </>
  );
}
