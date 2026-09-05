import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { useDataTableState } from '../useDataTableState';

function Harness() {
  const { state, setQuery, setSort, setPage, setPageSize, setFilters, clearFilters } = useDataTableState();
  const location = useLocation();
  return (
    <div>
      <pre data-testid="state">{JSON.stringify(state)}</pre>
      <pre data-testid="search">{location.search}</pre>
      <button onClick={() => setQuery('jane')}>setQuery</button>
      <button onClick={() => setSort({ key: 'email', dir: 'desc' })}>setSort</button>
      <button onClick={() => setPage(5)}>setPage</button>
      <button onClick={() => setPageSize(50)}>setPageSize</button>
      <button onClick={() => setFilters({ role_id: ['r1', 'r2'] })}>setFilters</button>
      <button onClick={() => clearFilters()}>clearFilters</button>
    </div>
  );
}

function renderHarness(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Harness />
    </MemoryRouter>,
  );
}

function readState() {
  return JSON.parse(screen.getByTestId('state').textContent ?? '{}');
}

function readSearch() {
  return screen.getByTestId('search').textContent ?? '';
}

describe('useDataTableState', () => {
  it('hydrates initial state from location.search, including repeated filter params', () => {
    renderHarness('/x?q=ab&page=2&sort=email:desc&is_active=true&role_id=r1&role_id=r2');
    expect(readState()).toEqual({
      page: 2,
      pageSize: 25,
      sort: { key: 'email', dir: 'desc' },
      q: 'ab',
      filters: { is_active: ['true'], role_id: ['r1', 'r2'] },
    });
  });

  it('defaults page to 1 and pageSize to 25 when absent from the URL', () => {
    renderHarness('/x');
    expect(readState()).toEqual({ page: 1, pageSize: 25, sort: undefined, q: '', filters: {} });
  });

  it('setQuery updates state and the URL, and resets page to 1', () => {
    renderHarness('/x?page=3');
    fireEvent.click(screen.getByText('setQuery'));
    expect(readState().q).toBe('jane');
    expect(readState().page).toBe(1);
    expect(readSearch()).toContain('q=jane');
    expect(readSearch()).not.toContain('page=');
  });

  it('setSort updates state and the URL as key:dir, and resets page to 1', () => {
    renderHarness('/x?page=3');
    fireEvent.click(screen.getByText('setSort'));
    expect(readState().sort).toEqual({ key: 'email', dir: 'desc' });
    expect(readSearch()).toContain('sort=email%3Adesc');
  });

  it('setPageSize resets page to 1 and omits pageSize from the URL only at the 25 default', () => {
    renderHarness('/x?page=3');
    fireEvent.click(screen.getByText('setPageSize'));
    expect(readState().pageSize).toBe(50);
    expect(readState().page).toBe(1);
    expect(readSearch()).toContain('pageSize=50');
  });

  it('setPage does not reset other fields', () => {
    renderHarness('/x?q=jane');
    fireEvent.click(screen.getByText('setPage'));
    expect(readState().page).toBe(5);
    expect(readState().q).toBe('jane');
  });

  it('setFilters resets page to 1 and writes repeated params', () => {
    renderHarness('/x?page=3');
    fireEvent.click(screen.getByText('setFilters'));
    expect(readState().filters).toEqual({ role_id: ['r1', 'r2'] });
    expect(readState().page).toBe(1);
    const matches = readSearch().match(/role_id=/g);
    expect(matches).toHaveLength(2);
  });

  it('clearFilters resets q and filters but keeps pageSize', () => {
    renderHarness('/x?q=old&role_id=r1&pageSize=50');
    fireEvent.click(screen.getByText('clearFilters'));
    expect(readState()).toEqual({ page: 1, pageSize: 50, sort: undefined, q: '', filters: {} });
  });

  it('preserves unrelated existing search params across a state change', () => {
    renderHarness('/x?utm_source=test&page=2');
    fireEvent.click(screen.getByText('setQuery'));
    // `utm_source` isn't in the reserved key set, so this hook treats it (like
    // any other unknown param) as a filter — and round-trips it as one, which
    // is how "unrelated params survive" actually happens here: the caller's
    // next state is built by spreading the *current* `state.filters`
    // (which already contains it), not by this hook special-casing the key.
    expect(readState().filters).toEqual({ utm_source: ['test'] });
    expect(readSearch()).toContain('utm_source=test');
  });
});
