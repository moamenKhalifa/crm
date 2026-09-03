import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { RoleSummaryResponse } from '@features/authentication/api';
import { useApiClient } from '@shared/api';
import { PermissionGate } from '@shared/authorization';
import {
  AsyncBoundary,
  Button,
  ConfirmDialog,
  EmptyState,
  Pagination,
  Table,
  useToast,
  type TableColumn,
} from '@shared/components';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';

import { deleteRole, listRoles } from './api';
import styles from './RoleListPage.module.css';

const PAGE_SIZE = 25;

export default function RoleListPage() {
  const { t } = useT();
  const toast = useToast();
  const client = useApiClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<RoleSummaryResponse | null>(null);

  const query = useApiData({
    fetch: (c) => listRoles(c, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    deps: [page],
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteRole(client, target.id);
      toast.show({ variant: 'success', message: t('admin.roles.toasts.deleted') });
      query.reload();
    } catch {
      toast.show({ variant: 'danger', message: t('errors.unexpected') });
    }
  };

  const columns: TableColumn<RoleSummaryResponse>[] = [
    { key: 'name', header: t('admin.roles.columns.name') },
    {
      key: 'description',
      header: t('admin.roles.columns.description'),
      render: (row) => <span className={styles.muted}>{row.description ?? ''}</span>,
    },
    {
      key: 'actions',
      header: t('admin.roles.columns.actions'),
      render: (row) => (
        <>
          <Button variant="tertiary" size="sm" onClick={() => navigate(row.id)}>
            {t('admin.roles.actions.view')}
          </Button>{' '}
          <PermissionGate permission="Role.Update">
            <Button variant="tertiary" size="sm" onClick={() => navigate(`${row.id}/edit`)}>
              {t('admin.roles.actions.edit')}
            </Button>{' '}
          </PermissionGate>
          <PermissionGate permission="Role.Delete">
            <Button variant="danger-subtle" size="sm" onClick={() => setDeleteTarget(row)}>
              {t('admin.roles.actions.delete')}
            </Button>
          </PermissionGate>
        </>
      ),
    },
  ];

  // See `UserListPage.tsx` — same known limitation, no `total` from the backend.
  const total = query.data
    ? query.data.length < PAGE_SIZE
      ? (page - 1) * PAGE_SIZE + query.data.length
      : page * PAGE_SIZE + 1
    : 0;

  return (
    <div>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>{t('admin.roles.title')}</h1>
          <p className={styles.pageSubtitle}>{t('admin.roles.subtitle', { count: query.data?.length ?? 0 })}</p>
        </div>
        <PermissionGate permission="Role.Create">
          <Button variant="primary" onClick={() => navigate('new')}>
            {t('admin.roles.create')}
          </Button>
        </PermissionGate>
      </header>
      <AsyncBoundary query={query} empty={<EmptyState />}>
        {(roles) => (
          <>
            <Table columns={columns} rows={roles} getRowKey={(row) => row.id} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </>
        )}
      </AsyncBoundary>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t('admin.roles.confirmDelete.title')}
        variant="danger"
      >
        <p>{t('admin.roles.confirmDelete.body')}</p>
      </ConfirmDialog>
    </div>
  );
}
