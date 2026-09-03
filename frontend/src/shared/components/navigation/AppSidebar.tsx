import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { useAuthorization } from '@shared/authorization';
import { useT } from '@shared/i18n';

import { Menu, type MenuItem } from './Menu';
import styles from './AppSidebar.module.css';

export interface AppSidebarItem {
  key: string;
  label: string;
  icon?: ReactNode;
  to: string;
  permission?: string;
  role?: string;
}

export interface AppSidebarProps {
  items: AppSidebarItem[];
}

/** Filters `items` via `useAuthorization()` so the nav respects roles/permissions. */
export function AppSidebar({ items }: AppSidebarProps) {
  const { hasRole, hasPermission } = useAuthorization();
  const { t } = useT();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = items.filter((item) => {
    if (item.role && !hasRole(item.role)) {
      return false;
    }
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    return true;
  });

  const menuItems: MenuItem[] = visibleItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: (
      <NavLink
        to={item.to}
        className={({ isActive }) => (isActive ? `${styles.link} ${styles.linkActive}` : styles.link)}
      >
        {item.label}
      </NavLink>
    ),
  }));

  return (
    <aside className={styles.sidebar} data-collapsed={collapsed || undefined}>
      <button
        type="button"
        className={styles.collapseButton}
        onClick={() => setCollapsed((value) => !value)}
        aria-label={t('nav.sidebar.collapse')}
      >
        ☰
      </button>
      <Menu items={menuItems} />
    </aside>
  );
}
