import type { ReactNode } from 'react';

import styles from './Menu.module.css';

export interface MenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect?(): void;
  active?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
}

/** Generic vertical menu primitive shared by `AppSidebar` and `Dropdown`-style menus. */
export function Menu({ items }: MenuProps) {
  return (
    <ul className={styles.menu} role="menu">
      {items.map((item) => (
        <li key={item.key} role="none">
          <button
            type="button"
            role="menuitem"
            className={styles.item}
            data-active={item.active || undefined}
            disabled={item.disabled}
            onClick={item.onSelect}
          >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
