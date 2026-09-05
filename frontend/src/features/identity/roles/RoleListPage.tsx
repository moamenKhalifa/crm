import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { RoleSummaryResponse } from '@features/authentication/api';
import { listPermissions } from '@features/identity/permissions/api';
import { isForbidden, useApiClient } from '@shared/api';
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
  type DataTableFilterDef,
  type DataTableRowAction,
} from '@shared/components';
import { toUserMessage } from '@shared/errors';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';

import { deleteRole, listRolesPaged } from './api';
import styles from './RoleListPage.module.css';

export default function RoleListPage() {
  const { t } = useT();
  const toast = useToast();
  const client = useApiClient();
  const navigate = useNavigate();
  const { hasPermission } = useAuthorization();
  const { state, setState, clearFilters } = useDataTableState();
  const [deleteTarget, setDeleteTarget] = useState<RoleSummaryResponse | null>(null);

  const permissionIdFilter = state.filters.has_permission_id ?? [];

  const query = useApiData({
    fetch: (c) =>
      listRolesPaged(c, {
        limit: state.pageSize,
        offset: (state.page - 1) * state.pageSize,
        q: state.q || undefined,
        sort: state.sort ? `${state.sort.key}:${state.sort.dir}` : undefined,
        has_permission_id: permissionIdFilter.length > 0 ? permissionIdFilter : undefined,
      }),
    deps: [state.page, state.pageSize, state.q, state.sort?.key, state.sort?.dir, permissionIdFilter.join(',')],
  });

  // Hydrates the `has_permission_id` filter's option list — same "fetch a
  // full list for a picker UI" pattern `RolePermissionAssignModal.tsx` already
  // uses. `suppressForbiddenHandling`: this is a convenience lookup for an
  // optional filter, not the page's core data — a viewer with `Role.View`
  // but not `Permission.View` can still fully use this page, just without
  // the permission filter (see `canFilterByPermission` below).
  const permissionsQuery = useApiData({
    fetch: (c) => listPermissions(c, { limit: 100, offset: 0 }, { suppressForbiddenHandling: true }),
    deps: [],
  });
  const canFilterByPermission = !isForbidden(permissionsQuery.error);

  const roles = query.data?.items ?? [];
  const isInitialLoading = query.isLoading && query.data === undefined;
  const isRefetching = query.isLoading && query.data !== undefined;

  const activeFilterLabels: string[] = [
    ...(canFilterByPermission
      ? permissionIdFilter
          .map((id) => permissionsQuery.data?.find((permission) => permission.id === id)?.code)
          .filter((code): code is string => Boolean(code))
      : []),
    ...(state.q ? [state.q] : []),
  ];

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

  const columns: DataTableColumn<RoleSummaryResponse>[] = [
    { key: 'name', labelKey: 'admin.roles.columns.name', sortable: true, skeletonWidth: 14 },
    {
      key: 'description',
      labelKey: 'admin.roles.columns.description',
      skeletonWidth: 20,
      render: (row) => <span className={styles.muted}>{row.description ?? ''}</span>,
    },
  ];

  // Omitted entirely (not just empty) for a viewer without `Permission.View`
  // — filtering-by-permission is a convenience on top of the roles list,
  // not a requirement to use it.
  const filters: DataTableFilterDef[] = canFilterByPermission
    ? [
        {
          key: 'has_permission_id',
          labelKey: 'admin.roles.filters.permission',
          multi: true,
          options: (permissionsQuery.data ?? []).map((permission) => ({ value: permission.id, label: permission.code })),
        },
      ]
    : [];

  const rowActions = (): DataTableRowAction<RoleSummaryResponse>[] => [
    { key: 'view', labelKey: 'admin.roles.actions.view', onSelect: (role) => navigate(role.id) },
    {
      key: 'edit',
      labelKey: 'admin.roles.actions.edit',
      isAllowed: hasPermission('Role.Update'),
      onSelect: (role) => navigate(`${role.id}/edit`),
    },
    {
      key: 'delete',
      labelKey: 'admin.roles.actions.delete',
      variant: 'danger',
      isAllowed: hasPermission('Role.Delete'),
      onSelect: (role) => setDeleteTarget(role),
    },
  ];

  const createButton = (
    <PermissionGate permission="Role.Create">
      <Button variant="primary" onClick={() => navigate('new')}>
        {t('admin.roles.create')}
      </Button>
    </PermissionGate>
  );

  const emptyState = <EmptyState title={t('admin.roles.empty.title')} action={createButton} />;

  const filteredEmptyState = (
    <FilteredEmpty
      title={t('admin.roles.emptyFiltered.title')}
      activeFilters={activeFilterLabels}
      onClearFilters={clearFilters}
    />
  );

  return (
    <div>
      <header className={styles.pageHeader}>
        <div>
          <h1 id="page-heading" tabIndex={-1} className={styles.pageTitle}>
            {t('admin.roles.title')}
          </h1>
          <p className={styles.pageSubtitle}>{t('admin.roles.subtitle', { count: query.data?.total ?? 0 })}</p>
        </div>
      </header>
      <DataTable
        columns={columns}
        rows={roles}
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
        rowLabel={(row) => row.name}
        toolbarEnd={createButton}
        filters={filters}
        tableLabel={t('admin.roles.title')}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t('admin.roles.confirmDelete.title')}
        destructive
        consequence={deleteTarget && <p>{deleteTarget.name}</p>}
      >
        <p>{t('admin.roles.confirmDelete.body')}</p>
      </ConfirmDialog>
    </div>
  );
}
