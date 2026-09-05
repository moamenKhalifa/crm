import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { DataTableState, SortDir } from './types';

const RESERVED_KEYS = new Set(['page', 'pageSize', 'sort', 'q']);
const VALID_PAGE_SIZES = [10, 25, 50, 100] as const;

function parseState(searchParams: URLSearchParams, defaults?: Partial<DataTableState>): DataTableState {
  const pageRaw = Number(searchParams.get('page'));
  const page = searchParams.has('page')
    ? Number.isFinite(pageRaw) && pageRaw >= 1
      ? Math.floor(pageRaw)
      : 1
    : (defaults?.page ?? 1);

  const pageSizeRaw = Number(searchParams.get('pageSize'));
  const pageSize = searchParams.has('pageSize')
    ? (VALID_PAGE_SIZES as readonly number[]).includes(pageSizeRaw)
      ? (pageSizeRaw as DataTableState['pageSize'])
      : 25
    : (defaults?.pageSize ?? 25);

  let sort: DataTableState['sort'] = defaults?.sort;
  if (searchParams.has('sort')) {
    const sortRaw = searchParams.get('sort') ?? '';
    const [key, dir] = sortRaw.split(':');
    sort = key && (dir === 'asc' || dir === 'desc') ? { key, dir: dir as SortDir } : undefined;
  }

  const q = searchParams.has('q') ? (searchParams.get('q') ?? '') : (defaults?.q ?? '');

  const filters: Record<string, string[]> = {};
  const seen = new Set<string>();
  for (const key of searchParams.keys()) {
    if (RESERVED_KEYS.has(key) || seen.has(key)) {
      continue;
    }
    seen.add(key);
    filters[key] = searchParams.getAll(key);
  }
  if (seen.size === 0 && defaults?.filters) {
    Object.assign(filters, defaults.filters);
  }

  return { page, pageSize, sort, q, filters };
}

export interface UseDataTableStateResult {
  state: DataTableState;
  setState(next: DataTableState): void;
  setQuery(q: string): void;
  setSort(sort: DataTableState['sort']): void;
  setPage(page: number): void;
  setPageSize(size: DataTableState['pageSize']): void;
  setFilters(filters: DataTableState['filters']): void;
  clearFilters(): void;
}

/**
 * URL-synced table state. Every field this hook owns (`page`, `pageSize`,
 * `sort`, `q`, plus every OTHER search param as a repeatable filter) is read
 * fresh from `location.search` on every render — there is no separate React
 * state copy to keep in sync, so back/forward navigation "just works".
 *
 * Note on the search debounce (AC3): this hook's `setQuery` is a plain,
 * synchronous state+URL update. The ~300ms debounce (and the "suppress
 * under 2 chars" rule) lives in `DataTableToolbar.tsx` instead — it holds
 * its own local input state and only calls `setQuery` once the debounce
 * settles. Net behavior is the same either way; this placement keeps the
 * hook itself trivial to unit-test.
 */
export function useDataTableState(defaults?: Partial<DataTableState>): UseDataTableStateResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(
    () => parseState(searchParams, defaults),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `defaults` is expected to be a stable/inline literal per call site, like other config objects in this codebase.
    [searchParams],
  );

  const applyState = useCallback(
    (next: DataTableState) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          const prevParsed = parseState(prev, defaults);

          // Clear every key this hook owns before re-writing it below —
          // this is also how a filter key that's been emptied out gets
          // removed from the URL rather than lingering as `?role_id=`.
          params.delete('page');
          params.delete('pageSize');
          params.delete('sort');
          params.delete('q');
          for (const key of Object.keys(prevParsed.filters)) {
            params.delete(key);
          }

          if (next.page !== 1) {
            params.set('page', String(next.page));
          }
          if (next.pageSize !== 25) {
            params.set('pageSize', String(next.pageSize));
          }
          if (next.sort) {
            params.set('sort', `${next.sort.key}:${next.sort.dir}`);
          }
          if (next.q) {
            params.set('q', next.q);
          }
          for (const [key, values] of Object.entries(next.filters)) {
            for (const value of values) {
              if (value) {
                params.append(key, value);
              }
            }
          }

          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaults],
  );

  const setState = useCallback((next: DataTableState) => applyState(next), [applyState]);
  const setQuery = useCallback((q: string) => applyState({ ...state, q, page: 1 }), [applyState, state]);
  const setSort = useCallback(
    (sort: DataTableState['sort']) => applyState({ ...state, sort, page: 1 }),
    [applyState, state],
  );
  const setPage = useCallback((page: number) => applyState({ ...state, page }), [applyState, state]);
  const setPageSize = useCallback(
    (pageSize: DataTableState['pageSize']) => applyState({ ...state, pageSize, page: 1 }),
    [applyState, state],
  );
  const setFilters = useCallback(
    (filters: DataTableState['filters']) => applyState({ ...state, filters, page: 1 }),
    [applyState, state],
  );
  const clearFilters = useCallback(
    () => applyState({ ...state, q: '', filters: {}, page: 1 }),
    [applyState, state],
  );

  return { state, setState, setQuery, setSort, setPage, setPageSize, setFilters, clearFilters };
}
