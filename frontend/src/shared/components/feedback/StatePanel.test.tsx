import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AccessDenied } from './AccessDenied';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { FilteredEmpty } from './FilteredEmpty';
import { LoadingState } from './LoadingState';
import { NotFound } from './NotFound';

describe('EmptyState', () => {
  it('renders a polite status role with a title and an optional action', () => {
    render(<EmptyState title="No users yet" action={<button>Create</button>} />);
    expect(screen.getByRole('status')).toHaveTextContent('No users yet');
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });
});

describe('FilteredEmpty', () => {
  it('renders active-filter chips and wires the Clear filters button', () => {
    const onClearFilters = vi.fn();
    render(<FilteredEmpty activeFilters={['Active', 'Admin']} onClearFilters={onClearFilters} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('renders with no chips when there are no active filters to describe', () => {
    render(<FilteredEmpty activeFilters={[]} onClearFilters={() => {}} />);
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders role="alert", calls onRetry, and shows the correlation id when set (AC4)', () => {
    const onRetry = vi.fn();
    render(<ErrorState description="Could not load" onRetry={onRetry} correlationId="req-42" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Reference: req-42')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('falls back to "(no reference)" rather than crashing when correlationId is falsy', () => {
    render(<ErrorState correlationId="" />);
    expect(screen.getByText('Reference: (no reference)')).toBeInTheDocument();
  });

  it('renders no reference line at all when correlationId is not passed', () => {
    render(<ErrorState />);
    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
  });
});

describe('LoadingState', () => {
  it('renders a polite status role', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('NotFound', () => {
  it('renders default copy and a Back to home action', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByText("We can't find that page")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to home' })).toBeInTheDocument();
  });

  it('calls a custom onBack handler when provided, instead of navigating itself', () => {
    const onBack = vi.fn();
    render(
      <MemoryRouter>
        <NotFound onBack={onBack} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back to home' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('AccessDenied', () => {
  it('renders default copy', () => {
    render(
      <MemoryRouter>
        <AccessDenied />
      </MemoryRouter>,
    );
    expect(screen.getByText("You don't have access to this")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to home' })).toBeInTheDocument();
  });

  it('renders a custom description', () => {
    render(
      <MemoryRouter>
        <AccessDenied description="Ask an admin for the User.Delete permission" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Ask an admin for the User.Delete permission')).toBeInTheDocument();
  });
});
