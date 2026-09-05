import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoadingBoundary } from './LoadingBoundary';

describe('LoadingBoundary', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the fallback immediately while loading', () => {
    render(
      <LoadingBoundary loading fallback={<p>Loading fallback</p>}>
        <p>Content</p>
      </LoadingBoundary>,
    );
    expect(screen.getByText('Loading fallback')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders children immediately when never loading', () => {
    render(
      <LoadingBoundary loading={false} fallback={<p>Loading fallback</p>}>
        <p>Content</p>
      </LoadingBoundary>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading fallback')).not.toBeInTheDocument();
  });

  it('holds the fallback for at least minDuration after loading flips to false at 50ms (AC10, no flicker)', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <LoadingBoundary loading minDuration={300} fallback={<p>Loading fallback</p>}>
        <p>Content</p>
      </LoadingBoundary>,
    );
    expect(screen.getByText('Loading fallback')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender(
      <LoadingBoundary loading={false} minDuration={300} fallback={<p>Loading fallback</p>}>
        <p>Content</p>
      </LoadingBoundary>,
    );
    // Loading resolved in 50ms — still well within the 300ms hold.
    expect(screen.getByText('Loading fallback')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(150); // 200ms since the flip — comfortably short of the ~250ms remaining
    });
    expect(screen.getByText('Loading fallback')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500); // well past any remaining hold, whatever small real-clock noise added
    });
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('never shows the fallback at all when loading starts and stays false', () => {
    vi.useFakeTimers();
    render(
      <LoadingBoundary loading={false} minDuration={300} fallback={<p>Loading fallback</p>}>
        <p>Content</p>
      </LoadingBoundary>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading fallback')).not.toBeInTheDocument();
  });

  it('uses a 300ms-scale default minDuration when none is passed', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <LoadingBoundary loading fallback={<p>Loading fallback</p>}>
        <p>Content</p>
      </LoadingBoundary>,
    );

    act(() => {
      vi.advanceTimersByTime(10);
    });
    rerender(
      <LoadingBoundary loading={false} fallback={<p>Loading fallback</p>}>
        <p>Content</p>
      </LoadingBoundary>,
    );

    // Comfortably below the ~290ms remaining, allowing generous margin for
    // any real-clock noise in `performance.now()` under fake timers.
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByText('Loading fallback')).toBeInTheDocument();

    // Comfortably past the full default hold.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
