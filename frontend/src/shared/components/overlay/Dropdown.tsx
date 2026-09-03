import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import styles from './Dropdown.module.css';

export interface DropdownActionItem {
  key: string;
  label: ReactNode;
  onSelect(): void;
  disabled?: boolean;
  divider?: false;
}

export interface DropdownDividerItem {
  key: string;
  divider: true;
}

export type DropdownItem = DropdownActionItem | DropdownDividerItem;

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
}

function isDivider(item: DropdownItem): item is DropdownDividerItem {
  return 'divider' in item && item.divider === true;
}

export function Dropdown({ trigger, items, align = 'start' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const focusableIndexes = items.reduce<number[]>((acc, item, index) => {
    if (!isDivider(item)) {
      acc.push(index);
    }
    return acc;
  }, []);

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

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const position = focusableIndexes.indexOf(activeIndex);
      const nextPosition = Math.min(position + 1, focusableIndexes.length - 1);
      setActiveIndex(focusableIndexes[Math.max(nextPosition, 0)] ?? -1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const position = focusableIndexes.indexOf(activeIndex);
      const prevPosition = Math.max(position - 1, 0);
      setActiveIndex(focusableIndexes[prevPosition] ?? -1);
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      const item = items[activeIndex];
      if (item && !isDivider(item)) {
        item.onSelect();
        setOpen(false);
      }
    }
  };

  return (
    <div className={styles.container} ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <ul className={styles.menu} data-align={align} role="menu">
          {items.map((item, index) =>
            isDivider(item) ? (
              <li key={item.key} role="separator" className={styles.divider} />
            ) : (
              <li key={item.key} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={styles.item}
                  data-active={index === activeIndex || undefined}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
