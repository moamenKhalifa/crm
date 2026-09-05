import { useEffect, useRef, type ReactNode } from 'react';

import { Button } from '@shared/components/button/Button';
import { useT } from '@shared/i18n';
import { useBreakpoint } from '@shared/theme';

import { DataTableCards } from './DataTableCards';
import { DataTableFooter } from './DataTableFooter';
import { DataTableRowActions } from './DataTableRowActions';
import { DataTableSkeleton } from './DataTableSkeleton';
import { DataTableToolbar } from './DataTableToolbar';
import type { DataTableColumn, DataTableProps, DataTableState, SortDir } from './types';
import styles from './DataTable.module.css';

function cellContent<T>(column: DataTableColumn<T>, row: T): ReactNode {
  return column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '');
}

function alignClass<T>(column: DataTableColumn<T>): string | undefined {
  if (column.align === 'end') {
    return styles.alignEnd;
  }
  if (column.align === 'center') {
    return styles.alignCenter;
  }
  return undefined;
}

function hideBelowClass<T>(column: DataTableColumn<T>): string | undefined {
  if (column.hideBelow === 'tablet') {
    return styles.hideBelowTablet;
  }
  if (column.hideBelow === 'desktop') {
    return styles.hideBelowDesktop;
  }
  return undefined;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** none -> asc -> desc -> none. */
function nextSort(current: DataTableState['sort'], key: string): DataTableState['sort'] {
  if (!current || current.key !== key) {
    return { key, dir: 'asc' };
  }
  if (current.dir === 'asc') {
    return { key, dir: 'desc' as SortDir };
  }
  return undefined;
}

function stateFingerprint(state: DataTableState): string {
  return JSON.stringify({
    page: state.page,
    pageSize: state.pageSize,
    sort: state.sort,
    q: state.q,
    filters: state.filters,
  });
}

/**
 * Reusable data table: toolbar (search + filters) + sortable sticky-header
 * table (or a mobile card list below the `tablet` breakpoint) + footer
 * pager. See `frontend/src/shared/components/data/DataTable/types.ts` for
 * the full prop contract.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  totalCount,
  state,
  onStateChange,
  isLoading = false,
  isRefetching = false,
  isError = false,
  errorMessage,
  onRetry,
  emptyState,
  filteredEmptyState,
  rowActions,
  toolbarStart,
  toolbarEnd,
  filters,
  tableLabel,
  onRowRemoved,
  skeletonRowCount,
  rowLabel,
}: DataTableProps<T>) {
  const { t } = useT();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  const searchInputRef = useRef<HTMLInputElement>(null);
  const actionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const prevRowKeysRef = useRef<string[]>([]);
  const prevFingerprintRef = useRef<string>(stateFingerprint(state));

  const hasActiveFilters = Boolean(state.q) || Object.values(state.filters).some((values) => values.length > 0);
  const showSkeleton = isLoading && rows.length === 0;
  const showError = isError && !showSkeleton;
  const showEmpty = !showSkeleton && !showError && rows.length === 0;
  const totalColumns = columns.length + (rowActions ? 1 : 0);

  // Self-managing focus restoration for AC15: whenever the row-key set
  // shrinks *without* the caller having changed page/pageSize/sort/q/
  // filters in between (i.e. a row disappeared because it was deleted and
  // the list was reloaded in place, not because the user paged/filtered
  // away), move focus to a sensible neighbour. This is driven entirely by
  // diffing `rows` — the list page does not need to call `onRowRemoved`
  // itself; `DataTable` calls it (see `types.ts`) purely as an FYI once it
  // has already acted.
  useEffect(() => {
    const currentKeys = rows.map(rowKey);
    const previousKeys = prevRowKeysRef.current;
    const fingerprint = stateFingerprint(state);
    const stateUnchanged = fingerprint === prevFingerprintRef.current;

    if (stateUnchanged && currentKeys.length < previousKeys.length) {
      const removedIndex = previousKeys.findIndex((key) => !currentKeys.includes(key));
      if (removedIndex !== -1) {
        const removedKey = previousKeys[removedIndex];
        if (currentKeys.length === 0) {
          searchInputRef.current?.focus();
        } else {
          const targetIndex = Math.min(removedIndex, currentKeys.length - 1);
          const targetKey = currentKeys[targetIndex];
          actionRefs.current.get(targetKey)?.focus();
        }
        onRowRemoved?.(removedKey);
      }
    }

    prevRowKeysRef.current = currentKeys;
    prevFingerprintRef.current = fingerprint;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not depending on `rowKey`/`onRowRemoved` identity; only `rows`/`state` changes should re-run this diff.
  }, [rows, state]);

  const registerFirstActionRef = (key: string, el: HTMLButtonElement | null) => {
    if (el) {
      actionRefs.current.set(key, el);
    } else {
      actionRefs.current.delete(key);
    }
  };

  const handleSort = (columnKey: string) => {
    onStateChange({ ...state, sort: nextSort(state.sort, columnKey), page: 1 });
  };

  const handleQueryChange = (q: string) => {
    onStateChange({ ...state, q, page: 1 });
  };

  const handleFilterChange = (key: string, values: string[]) => {
    onStateChange({ ...state, filters: { ...state.filters, [key]: values }, page: 1 });
  };

  const handleClearFilters = () => {
    onStateChange({ ...state, q: '', filters: {}, page: 1 });
  };

  const handlePageChange = (page: number) => {
    onStateChange({ ...state, page });
  };

  const handlePageSizeChange = (pageSize: DataTableState['pageSize']) => {
    onStateChange({ ...state, pageSize, page: 1 });
  };

  const ariaSortFor = (columnKey: string): 'ascending' | 'descending' | 'none' => {
    if (state.sort?.key !== columnKey) {
      return 'none';
    }
    return state.sort.dir === 'asc' ? 'ascending' : 'descending';
  };

  const sortIconFor = (columnKey: string): string => {
    if (state.sort?.key !== columnKey) {
      return '⇅';
    }
    return state.sort.dir === 'asc' ? '▲' : '▼';
  };

  const defaultEmpty = (
    <div className={styles.statePanel} role="status">
      <p>{t('dataTable.empty.generic')}</p>
    </div>
  );

  const defaultFilteredEmpty = (
    <div className={styles.statePanel} role="status">
      <p>{t('dataTable.filteredEmpty.generic')}</p>
      <Button variant="tertiary" onClick={handleClearFilters}>
        {t('dataTable.filteredEmpty.clear')}
      </Button>
    </div>
  );

  const errorPanel = (
    <div className={styles.statePanel} role="alert">
      <p>{errorMessage ?? t('dataTable.error.generic')}</p>
      {onRetry && (
        <Button variant="tertiary" onClick={onRetry}>
          {t('dataTable.error.retry')}
        </Button>
      )}
    </div>
  );

  const emptyPanel = hasActiveFilters ? (filteredEmptyState ?? defaultFilteredEmpty) : (emptyState ?? defaultEmpty);

  return (
    <div className={styles.root}>
      <DataTableToolbar
        q={state.q}
        onQueryChange={handleQueryChange}
        filters={filters}
        filterValues={state.filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        toolbarStart={toolbarStart}
        toolbarEnd={toolbarEnd}
        searchInputRef={searchInputRef}
      />
      <div role="region" aria-label={tableLabel} className={styles.region}>
        {isMobile ? (
          showSkeleton ? (
            <p className={styles.statePanel} role="status">
              {t('dataTable.loading')}
            </p>
          ) : showError ? (
            errorPanel
          ) : showEmpty ? (
            emptyPanel
          ) : (
            <DataTableCards
              columns={columns}
              rows={rows}
              rowKey={rowKey}
              rowActions={rowActions}
              rowLabel={rowLabel}
              registerFirstActionRef={registerFirstActionRef}
              isRefetching={isRefetching}
            />
          )
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>{tableLabel}</caption>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={column.sortable ? ariaSortFor(column.key) : undefined}
                      className={cx(styles.th, alignClass(column), hideBelowClass(column))}
                    >
                      {column.sortable ? (
                        <button type="button" className={styles.sortButton} onClick={() => handleSort(column.key)}>
                          <span>{t(column.labelKey)}</span>
                          <span aria-hidden="true" className={styles.sortIcon}>
                            {sortIconFor(column.key)}
                          </span>
                          {state.sort?.key === column.key && (
                            <span className={styles.srOnly}>
                              {t(state.sort.dir === 'asc' ? 'dataTable.sort.ascending' : 'dataTable.sort.descending')}
                            </span>
                          )}
                        </button>
                      ) : (
                        t(column.labelKey)
                      )}
                    </th>
                  ))}
                  {rowActions && (
                    <th scope="col" className={styles.th}>
                      <span className={styles.srOnly}>{t('dataTable.columns.actions')}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody aria-busy={isRefetching || undefined} className={cx(isRefetching && styles.refetching)}>
                {showSkeleton ? (
                  <DataTableSkeleton
                    columns={columns}
                    rowCount={skeletonRowCount ?? state.pageSize}
                    hasActionsColumn={Boolean(rowActions)}
                  />
                ) : showError ? (
                  <tr>
                    <td colSpan={totalColumns}>{errorPanel}</td>
                  </tr>
                ) : showEmpty ? (
                  <tr>
                    <td colSpan={totalColumns}>{emptyPanel}</td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const key = rowKey(row);
                    const label = rowLabel ? rowLabel(row) : key;
                    const actions = rowActions ? rowActions(row) : [];
                    return (
                      <tr key={key}>
                        {columns.map((column) => (
                          <td key={column.key} className={cx(styles.td, alignClass(column), hideBelowClass(column))}>
                            {column.dir === 'ltr' ? (
                              <span dir="ltr">{cellContent(column, row)}</span>
                            ) : (
                              cellContent(column, row)
                            )}
                          </td>
                        ))}
                        {rowActions && (
                          <td className={styles.td}>
                            <DataTableRowActions
                              row={row}
                              actions={actions}
                              rowLabel={label}
                              registerFirstActionRef={(el) => registerFirstActionRef(key, el)}
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <DataTableFooter
        page={state.page}
        pageSize={state.pageSize}
        totalCount={totalCount}
        isRefetching={isRefetching}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        tableLabel={tableLabel}
      />
    </div>
  );
}
