import type { ReactNode } from 'react';

import { AppSidebar, type AppSidebarItem } from '@shared/components';
import { useT } from '@shared/i18n';

import styles from './AdminLayout.module.css';

export interface AdminLayoutProps {
  children: ReactNode;
}

/** Sidebar items are filtered by `AppSidebar` itself via `useAuthorization()`. */
export function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useT();

  const items: AppSidebarItem[] = [
    { key: 'users', label: t('admin.nav.users'), to: '/admin/users', permission: 'User.View' },
    { key: 'roles', label: t('admin.nav.roles'), to: '/admin/roles', permission: 'Role.View' },
    { key: 'permissions', label: t('admin.nav.permissions'), to: '/admin/permissions', permission: 'Permission.View' },
  ];

  return (
    <div className={styles.layout}>
      <AppSidebar items={items} />
      <div className={styles.content}>
        <main className={styles.card}>{children}</main>
      </div>
    </div>
  );
}
