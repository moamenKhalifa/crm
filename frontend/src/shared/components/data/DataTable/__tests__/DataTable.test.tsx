import { useState, type ComponentProps, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';
import { formatDateTime } from '@shared/utils';

import { DataTable } from '../DataTable';
import type { DataTableColumn, DataTableFilterDef, DataTableRowAction, DataTableState } from '../types';

interface Row {
  id: string;
  name: string;
  email: string;
}

const ROWS: Row[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
  { id: '3', name: 'Carol', email: 'carol@example.com' },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', labelKey: 'Name', sortable: true, skeletonWidth: 10 },
  { key: 'email', labelKey: 'Email', sortable: true, dir: 'ltr', skeletonWidth: 14 },
];

function wrap(children: ReactNode) {
  return (
    <ConfigProvider>
      <LocaleProvider>
        <ThemeProvider branding={defaultBranding}>{children}</ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>
  );
}

type DataTableTestProps = Partial<ComponentProps<typeof DataTable<Row>>>;

function renderTable(props: DataTableTestProps = {}) {
  const onStateChange = props.onStateChange ?? vi.fn();
  const state: DataTableState = props.state ?? { page: 1, pageSize: 10, q: '', filters: {} };
  const rows = props.rows ?? ROWS;
  return render(
    wrap(
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(row) => row.id}
        totalCount={props.totalCount ?? rows.length}
        tableLabel="Test table"
        rowLabel={(row) => row.name}
        {...props}
        state={state}
        onStateChange={onStateChange}
      />,
    ),
  );
}

describe('DataTable — rendering', () => {
  it('renders column headers, rows, and dir="ltr" on the email cell', () => {
    renderTable();
    expect(screen.getByRole('region', { name: 'Test table' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Email/ })).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toHaveAttribute('dir', 'ltr');
  });

  it('gives the table region/caption the tableLabel as its accessible name', () => {
    renderTable({ tableLabel: 'Users' });
    expect(screen.getByRole('region', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Users' })).toBeInTheDocument();
  });
});

describe('DataTable — sorting', () => {
  it('cycles none -> asc -> desc -> none across three clicks, updating aria-sort', () => {
    function Harness() {
      const [state, setState] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
      return (
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(row) => row.id}
          totalCount={ROWS.length}
          state={state}
          onStateChange={setState}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />
      );
    }
    render(wrap(<Harness />));

    const header = () => screen.getByRole('columnheader', { name: /Name/ });
    expect(header()).toHaveAttribute('aria-sort', 'none');

    fireEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(header()).toHaveAttribute('aria-sort', 'ascending');

    fireEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(header()).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(header()).toHaveAttribute('aria-sort', 'none');
  });

  it('calls onStateChange with the next sort value and resets page to 1', () => {
    const onStateChange = vi.fn();
    renderTable({ onStateChange, state: { page: 3, pageSize: 10, q: '', filters: {} } });
    fireEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onStateChange).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      q: '',
      filters: {},
      sort: { key: 'name', dir: 'asc' },
    });
  });
});

describe('DataTable — search debounce', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('never propagates a single keystroke, and propagates 2+ chars ~300ms after the user stops typing', () => {
    vi.useFakeTimers();
    const onStateChange = vi.fn();
    renderTable({ onStateChange });

    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: 'a' } });
    vi.advanceTimersByTime(1000);
    expect(onStateChange).not.toHaveBeenCalled();

    fireEvent.change(search, { target: { value: 'al' } });
    vi.advanceTimersByTime(299);
    expect(onStateChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({ q: 'al', page: 1 }));
  });
});

