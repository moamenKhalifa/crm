import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';

import { Button } from '@shared/components/button/Button';
import { Checkbox } from '@shared/components/form/Checkbox';
import { SearchField } from '@shared/components/form/SearchField';
import { Select } from '@shared/components/form/Select';
import { useT } from '@shared/i18n';

import type { DataTableFilterDef } from './types';
import styles from './DataTableToolbar.module.css';

const DEBOUNCE_MS = 300;

function optionLabel(t: (key: string) => string, option: { label?: string; labelKey?: string; value: string }): string {
  return option.label ?? (option.labelKey ? t(option.labelKey) : option.value);
}

function SingleSelectFilter({
  def,
  values,
  onChange,
}: {
  def: DataTableFilterDef;
  values: string[];
  onChange(next: string[]): void;
}) {
  const { t } = useT();
  const value = values[0] ?? '';

  return (
    <Select
      className={styles.filterControl}
      label={t(def.labelKey)}
      value={value}
      onChange={(event) => onChange(event.target.value ? [event.target.value] : [])}
      options={[
        { value: '', label: t('dataTable.filters.all') },
        ...def.options.map((option) => ({ value: option.value, label: optionLabel(t, option) })),
      ]}
    />
  );
}

function MultiSelectFilter({
  def,
  values,
  onChange,
}: {
  def: DataTableFilterDef;
  values: string[];
  onChange(next: string[]): void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const toggleValue = (value: string) => {
    const next = new Set(values);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(Array.from(next));
  };

  const triggerLabel = values.length > 0 ? `${t(def.labelKey)} (${values.length})` : t(def.labelKey);

  return (
    <div className={styles.multiSelect} ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={styles.multiSelectTrigger}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {triggerLabel}
      </button>
      {open && (
        <div className={styles.multiSelectPanel} role="group" aria-label={t(def.labelKey)}>
          {def.options.map((option) => (
            <Checkbox
              key={option.value}
              label={optionLabel(t, option)}
              checked={values.includes(option.value)}
              onChange={() => toggleValue(option.value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface DataTableToolbarProps {
  q: string;
  onQueryChange(q: string): void;
  filters?: DataTableFilterDef[];
  filterValues: Record<string, string[]>;
  onFilterChange(key: string, values: string[]): void;
  onClearFilters(): void;
  hasActiveFilters: boolean;
  toolbarStart?: ReactNode;
  toolbarEnd?: ReactNode;
  searchInputRef?: Ref<HTMLInputElement>;
}

/**
 * Search debounce lives here (see `useDataTableState.ts`'s doc comment for
 * why): typing a single character never reaches `onQueryChange` at all;
 * two-or-more characters propagate ~300ms after the user stops typing;
 * clearing back to an empty string propagates immediately.
 */
export function DataTableToolbar({
  q,
  onQueryChange,
  filters,
  filterValues,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  toolbarStart,
  toolbarEnd,
  searchInputRef,
}: DataTableToolbarProps) {
  const { t } = useT();
  const [localQuery, setLocalQuery] = useState(q);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalQuery(q);
  }, [q]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const handleChange = (value: string) => {
    setLocalQuery(value);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (value === '') {
      onQueryChange('');
      return;
    }
    if (value.length === 1) {
      return;
    }
    timerRef.current = setTimeout(() => onQueryChange(value), DEBOUNCE_MS);
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarMain}>
        {toolbarStart}
        <SearchField
          ref={searchInputRef}
          label={t('dataTable.search.label')}
          placeholder={t('dataTable.search.placeholder')}
          value={localQuery}
          onChange={handleChange}
        />
        {filters?.map((def) =>
          def.multi ? (
            <MultiSelectFilter
              key={def.key}
              def={def}
              values={filterValues[def.key] ?? []}
              onChange={(next) => onFilterChange(def.key, next)}
            />
          ) : (
            <SingleSelectFilter
              key={def.key}
              def={def}
              values={filterValues[def.key] ?? []}
              onChange={(next) => onFilterChange(def.key, next)}
            />
          ),
        )}
        {hasActiveFilters && (
          <Button variant="tertiary" size="sm" onClick={onClearFilters}>
            {t('dataTable.filters.clearAll')}
          </Button>
        )}
      </div>
      {toolbarEnd && <div className={styles.toolbarEnd}>{toolbarEnd}</div>}
    </div>
  );
}
