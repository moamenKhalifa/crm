import { useState } from 'react';

import {
  Badge,
  DataTable,
  Status,
  type DataTableColumn,
  type DataTableFilterDef,
  type DataTableRowAction,
  type DataTableState,
} from '@shared/components';
import { DataTableCards } from '@shared/components/data/DataTable/DataTableCards';
import { useLocale, useT } from '@shared/i18n';
import { formatDateTime } from '@shared/utils';

import styles from './DataTablePage.module.css';

interface MockRow {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  role: string;
  joinedAt: string;
}

const MOCK_ROWS: MockRow[] = [
  { id: '1', name: 'Amina Haddad', email: 'amina@example.com', status: 'active', role: 'Admin', joinedAt: '2024-01-12T09:30:00Z' },
  { id: '2', name: 'Bilal Karam', email: 'bilal@example.com', status: 'active', role: 'Agent', joinedAt: '2024-02-03T14:05:00Z' },
  { id: '3', name: 'Carmen Diaz', email: 'carmen@example.com', status: 'inactive', role: 'Agent', joinedAt: '2023-11-21T08:12:00Z' },
  { id: '4', name: 'Deniz Yilmaz', email: 'deniz@example.com', status: 'active', role: 'Viewer', joinedAt: '2024-03-30T17:45:00Z' },
  { id: '5', name: 'Elena Petrova', email: 'elena@example.com', status: 'active', role: 'Admin', joinedAt: '2023-08-04T11:00:00Z' },
  { id: '6', name: 'Farid Nasser', email: 'farid@example.com', status: 'inactive', role: 'Viewer', joinedAt: '2024-05-17T13:20:00Z' },
  { id: '7', name: 'Grace Okafor', email: 'grace@example.com', status: 'active', role: 'Agent', joinedAt: '2023-12-09T10:15:00Z' },
  { id: '8', name: 'Hassan Ali', email: 'hassan@example.com', status: 'active', role: 'Admin', joinedAt: '2024-06-02T09:00:00Z' },
  { id: '9', name: 'Ines Fontaine', email: 'ines@example.com', status: 'inactive', role: 'Agent', joinedAt: '2023-09-27T15:40:00Z' },
  { id: '10', name: 'Jamal Idris', email: 'jamal@example.com', status: 'active', role: 'Viewer', joinedAt: '2024-04-11T12:30:00Z' },
  { id: '11', name: 'Katarina Novak', email: 'katarina@example.com', status: 'active', role: 'Agent', joinedAt: '2023-10-05T16:10:00Z' },
  { id: '12', name: 'Liam O’Connor', email: 'liam@example.com', status: 'active', role: 'Admin', joinedAt: '2024-07-19T18:25:00Z' },
];

/** Client-side stand-in for a server fetch — search + sort + page the mock rows so the interactive demos behave like a real list. */
function applyMockState(rows: MockRow[], state: DataTableState): { pageRows: MockRow[]; total: number } {
  let filtered = rows;
  if (state.q) {
    const q = state.q.toLowerCase();
    filtered = filtered.filter((row) => row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q));
  }
  if (state.sort) {
    const { key, dir } = state.sort;
    filtered = [...filtered].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[key] ?? '');
      const bv = String((b as unknown as Record<string, unknown>)[key] ?? '');
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }
  const total = filtered.length;
  const start = (state.page - 1) * state.pageSize;
  return { pageRows: filtered.slice(start, start + state.pageSize), total };
}

function useMockColumns(): DataTableColumn<MockRow>[] {
  const { t } = useT();
  const { locale } = useLocale();

  return [
    { key: 'name', labelKey: 'designSystem.dataTable.mockColumns.name', sortable: true, skeletonWidth: 14 },
    {
      key: 'email',
      labelKey: 'designSystem.dataTable.mockColumns.email',
      sortable: true,
      dir: 'ltr',
      skeletonWidth: 18,
    },
    {
      key: 'status',
      labelKey: 'designSystem.dataTable.mockColumns.status',
      skeletonWidth: 8,
      render: (row) => (
        <Status
          variant={row.status === 'active' ? 'success' : 'neutral'}
          label={t(`designSystem.dataTable.mockStatus.${row.status}`)}
        />
      ),
    },
    {
      key: 'role',
      labelKey: 'designSystem.dataTable.mockColumns.role',
      hideBelow: 'tablet',
      skeletonWidth: 8,
      // Role/permission chips are metadata, not a documented semantic state —
      // per the design-system rule they render neutral by default. Badge's
      // default `tone="neutral"` already enforces this even though `variant`
      // isn't set here; no `tone="semantic"` opt-in for this kind of chip.
      render: (row) => <Badge>{row.role}</Badge>,
    },
    {
      key: 'joinedAt',
      labelKey: 'designSystem.dataTable.mockColumns.joined',
      dir: 'auto',
      skeletonWidth: 12,
      // Demonstrates `formatDateTime` (AC18) — no real Identity & Access
      // list page has a date field to wire this into yet, see Story 13's brief.
      render: (row) => {
        const { display, iso } = formatDateTime(new Date(row.joinedAt), locale);
        return (
          <time dateTime={iso} title={iso}>
            {display}
          </time>
        );
      },
    },
  ];
}

