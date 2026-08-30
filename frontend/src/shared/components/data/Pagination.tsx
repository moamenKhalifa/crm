import styles from './Pagination.module.css';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange(page: number): void;
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => onChange(page - 1)}
        className={styles.arrow}
        aria-label="Previous page"
      >
        ‹
      </button>
      <span className={styles.status}>
        {page} / {pageCount}
      </span>
      <button
        type="button"
        disabled={!canNext}
        onClick={() => onChange(page + 1)}
        className={styles.arrow}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