describe('DataTable — states', () => {
  it('shows shimmer rows with the header still visible while isLoading and no rows yet', () => {
    renderTable({ isLoading: true, rows: [], totalCount: 0 });
    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('dims the body and marks it aria-busy while isRefetching with existing rows', () => {
    renderTable({ isRefetching: true });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    const tbody = document.querySelector('tbody');
    expect(tbody).toHaveAttribute('aria-busy', 'true');
  });

  it('renders a retry row on error while keeping the toolbar interactive', () => {
    const onRetry = vi.fn();
    renderTable({ isError: true, errorMessage: 'Boom', onRetry, rows: [], totalCount: 0 });
    expect(screen.getByText('Boom')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();

    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: 'ab' } });
    expect(search).toHaveValue('ab');
  });

  it('renders the generic empty state when there are no active filters', () => {
    renderTable({ rows: [], totalCount: 0 });
    expect(screen.getByText('Nothing to show yet.')).toBeInTheDocument();
  });

  it('renders the filtered-empty state when a search/filter is active, and Clear filters resets only q+filters', () => {
    const onStateChange = vi.fn();
    renderTable({
      onStateChange,
      rows: [],
      totalCount: 0,
      state: { page: 2, pageSize: 50, q: 'zzz', filters: { status: ['active'] } },
    });
    expect(screen.getByText('Nothing matches these filters.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onStateChange).toHaveBeenCalledWith({ page: 1, pageSize: 50, q: '', filters: {} });
  });
});

describe('DataTable — filters', () => {
  it('changing a single-select filter resets page to 1', () => {
    const onStateChange = vi.fn();
    const filters: DataTableFilterDef[] = [
      {
        key: 'status',
        labelKey: 'Status',
        options: [
          { value: 'active', labelKey: 'Active' },
          { value: 'inactive', labelKey: 'Inactive' },
        ],
      },
    ];
    renderTable({ onStateChange, filters, state: { page: 3, pageSize: 10, q: '', filters: {} } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'active' } });
    expect(onStateChange).toHaveBeenCalledWith({ page: 1, pageSize: 10, q: '', filters: { status: ['active'] } });
  });

  it('toggling two values of a multi filter accumulates both', () => {
    function Harness() {
      const [state, setState] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
      const filters: DataTableFilterDef[] = [
        {
          key: 'role_id',
          labelKey: 'Role',
          multi: true,
          options: [
            { value: 'r1', label: 'Admin' },
            { value: 'r2', label: 'Agent' },
          ],
        },
      ];
      return (
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(row) => row.id}
          totalCount={ROWS.length}
          state={state}
          onStateChange={setState}
          filters={filters}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />
      );
    }
    render(wrap(<Harness />));

    fireEvent.click(screen.getByRole('button', { name: 'Role' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Admin' }));
    expect(screen.getByRole('button', { name: 'Role (1)' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Agent' }));
    expect(screen.getByRole('button', { name: 'Role (2)' })).toBeInTheDocument();
  });
});

describe('DataTable — row actions', () => {
  it('renders 3 or fewer actions inline with no overflow menu', () => {
    const rowActions = (): DataTableRowAction<Row>[] => [
      { key: 'view', labelKey: 'View', onSelect: vi.fn() },
      { key: 'edit', labelKey: 'Edit', onSelect: vi.fn() },
      { key: 'delete', labelKey: 'Delete', onSelect: vi.fn() },
    ];
    renderTable({ rowActions });
    expect(screen.queryByRole('button', { name: /More actions/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^View —/ })).toHaveLength(ROWS.length);
  });

  it('overflows the 3rd+ action into a menu once there are more than 3', () => {
    const rowActions = (): DataTableRowAction<Row>[] => [
      { key: 'view', labelKey: 'View', onSelect: vi.fn() },
      { key: 'edit', labelKey: 'Edit', onSelect: vi.fn() },
      { key: 'archive', labelKey: 'Archive', onSelect: vi.fn() },
      { key: 'delete', labelKey: 'Delete', variant: 'danger', onSelect: vi.fn() },
    ];
    renderTable({ rowActions });

    expect(screen.getByRole('button', { name: 'View — Alice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit — Alice' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive — Alice' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'More actions for Alice' }));
    expect(screen.getByRole('menuitem', { name: /Archive/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Delete/ })).toBeInTheDocument();
  });

  it('disables a disallowed action and surfaces the reason via title/aria-describedby', () => {
    const rowActions = (): DataTableRowAction<Row>[] => [
      { key: 'edit', labelKey: 'Edit', isAllowed: false, disabledReason: 'Nope', onSelect: vi.fn() },
    ];
    renderTable({ rowActions });
    const button = screen.getAllByRole('button', { name: /^Edit —/ })[0];
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Nope');
    const describedBy = button.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Nope');
  });

  it("each action's accessible name includes the row label", () => {
    const rowActions = (): DataTableRowAction<Row>[] => [{ key: 'view', labelKey: 'View', onSelect: vi.fn() }];
    renderTable({ rowActions });
    expect(screen.getByRole('button', { name: 'View — Alice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View — Bob' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View — Carol' })).toBeInTheDocument();
  });

  it('moves focus to the next row after a middle row is removed from an otherwise-unchanged state', () => {
    function Harness() {
      const [rows, setRows] = useState(ROWS);
      const [state] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
      const rowActions = (row: Row): DataTableRowAction<Row>[] => [
        { key: 'delete', labelKey: 'Delete', onSelect: () => setRows((prev) => prev.filter((r) => r.id !== row.id)) },
      ];
      return (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.id}
          totalCount={rows.length}
          state={state}
          onStateChange={() => {}}
          rowActions={rowActions}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />
      );
    }
    render(wrap(<Harness />));

    fireEvent.click(screen.getByRole('button', { name: 'Delete — Bob' }));
    expect(screen.getByRole('button', { name: 'Delete — Carol' })).toHaveFocus();
  });

  it('moves focus to the previous row after the last row is removed', () => {
    function Harness() {
      const [rows, setRows] = useState(ROWS);
      const [state] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
      const rowActions = (row: Row): DataTableRowAction<Row>[] => [
        { key: 'delete', labelKey: 'Delete', onSelect: () => setRows((prev) => prev.filter((r) => r.id !== row.id)) },
      ];
      return (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.id}
          totalCount={rows.length}
          state={state}
          onStateChange={() => {}}
          rowActions={rowActions}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />
      );
    }
    render(wrap(<Harness />));

    fireEvent.click(screen.getByRole('button', { name: 'Delete — Carol' }));
    expect(screen.getByRole('button', { name: 'Delete — Bob' })).toHaveFocus();
  });

  it('moves focus to the search field once the last remaining row is removed', () => {
    function Harness() {
      const [rows, setRows] = useState([ROWS[0]]);
      const [state] = useState<DataTableState>({ page: 1, pageSize: 10, q: '', filters: {} });
      const rowActions = (row: Row): DataTableRowAction<Row>[] => [
        { key: 'delete', labelKey: 'Delete', onSelect: () => setRows((prev) => prev.filter((r) => r.id !== row.id)) },
      ];
      return (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row.id}
          totalCount={rows.length}
          state={state}
          onStateChange={() => {}}
          rowActions={rowActions}
          emptyState={<p>Nothing left</p>}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />
      );
    }
    render(wrap(<Harness />));

    fireEvent.click(screen.getByRole('button', { name: 'Delete — Alice' }));
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });
});

describe('DataTable — dates', () => {
  it('a column using formatDateTime renders the display string and dateTime/title ISO value', () => {
    interface RowWithDate extends Row {
      joinedAt: string;
    }
    const columns: DataTableColumn<RowWithDate>[] = [
      ...COLUMNS,
      {
        key: 'joinedAt',
        labelKey: 'Joined',
        dir: 'auto',
        render: (row) => {
          const { display, iso } = formatDateTime(new Date(row.joinedAt), 'en');
          return (
            <time dateTime={iso} title={iso}>
              {display}
            </time>
          );
        },
      },
    ];
    const rows: RowWithDate[] = ROWS.map((row) => ({ ...row, joinedAt: '2024-01-01T00:00:00Z' }));
    render(
      wrap(
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          totalCount={rows.length}
          state={{ page: 1, pageSize: 10, q: '', filters: {} }}
          onStateChange={vi.fn()}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />,
      ),
    );
    const timeElements = document.querySelectorAll('time');
    expect(timeElements.length).toBe(rows.length);
    expect(timeElements[0]).toHaveAttribute('dateTime', '2024-01-01T00:00:00.000Z');
    expect(timeElements[0]).toHaveAttribute('title', '2024-01-01T00:00:00.000Z');
  });
});

describe('DataTable — RTL', () => {
  it('keeps dir="ltr" on an ltr column cell even inside a dir="rtl" ancestor', () => {
    render(
      <div dir="rtl">
        {wrap(
          <DataTable
            columns={COLUMNS}
            rows={ROWS}
            rowKey={(row) => row.id}
            totalCount={ROWS.length}
            state={{ page: 1, pageSize: 10, q: '', filters: {} }}
            onStateChange={vi.fn()}
            tableLabel="Test table"
            rowLabel={(row) => row.name}
          />,
        )}
      </div>,
    );
    expect(screen.getByText('alice@example.com')).toHaveAttribute('dir', 'ltr');
  });
});
