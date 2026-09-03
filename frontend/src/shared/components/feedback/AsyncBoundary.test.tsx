import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { UseApiDataResult } from '@shared/hooks/useApiData';

import { AsyncBoundary } from './AsyncBoundary';

function makeQuery<T>(overrides: Partial<UseApiDataResult<T>>): UseApiDataResult<T> {
  return { data: undefined, error: undefined, isLoading: false, reload: vi.fn(), ...overrides };
}

describe('AsyncBoundary', () => {
  it('renders LoadingState while isLoading', () => {
    render(
      <AsyncBoundary query={makeQuery({ isLoading: true })}>{() => <p>content</p>}</AsyncBoundary>,
    );
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders ErrorState and calls reload on retry', () => {
    const query = makeQuery({ error: new Error('boom') });
    render(<AsyncBoundary query={query}>{() => <p>content</p>}</AsyncBoundary>);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(query.reload).toHaveBeenCalledTimes(1);
  });

  it('renders the empty node when data is an empty array', () => {
    render(
      <AsyncBoundary query={makeQuery<string[]>({ data: [] })} empty={<p>nothing here</p>}>
        {() => <p>content</p>}
      </AsyncBoundary>,
    );
    expect(screen.getByText('nothing here')).toBeInTheDocument();
  });

  it('renders children with data otherwise', () => {
    render(
      <AsyncBoundary query={makeQuery({ data: 'hello' })}>{(data) => <p>{data}</p>}</AsyncBoundary>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
});
