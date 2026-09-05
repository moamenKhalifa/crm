import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';

import { ConfigProvider } from '@app/configuration/ConfigProvider';
import { LocaleProvider } from '@shared/i18n';
import { defaultBranding, ThemeProvider } from '@shared/theme';

import { DataTable } from '../DataTable';
import type { DataTableColumn, DataTableState } from '../types';

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
  { key: 'email', labelKey: 'Email', dir: 'ltr' },
];

const STATE: DataTableState = { page: 1, pageSize: 10, q: '', filters: {} };

function wrap(children: ReactNode) {
  return (
    <ConfigProvider>
      <LocaleProvider>
        <ThemeProvider branding={defaultBranding}>{children}</ThemeProvider>
      </LocaleProvider>
    </ConfigProvider>
  );
}

describe('DataTable accessibility', () => {
  it('the default (populated) table has no automated axe violations', async () => {
    const { container } = render(
      wrap(
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(row) => row.id}
          totalCount={ROWS.length}
          state={STATE}
          onStateChange={vi.fn()}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />,
      ),
    );
    expect(await axe(container)).toHaveNoViolations();
  }, 20_000);

  it('the error state has no automated axe violations', async () => {
    const { container } = render(
      wrap(
        <DataTable
          columns={COLUMNS}
          rows={[]}
          rowKey={(row) => row.id}
          totalCount={0}
          state={STATE}
          onStateChange={vi.fn()}
          isError
          errorMessage="Something broke"
          onRetry={vi.fn()}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />,
      ),
    );
    expect(await axe(container)).toHaveNoViolations();
  }, 20_000);

  it('the empty state has no automated axe violations', async () => {
    const { container } = render(
      wrap(
        <DataTable
          columns={COLUMNS}
          rows={[]}
          rowKey={(row) => row.id}
          totalCount={0}
          state={STATE}
          onStateChange={vi.fn()}
          tableLabel="Test table"
          rowLabel={(row) => row.name}
        />,
      ),
    );
    expect(await axe(container)).toHaveNoViolations();
  }, 20_000);
});
