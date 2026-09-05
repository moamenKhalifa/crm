import { Select } from '@shared/components/form/Select';
import { useT } from '@shared/i18n';

import type { DataTableState } from './types';
import styles from './DataTableFooter.module.css';

export interface DataTableFooterProps {
  page: number;
  pageSize: DataTableState['pageSize'];
  totalCount: number;
  isRefetching?: boolean;
  onPageChange(page: number): void;
  onPageSizeChange(size: DataTableState['pageSize']): void;
  /** Included in the pager `<nav>`'s accessible name so multiple DataTables on one page (e.g. the documentation page) don't collide on a duplicate "Pagination" landmark name. */
  tableLabel: string;
}

const PAGE_SIZES: DataTableState['pageSize'][] = [10, 25, 50, 100];

/** First page, last page, current ± 1 — everything else collapses into an `…`. */
function buildPageList(current: number, pageCount: number): Array<number | 'ellipsis'> {
  const pages = new Set<number>();
  pages.add(1);
  pages.add(pageCount);
  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page >= 1 && page <= pageCount) {
      pages.add(page);
    }
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      result.push('ellipsis');
    }
    result.push(page);
    previous = page;
  }
  return result;
}

export function DataTableFooter({
  page,
  pageSize,
  totalCount,
  isRefetching,
  onPageChange,
  onPageSizeChange,
  tableLabel,
}: DataTableFooterProps) {
  const { t } = useT();
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const pageList = buildPageList(page, pageCount);
  const disablePager = Boolean(isRefetching);

  return (
    <div className={styles.footer}>
      <p className={styles.summary}>{t('dataTable.summary.showing', { from, to, total: totalCount })}</p>
      <Select
        className={styles.pageSize}
        label={t('dataTable.pageSize.label')}
        value={String(pageSize)}
        disabled={disablePager}
        onChange={(event) => onPageSizeChange(Number(event.target.value) as DataTableState['pageSize'])}
        options={PAGE_SIZES.map((size) => ({ value: String(size), label: String(size) }))}
      />
      <nav className={styles.pager} aria-label={`${t('dataTable.pagination.label')} — ${tableLabel}`}>
        <button
          type="button"
          className={styles.pagerArrow}
          disabled={disablePager || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t('dataTable.pagination.previous')}
        >
          ‹
        </button>
        {pageList.map((entry, index) =>
          entry === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              className={styles.pagerPage}
              data-current={entry === page || undefined}
              aria-current={entry === page ? 'page' : undefined}
              disabled={disablePager}
              onClick={() => onPageChange(entry)}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          className={styles.pagerArrow}
          disabled={disablePager || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label={t('dataTable.pagination.next')}
        >
          ›
        </button>
      </nav>
    </div>
  );
}
