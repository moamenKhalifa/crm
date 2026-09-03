import { forwardRef, type KeyboardEvent } from 'react';

import { useT } from '@shared/i18n';

import { TextInput, type TextInputProps } from './TextInput';
import styles from './SearchField.module.css';

export interface SearchFieldProps extends Omit<TextInputProps, 'type' | 'startIcon' | 'endIcon' | 'onChange'> {
  value: string;
  onChange(value: string): void;
  onClear?(): void;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="7" r="5" />
      <path d="M14 14l-3.2-3.2" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M1 1l10 10M11 1L1 11" />
    </svg>
  );
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onChange, onClear, ...rest },
  ref,
) {
  const { t } = useT();

  const clear = () => {
    onChange('');
    onClear?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && value) {
      event.stopPropagation();
      clear();
    }
  };

  return (
    <TextInput
      ref={ref}
      role="searchbox"
      type="search"
      placeholder={rest.placeholder ?? t('forms.search.placeholder')}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
      startIcon={<SearchIcon />}
      endIcon={
        value ? (
          <button type="button" className={styles.clear} onClick={clear} aria-label={t('forms.search.clear')}>
            <ClearIcon />
          </button>
        ) : undefined
      }
      {...rest}
    />
  );
});
