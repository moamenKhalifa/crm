import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from './ToastProvider';

function Trigger() {
  const { show } = useToast();
  return <button onClick={() => show({ message: 'Saved!', duration: 1000 })}>show</button>;
}

describe('Toast', () => {
  it('useToast().show enqueues a toast', () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('show'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('show'));
    });
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
