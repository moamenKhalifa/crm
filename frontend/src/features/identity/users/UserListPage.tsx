import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@features/authentication/AuthProvider';
import type { UserResponse } from '@features/authentication/api';
import { useApiClient } from '@shared/api';
import { PermissionGate } from '@shared/authorization';
import {
  AsyncBoundary,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Pagination,
  Status,
  Table,
  useToast,
  type TableColumn,
} from '@shared/components';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';

import { deleteUser, listUsers } from './api';
import styles from './UserListPage.module.css';

const PAGE_SIZE = 25;

export default function UserListPage() {
  const { t } = useT();
  const toast = useToast();
  const client = useApiClient();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  const query = useApiData({
    fetch: (c) => listUsers(c, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    deps: [page],
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteUser(client, target.id);
      toast.show({ variant: 'success', message: t('admin.users.toasts.deleted') });
      query.reload();
    } catch {
      toast.show({ variant: 'danger', message: t('errors.unexpected') });
    }
  };

  const columns: TableColumn<UserResponse>[] = [
    { key: 'full_name', header: t('admin.users.columns.fullName') },
    {
      key: 'email',
      header: t('admin.users.columns.email'),
      render: (row) => <span className={styles.muted}>{row.email}</span>,
    },
    {
      key: 'is_active',
      header: t('admin.users.columns.active'),
      render: (row) => (
        <Status
          variant={row.is_active ? 'success' : 'neutral'}
          label={t(row.is_active ? 'admin.users.status.active' : 'admin.users.status.inactive')}
        />
      ),
    },
    {
      key: 'roles',
      header: t('admin.users.columns.roles'),
      render: (row) => (
        <div className={styles.badgeGroup}>
          {row.roles.map((role) => (
            <Badge key={role.id} variant="info">
              {role.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('admin.users.columns.actions'),
      render: (row) => (
        <>
          <Button variant="tertiary" size="sm" onClick={() => navigate(row.id)}>
            {t('admin.users.actions.view')}
          </Button>{' '}
          <PermissionGate permission="User.Update">
            <Button variant="tertiary" size="sm" onClick={() => navigate(`${row.id}/edit`)}>
              {t('admin.users.actions.edit')}
            </Button>{' '}
          </PermissionGate>
          <PermissionGate permission="User.Delete">
            <Button
              variant="danger-subtle"
              size="sm"
              disabled={row.id === currentUser?.id}
              disabledReason={row.id === currentUser?.id ? t('admin.common.actions.reason.cannotDeleteSelf') : undefined}
              onClick={() => setDeleteTarget(row)}
            >
              {t('admin.users.actions.delete')}
            </Button>
          </PermissionGate>
        </>
      ),
    },
  ];

  // Backend list endpoint returns a flat array with no `total` — a page
  // shorter than PAGE_SIZE is treated as the last page; otherwise assume at
  // least one more exists. Known limitation: no accurate page count without
  // a backend change to return a total.
  const total = query.data
    ? query.data.length < PAGE_SIZE
      ? (page - 1) * PAGE_SIZE + query.data.length
      : page * PAGE_SIZE + 1
    : 0;

  return (
    <div>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.users.title')}</h1>
          <p className={styles.pageSubtitle}>{t('admin.users.subtitle', { count: query.data?.length ?? 0 })}</p>
        </div>
        <PermissionGate permission="User.Create">
          <Button variant="primary" onClick={() => navigate('new')}>
            {t('admin.users.create')}
          </Button>
        </PermissionGate>
      </header>
      <AsyncBoundary query={query} empty={<EmptyState />}>
        {(users) => (
          <>
            <Table columns={columns} rows={users} getRowKey={(row) => row.id} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </>
        )}
      </AsyncBoundary>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t('admin.users.confirmDelete.title')}
        variant="danger"
      >
        <p>{t('admin.users.confirmDelete.body')}</p>
      </ConfirmDialog>
    </div>
  );
}
