import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { PermissionSummaryResponse } from '@features/authentication/api';
import { useApiClient } from '@shared/api';
import { PermissionGate, useAuthorization } from '@shared/authorization';
import {
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FilteredEmpty,
  useDataTableState,
  useToast,
  type DataTableColumn,
  type DataTableRowAction,
} from '@shared/components';
import { toUserMessage } from '@shared/errors';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';

import { deletePermission, listPermissionsPaged } from './api';
import styles from './PermissionListPage.module.css';

export default function PermissionListPage() {
  const { t } = useT();
  const toast = useToast();
  const client = useApiClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuthorization();
  const { state, setState, clearFilters } = useDataTableState();
  const [deleteTarget, setDeleteTarget] = useState<PermissionSummaryResponse | null>(null);

  const query = useApiData({
    fetch: (c) =>
      listPermissionsPaged(c, {
        limit: state.pageSize,
        offset: (state.page - 1) * state.pageSize,
        q: state.q || undefined,
        sort: state.sort ? `${state.sort.key}:${state.sort.dir}` : undefined,
      }),
    deps: [state.page, state.pageSize, state.q, state.sort?.key, state.sort?.dir],
  });

  const permissions = query.data?.items ?? [];
  const isInitialLoading = query.isLoading && query.data === undefined;
  const isRefetching = query.isLoading && query.data !== undefined;

  const activeFilterLabels: string[] = state.q ? [state.q] : [];

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

  const columns: DataTableColumn<PermissionSummaryResponse>[] = [
    {
      key: 'code',
      labelKey: 'admin.permissions.columns.code',
      sortable: true,
      dir: 'ltr',
      skeletonWidth: 16,
      render: (row) => <code>{row.code}</code>,
    },
    {
      key: 'description',
      labelKey: 'admin.permissions.columns.description',
      skeletonWidth: 20,
      render: (row) => <span className={styles.muted}>{row.description ?? ''}</span>,
    },
  ];

  const rowActions = (): DataTableRowAction<PermissionSummaryResponse>[] => [
    { key: 'view', labelKey: 'admin.permissions.actions.view', onSelect: (permission) => navigate(permission.id) },
    {
      key: 'edit',
      labelKey: 'admin.permissions.actions.edit',
      isAllowed: hasPermission('Permission.Update'),
      onSelect: (permission) => navigate(`${permission.id}/edit`),
    },
    {
      key: 'delete',
      labelKey: 'admin.permissions.actions.delete',
      variant: 'danger',
      isAllowed: hasPermission('Permission.Delete'),
      onSelect: (permission) => setDeleteTarget(permission),
    },
  ];

  const createButton = (
    <PermissionGate permission="Permission.Create">
      <Button variant="primary" onClick={() => navigate('new')}>
        {t('admin.permissions.create')}
      </Button>
    </PermissionGate>
  );

  const emptyState = <EmptyState title={t('admin.permissions.empty.title')} action={createButton} />;

  const filteredEmptyState = (
    <FilteredEmpty
      title={t('admin.permissions.emptyFiltered.title')}
      activeFilters={activeFilterLabels}
      onClearFilters={clearFilters}
    />
  );

  return (
    <div>
      <header className={styles.pageHeader}>
        <div>
          <h1 id="page-heading" tabIndex={-1} className={styles.pageTitle}>
            {t('admin.permissions.title')}
          </h1>
          <p className={styles.pageSubtitle}>{t('admin.permissions.subtitle', { count: query.data?.total ?? 0 })}</p>
        </div>
      </header>
      <DataTable
        columns={columns}
        rows={permissions}
        rowKey={(row) => row.id}
        totalCount={query.data?.total ?? 0}
        state={state}
        onStateChange={setState}
        isLoading={isInitialLoading}
        isRefetching={isRefetching}
        isError={Boolean(query.error)}
        errorMessage={query.error ? toUserMessage(query.error, t) : undefined}
        onRetry={query.reload}
        emptyState={emptyState}
        filteredEmptyState={filteredEmptyState}
        rowActions={rowActions}
        rowLabel={(row) => row.code}
        toolbarEnd={createButton}
        tableLabel={t('admin.permissions.title')}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t('admin.permissions.confirmDelete.title')}
        destructive
        consequence={deleteTarget && <p>{deleteTarget.code}</p>}
      >
        <p>{t('admin.permissions.confirmDelete.body')}</p>
      </ConfirmDialog>
    </div>
  );
}
