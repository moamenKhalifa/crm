import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';

import { DataTable } from '../DataTable';
import type { DataTableColumn, DataTableRowAction, DataTableState } from '../types';

interface Row {
  id: string;
  name: string;
  email: string;
}

const ROWS: Row[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

const COLUMNS: DataTableColumn<Row>[] = [
  { key: 'name', labelKey: 'Name', sortable: true },
  { key: 'email', labelKey: 'Email', hideBelow: 'tablet' },
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

/** Same pattern `useBreakpoint.test.tsx` uses — jsdom has no real viewport, so `matchMedia` is stubbed per-query against a fake width. */
function mockMatchMediaAtWidth(widthPx: number) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => {
      const match = /min-width:\s*(\d+)px/.exec(query);
      const minWidth = match ? Number(match[1]) : 0;
      return {
        matches: widthPx >= minWidth,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }),
  );
}

describe('DataTable — mobile card layout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const state: DataTableState = { page: 1, pageSize: 10, q: '', filters: {} };

  it('renders DataTableCards instead of a <table> below the tablet breakpoint', () => {
    mockMatchMediaAtWidth(320);
    render(
      wrap(
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(row) => row.id}
          totalCount={ROWS.length}
          state={state}
          onStateChange={vi.fn()}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />,
      ),
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(ROWS.length);
    // `hideBelow: 'tablet'` only hides a column in the desktop table — mobile cards show every column.
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('renders the same row actions in the card layout', () => {
    mockMatchMediaAtWidth(320);
    const rowActions = (): DataTableRowAction<Row>[] => [
      { key: 'view', labelKey: 'View', onSelect: vi.fn() },
      { key: 'edit', labelKey: 'Edit', onSelect: vi.fn() },
    ];
    render(
      wrap(
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(row) => row.id}
          totalCount={ROWS.length}
          state={state}
          onStateChange={vi.fn()}
          rowActions={rowActions}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />,
      ),
    );
    expect(screen.getByRole('button', { name: 'View — Alice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit — Bob' })).toBeInTheDocument();
  });

  it('renders the <table> again at desktop widths', () => {
    mockMatchMediaAtWidth(1200);
    render(
      wrap(
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(row) => row.id}
          totalCount={ROWS.length}
          state={state}
          onStateChange={vi.fn()}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />,
      ),
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
