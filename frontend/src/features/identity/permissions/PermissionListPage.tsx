import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { PermissionSummaryResponse } from '@features/authentication/api';
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

import { deletePermission, listPermissions } from './api';
import styles from './PermissionListPage.module.css';

const PAGE_SIZE = 25;

export default function PermissionListPage() {
  const { t } = useT();
  const toast = useToast();
  const client = useApiClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<PermissionSummaryResponse | null>(null);

  const query = useApiData({
    fetch: (c) => listPermissions(c, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    deps: [page],
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deletePermission(client, target.id);
      toast.show({ variant: 'success', message: t('admin.permissions.toasts.deleted') });
      query.reload();
    } catch {
      toast.show({ variant: 'danger', message: t('errors.unexpected') });
    }
  };

  const columns: TableColumn<PermissionSummaryResponse>[] = [
    { key: 'code', header: t('admin.permissions.columns.code'), render: (row) => <code>{row.code}</code> },
    {
      key: 'description',
      header: t('admin.permissions.columns.description'),
      render: (row) => <span className={styles.muted}>{row.description ?? ''}</span>,
    },
    {
      key: 'actions',
      header: t('admin.permissions.columns.actions'),
      render: (row) => (
        <>
          <Button variant="tertiary" size="sm" onClick={() => navigate(row.id)}>
            {t('admin.permissions.actions.view')}
          </Button>{' '}
          <PermissionGate permission="Permission.Update">
            <Button variant="tertiary" size="sm" onClick={() => navigate(`${row.id}/edit`)}>
              {t('admin.permissions.actions.edit')}
            </Button>{' '}
          </PermissionGate>
          <PermissionGate permission="Permission.Delete">
            <Button variant="danger-subtle" size="sm" onClick={() => setDeleteTarget(row)}>
              {t('admin.permissions.actions.delete')}
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
          <h1 className={styles.pageTitle}>{t('admin.permissions.title')}</h1>
          <p className={styles.pageSubtitle}>
            {t('admin.permissions.subtitle', { count: query.data?.length ?? 0 })}
          </p>
        </div>
        <PermissionGate permission="Permission.Create">
          <Button variant="primary" onClick={() => navigate('new')}>
            {t('admin.permissions.create')}
          </Button>
        </PermissionGate>
      </header>
      <AsyncBoundary query={query} empty={<EmptyState />}>
        {(permissions) => (
          <>
            <Table columns={columns} rows={permissions} getRowKey={(row) => row.id} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </>
        )}
      </AsyncBoundary>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t('admin.permissions.confirmDelete.title')}
        variant="danger"
      >
        <p>{t('admin.permissions.confirmDelete.body')}</p>
      </ConfirmDialog>
    </div>
  );
}
