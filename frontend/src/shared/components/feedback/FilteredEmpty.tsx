import { Button } from '@shared/components/button/Button';
import { Badge } from '@shared/components/data/Badge';
import { useT } from '@shared/i18n';

import styles from './StatePanel.module.css';

export interface FilteredEmptyProps {
  title?: string;
  /** Human-readable labels for the currently active filters, rendered as neutral chips. */
  activeFilters: string[];
  onClearFilters(): void;
}

/** Shown instead of `EmptyState` when a list has zero rows *and* an active search/filter — never for a genuinely empty list. */
export function FilteredEmpty({ title, activeFilters, onClearFilters }: FilteredEmptyProps) {
  const { t } = useT();

  return (
    <div className={styles.panel} role="status">
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="6" />
        <path d="M20.5 20.5 L15 15" />
      </svg>
      <p className={styles.title}>{title ?? t('states.filteredEmpty.title')}</p>
      <p className={styles.description}>{t('states.filteredEmpty.description')}</p>
      {activeFilters.length > 0 && (
        <div className={styles.chips}>
          {activeFilters.map((filter) => (
            <Badge key={filter}>{filter}</Badge>
          ))}
        </div>
      )}
      <Button variant="tertiary" onClick={onClearFilters}>
        {t('states.filteredEmpty.clear')}
      </Button>
    </div>
  );
}