function DataTableGuidanceSection() {
  const { t } = useT();
  return (
    <section>
      <h2>{t('designSystem.dataTable.guidance.title')}</h2>
      <p>{t('designSystem.dataTable.guidance.use')}</p>
      <p>{t('designSystem.dataTable.guidance.avoid')}</p>
    </section>
  );
}

const API_REFERENCE_ROWS = [
  'columns',
  'rows',
  'rowKey',
  'totalCount',
  'state',
  'onStateChange',
  'isLoading',
  'isRefetching',
  'isError',
  'errorMessage',
  'onRetry',
  'emptyState',
  'filteredEmptyState',
  'rowActions',
  'toolbarStart',
  'toolbarEnd',
  'filters',
  'density',
  'tableLabel',
  'onRowRemoved',
  'skeletonRowCount',
  'rowLabel',
] as const;

function DataTableApiReferenceSection() {
  const { t } = useT();
  return (
    <section data-testid="ds-datatable-api-section">
      <h2>{t('designSystem.dataTable.sections.apiReference')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('designSystem.dataTable.apiReference.columns.prop')}</th>
            <th>{t('designSystem.dataTable.apiReference.columns.description')}</th>
          </tr>
        </thead>
        <tbody>
          {API_REFERENCE_ROWS.map((prop) => (
            <tr key={prop}>
              <td>
                <code>{prop}</code>
              </td>
              <td>{t(`designSystem.dataTable.apiReference.rows.${prop}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DataTableStatesSection() {
  const { t } = useT();
  const columns = useMockColumns();

  const [defaultState, setDefaultState] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
  const defaultResult = applyMockState(MOCK_ROWS, defaultState);

  const [sortedState, setSortedState] = useState<DataTableState>({
    page: 1,
    pageSize: 10,
    q: '',
    filters: {},
    sort: { key: 'name', dir: 'asc' },
  });
  const sortedResult = applyMockState(MOCK_ROWS, sortedState);

  const loadingState: DataTableState = { page: 1, pageSize: 10, q: '', filters: {} };

  const [refetchingState] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
  const refetchingResult = applyMockState(MOCK_ROWS, refetchingState);

  const emptyState: DataTableState = { page: 1, pageSize: 10, q: '', filters: {} };
  const filteredEmptyState: DataTableState = { page: 1, pageSize: 10, q: 'zzz-no-match', filters: {} };
  const errorState: DataTableState = { page: 1, pageSize: 10, q: '', filters: {} };

  const [disabledActionState] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
  const disabledActionResult = applyMockState(MOCK_ROWS, disabledActionState);
  const disabledRowActions = (row: MockRow): DataTableRowAction<MockRow>[] => [
    { key: 'view', labelKey: 'designSystem.dataTable.mockActions.view', onSelect: () => {} },
    {
      key: 'edit',
      labelKey: 'designSystem.dataTable.mockActions.edit',
      isAllowed: row.role === 'Admin',
      disabledReason: row.role === 'Admin' ? undefined : t('designSystem.dataTable.mockDisabledReason'),
      onSelect: () => {},
    },
  ];

  return (
    <section data-testid="ds-datatable-states-section">
      <h2>{t('designSystem.dataTable.sections.states')}</h2>

      <h3>{t('designSystem.dataTable.states.default')}</h3>
      <DataTable
        columns={columns}
        rows={defaultResult.pageRows}
        rowKey={(row) => row.id}
        totalCount={defaultResult.total}
        state={defaultState}
        onStateChange={setDefaultState}
        tableLabel={t('designSystem.dataTable.states.default')}
        rowLabel={(row) => row.name}
      />

      <h3>{t('designSystem.dataTable.states.sorted')}</h3>
      <DataTable
        columns={columns}
        rows={sortedResult.pageRows}
        rowKey={(row) => row.id}
        totalCount={sortedResult.total}
        state={sortedState}
        onStateChange={setSortedState}
        tableLabel={t('designSystem.dataTable.states.sorted')}
        rowLabel={(row) => row.name}
      />

      <h3>{t('designSystem.dataTable.states.loading')}</h3>
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        totalCount={0}
        state={loadingState}
        onStateChange={() => {}}
        isLoading
        tableLabel={t('designSystem.dataTable.states.loading')}
        rowLabel={(row) => row.name}
      />

      <h3>{t('designSystem.dataTable.states.refetching')}</h3>
      <DataTable
        columns={columns}
        rows={refetchingResult.pageRows}
        rowKey={(row) => row.id}
        totalCount={refetchingResult.total}
        state={refetchingState}
        onStateChange={() => {}}
        isRefetching
        tableLabel={t('designSystem.dataTable.states.refetching')}
        rowLabel={(row) => row.name}
      />

      <h3>{t('designSystem.dataTable.states.empty')}</h3>
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        totalCount={0}
        state={emptyState}
        onStateChange={() => {}}
        tableLabel={t('designSystem.dataTable.states.empty')}
        rowLabel={(row) => row.name}
      />

      <h3>{t('designSystem.dataTable.states.filteredEmpty')}</h3>
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        totalCount={0}
        state={filteredEmptyState}
        onStateChange={() => {}}
        tableLabel={t('designSystem.dataTable.states.filteredEmpty')}
        rowLabel={(row) => row.name}
      />

      <h3>{t('designSystem.dataTable.states.error')}</h3>
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        totalCount={0}
        state={errorState}
        onStateChange={() => {}}
        isError
        errorMessage={t('designSystem.dataTable.mockError')}
        onRetry={() => {}}
        tableLabel={t('designSystem.dataTable.states.error')}
        rowLabel={(row) => row.name}
      />

      <h3>{t('designSystem.dataTable.states.disabledAction')}</h3>
      <DataTable
        columns={columns}
        rows={disabledActionResult.pageRows}
        rowKey={(row) => row.id}
        totalCount={disabledActionResult.total}
        state={disabledActionState}
        onStateChange={() => {}}
        rowActions={disabledRowActions}
        tableLabel={t('designSystem.dataTable.states.disabledAction')}
        rowLabel={(row) => row.name}
      />
    </section>
  );
}

function DataTableRtlSection() {
  const { t } = useT();
  const columns = useMockColumns();
  const [state, setState] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
  const result = applyMockState(MOCK_ROWS, state);

  const filters: DataTableFilterDef[] = [
    {
      key: 'status',
      labelKey: 'designSystem.dataTable.mockColumns.status',
      options: [
        { value: 'active', labelKey: 'designSystem.dataTable.mockStatus.active' },
        { value: 'inactive', labelKey: 'designSystem.dataTable.mockStatus.inactive' },
      ],
    },
  ];

  return (
    <section data-testid="ds-datatable-rtl-section">
      <h2>{t('designSystem.dataTable.sections.rtl')}</h2>
      <div dir="rtl">
        <DataTable
          columns={columns}
          rows={result.pageRows}
          rowKey={(row) => row.id}
          totalCount={result.total}
          state={state}
          onStateChange={setState}
          filters={filters}
          tableLabel={t('designSystem.dataTable.sections.rtl')}
          rowLabel={(row) => row.name}
        />
      </div>
    </section>
  );
}

function DataTableOverflowSection() {
  const { t } = useT();
  const columns = useMockColumns();
  const [state, setState] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
  const result = applyMockState(MOCK_ROWS, state);

  const rowActions = (): DataTableRowAction<MockRow>[] => [
    { key: 'view', labelKey: 'designSystem.dataTable.mockActions.view', onSelect: () => {} },
    { key: 'edit', labelKey: 'designSystem.dataTable.mockActions.edit', onSelect: () => {} },
    { key: 'duplicate', labelKey: 'designSystem.dataTable.mockActions.duplicate', onSelect: () => {} },
    { key: 'archive', labelKey: 'designSystem.dataTable.mockActions.archive', onSelect: () => {} },
    { key: 'delete', labelKey: 'designSystem.dataTable.mockActions.delete', variant: 'danger', onSelect: () => {} },
  ];

  return (
    <section data-testid="ds-datatable-overflow-section">
      <h2>{t('designSystem.dataTable.sections.overflow')}</h2>
      <DataTable
        columns={columns}
        rows={result.pageRows}
        rowKey={(row) => row.id}
        totalCount={result.total}
        state={state}
        onStateChange={setState}
        rowActions={rowActions}
        tableLabel={t('designSystem.dataTable.sections.overflow')}
        rowLabel={(row) => row.name}
      />
    </section>
  );
}

function DataTableMobileSection() {
  const { t } = useT();
  const columns = useMockColumns();

  const rowActions = (): DataTableRowAction<MockRow>[] => [
    { key: 'view', labelKey: 'designSystem.dataTable.mockActions.view', onSelect: () => {} },
    { key: 'edit', labelKey: 'designSystem.dataTable.mockActions.edit', onSelect: () => {} },
  ];

  return (
    <section data-testid="ds-datatable-mobile-section">
      <h2>{t('designSystem.dataTable.sections.mobile')}</h2>
      <p>{t('designSystem.dataTable.mobile.note')}</p>
      <div className={styles.mobilePreview}>
        <DataTableCards
          columns={columns}
          rows={MOCK_ROWS.slice(0, 4)}
          rowKey={(row) => row.id}
          rowActions={rowActions}
          rowLabel={(row) => row.name}
        />
      </div>
    </section>
  );
}

export default function DataTablePage() {
  const { t } = useT();

  return (
    <main className={styles.page} data-testid="ds-datatable-section">
      <h1>{t('designSystem.dataTable.title')}</h1>
      <DataTableGuidanceSection />
      <DataTableApiReferenceSection />
      <DataTableStatesSection />
      <DataTableRtlSection />
      <DataTableOverflowSection />
      <DataTableMobileSection />
    </main>
  );
}
