import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@features/authentication/AuthProvider';
import type { UserResponse } from '@features/authentication/api';
import { listRoles } from '@features/identity/roles/api';
import { isForbidden, useApiClient } from '@shared/api';
import { PermissionGate, useAuthorization } from '@shared/authorization';
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FilteredEmpty,
  Status,
  useDataTableState,
  useToast,
  type DataTableColumn,
  type DataTableFilterDef,
  type DataTableRowAction,
} from '@shared/components';
import { toUserMessage } from '@shared/errors';
import { useApiData } from '@shared/hooks';
import { useT } from '@shared/i18n';

import { deleteUser, listUsersPaged } from './api';
import styles from './UserListPage.module.css';

export default function UserListPage() {
  const { t } = useT();
  const toast = useToast();
  const client = useApiClient();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { hasPermission } = useAuthorization();
  const { state, setState, clearFilters } = useDataTableState();
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);

  const activeFilter = state.filters.is_active ?? [];
  const roleIdFilter = state.filters.role_id ?? [];

  const query = useApiData({
    fetch: (c) =>
      listUsersPaged(c, {
        limit: state.pageSize,
        offset: (state.page - 1) * state.pageSize,
        q: state.q || undefined,
        sort: state.sort ? `${state.sort.key}:${state.sort.dir}` : undefined,
        is_active: activeFilter[0] === 'true' ? true : activeFilter[0] === 'false' ? false : undefined,
        role_id: roleIdFilter.length > 0 ? roleIdFilter : undefined,
      }),
    deps: [
      state.page,
      state.pageSize,
      state.q,
      state.sort?.key,
      state.sort?.dir,
      activeFilter.join(','),
      roleIdFilter.join(','),
    ],
  });

  // Hydrates the `role_id` filter's option list — the same "fetch a full
  // list for a picker UI" pattern `UserRoleAssignModal.tsx` already uses.
  // `suppressForbiddenHandling`: this is a convenience lookup for an
  // optional filter, not the page's core data — a viewer with `User.View`
  // but not `Role.View` can still fully use this page, just without the
  // role filter (see `canFilterByRole` below). A 403 here must not fire the
  // global "Forbidden" toast/reauth-check meant for the page's own denial.
  const rolesQuery = useApiData({
    fetch: (c) => listRoles(c, { limit: 100, offset: 0 }, { suppressForbiddenHandling: true }),
    deps: [],
  });
  const canFilterByRole = !isForbidden(rolesQuery.error);

  const users = query.data?.items ?? [];
  const isInitialLoading = query.isLoading && query.data === undefined;
  const isRefetching = query.isLoading && query.data !== undefined;

  // Human-readable labels for whichever filters are currently active — shown
  // as chips in `FilteredEmpty` so the user can see *why* the list is empty.
  const activeFilterLabels: string[] = [
    ...(activeFilter[0]
      ? [t(activeFilter[0] === 'true' ? 'admin.users.status.active' : 'admin.users.status.inactive')]
      : []),
    ...(canFilterByRole
      ? roleIdFilter
          .map((id) => rolesQuery.data?.find((role) => role.id === id)?.name)
          .filter((name): name is string => Boolean(name))
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
      await deleteUser(client, target.id);
      toast.show({ variant: 'success', message: t('admin.users.toasts.deleted') });
      query.reload();
    } catch {
      toast.show({ variant: 'danger', message: t('errors.unexpected') });
    }
  };

  const columns: DataTableColumn<UserResponse>[] = [
    { key: 'full_name', labelKey: 'admin.users.columns.fullName', sortable: true, skeletonWidth: 16 },
    {
      key: 'email',
      labelKey: 'admin.users.columns.email',
      sortable: true,
      dir: 'ltr',
      skeletonWidth: 20,
      render: (row) => <span className={styles.muted}>{row.email}</span>,
    },
    {
      key: 'is_active',
      labelKey: 'admin.users.columns.active',
      sortable: true,
      skeletonWidth: 8,
      render: (row) => (
        <Status
          variant={row.is_active ? 'success' : 'neutral'}
          label={t(row.is_active ? 'admin.users.status.active' : 'admin.users.status.inactive')}
        />
      ),
    },
    {
      key: 'roles',
      labelKey: 'admin.users.columns.roles',
      hideBelow: 'tablet',
      skeletonWidth: 12,
      render: (row) => (
        <div className={styles.badgeGroup}>
          {row.roles.map((role) => (
            // Role chips are metadata, not a documented semantic state — the
            // default neutral tone applies (AC8); no `tone="semantic"`.
            <Badge key={role.id}>{role.name}</Badge>
          ))}
        </div>
      ),
    },
  ];

  const filters: DataTableFilterDef[] = [
    {
      key: 'is_active',
      labelKey: 'admin.users.filters.status',
      options: [
        { value: 'true', labelKey: 'admin.users.status.active' },
        { value: 'false', labelKey: 'admin.users.status.inactive' },
      ],
    },
    // Omitted entirely (not just empty) for a viewer without `Role.View` —
    // filtering-by-role is a convenience on top of the users list, not a
    // requirement to use it.
    ...(canFilterByRole
      ? [
          {
            key: 'role_id',
            labelKey: 'admin.users.filters.role',
            multi: true,
            options: (rolesQuery.data ?? []).map((role) => ({ value: role.id, label: role.name })),
          } satisfies DataTableFilterDef,
        ]
      : []),
  ];

  const rowActions = (row: UserResponse): DataTableRowAction<UserResponse>[] => {
    const isSelf = row.id === currentUser?.id;
    return [
      { key: 'view', labelKey: 'admin.users.actions.view', onSelect: (user) => navigate(user.id) },
      {
        key: 'edit',
        labelKey: 'admin.users.actions.edit',
        isAllowed: hasPermission('User.Update'),
        onSelect: (user) => navigate(`${user.id}/edit`),
      },
      {
        key: 'delete',
        labelKey: 'admin.users.actions.delete',
        variant: 'danger',
        isAllowed: hasPermission('User.Delete') && !isSelf,
        disabledReason: isSelf ? t('admin.common.actions.reason.cannotDeleteSelf') : undefined,
        onSelect: (user) => setDeleteTarget(user),
      },
    ];
  };

  const createButton = (
    <PermissionGate permission="User.Create">
      <Button variant="primary" onClick={() => navigate('new')}>
        {t('admin.users.create')}
      </Button>
    </PermissionGate>
  );

  const emptyState = <EmptyState title={t('admin.users.empty.title')} action={createButton} />;

  const filteredEmptyState = (
    <FilteredEmpty
      title={t('admin.users.emptyFiltered.title')}
      activeFilters={activeFilterLabels}
      onClearFilters={clearFilters}
    />
  );

  return (
    <div>
      <header className={styles.pageHeader}>
        <div>
          <h1 id="page-heading" tabIndex={-1} className={styles.pageTitle}>
            {t('admin.users.title')}
          </h1>
          <p className={styles.pageSubtitle}>{t('admin.users.subtitle', { count: query.data?.total ?? 0 })}</p>
        </div>
      </header>
      <DataTable
        columns={columns}
        rows={users}
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
        rowLabel={(row) => row.full_name}
        toolbarEnd={createButton}
        filters={filters}
        tableLabel={t('admin.users.title')}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
        title={t('admin.users.confirmDelete.title')}
        destructive
        consequence={deleteTarget && <p>{deleteTarget.email}</p>}
        confirmationPhrase={deleteTarget?.email}
      >
        <p>{t('admin.users.confirmDelete.body')}</p>
      </ConfirmDialog>
    </div>
  );
}
