import type { ReactNode } from 'react';

export type SortDir = 'asc' | 'desc';

export interface DataTableColumn<T> {
  key: string;
  labelKey: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  /** `'ltr'` wraps the rendered cell content in `<span dir="ltr">` — for email/code columns that must not mirror under RTL. */
  dir?: 'ltr' | 'auto';
  align?: 'start' | 'end' | 'center';
  /** Shimmer width for the loading skeleton, in `ch`. */
  skeletonWidth?: number;
  hideBelow?: 'tablet' | 'desktop';
}

export interface DataTableFilterOption {
  value: string;
  /** Translation key for a static option label. */
  labelKey?: string;
  /**
   * Literal label, used verbatim instead of `labelKey`. Needed for
   * dynamically-sourced options (e.g. role names, permission codes) that
   * cannot live in the translation catalogue. At least one of `label` /
   * `labelKey` must be given; `label` wins when both are present.
   */
  label?: string;
}

export interface DataTableFilterDef {
  key: string;
  labelKey: string;
  multi?: boolean;
  options: DataTableFilterOption[];
}

export interface DataTableState {
  page: number;
  pageSize: 10 | 25 | 50 | 100;
  sort?: { key: string; dir: SortDir };
  q: string;
  filters: Record<string, string[]>;
}

export interface DataTableRowAction<T> {
  key: string;
  labelKey: string;
  onSelect(row: T): void;
  /** Default `true` when omitted. */
  isAllowed?: boolean;
  disabledReason?: string;
  variant?: 'default' | 'danger';
  icon?: ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey(row: T): string;
  totalCount: number;
  state: DataTableState;
  onStateChange(next: DataTableState): void;
  isLoading?: boolean;
  isRefetching?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyState?: ReactNode;
  filteredEmptyState?: ReactNode;
  rowActions?: (row: T) => DataTableRowAction<T>[];
  toolbarStart?: ReactNode;
  toolbarEnd?: ReactNode;
  filters?: DataTableFilterDef[];
  density?: 'comfortable' | 'compact';
  tableLabel: string;
  /**
   * Informational callback: fired by `DataTable` itself right after it
   * detects a row disappeared (comparing the previous and current row-key
   * sets) and moves focus accordingly — see `DataTable.tsx` for the
   * self-managing `useEffect` this drives. Callers do not need to invoke
   * this themselves; it exists so a caller *can* react to "which row just
   * vanished" if it ever needs to, without having to duplicate the diffing.
   */
  onRowRemoved?: (removedRowKey: string) => void;
  skeletonRowCount?: number;
  /** Row-label function for composing each action's accessible name, e.g. `(row) => row.full_name`. Falls back to the row's `rowKey(row)` when omitted. */
  rowLabel?: (row: T) => string;
}
