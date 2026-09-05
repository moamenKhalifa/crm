import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from './ToastProvider';
import type { ToastInput } from './ToastProvider';

function Trigger({ input }: { input: ToastInput }) {
  const { show } = useToast();
  return <button onClick={() => show(input)}>show</button>;
}

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('useToast().show enqueues a toast', () => {
    render(
      <ToastProvider>
        <Trigger input={{ message: 'Saved!', duration: 1000 }} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('show'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger input={{ message: 'Saved!', duration: 1000 }} />
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
  });

  it('the dismiss button removes the toast immediately', () => {
    render(
      <ToastProvider>
        <Trigger input={{ message: 'Saved!', duration: 0 }} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('show'));
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('hover pauses the auto-dismiss timer, and mouse leave resumes it', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger input={{ message: 'Saved!', duration: 1000 }} />
      </ToastProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('show'));
    });

    const toast = screen.getByText('Saved!').closest('div') as HTMLElement;

    act(() => {
      vi.advanceTimersByTime(600);
      fireEvent.mouseEnter(toast);
      vi.advanceTimersByTime(1000); // well past the original 1000ms — still paused
    });
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    act(() => {
      fireEvent.mouseLeave(toast);
      vi.advanceTimersByTime(399); // 400ms remained when paused (1000 - 600)
    });
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('focus pauses the timer and blur resumes it', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger input={{ message: 'Saved!', duration: 1000 }} />
      </ToastProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('show'));
    });

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });

    act(() => {
      vi.advanceTimersByTime(600);
      dismissButton.focus();
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    act(() => {
      dismissButton.blur();
      vi.advanceTimersByTime(399);
    });
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('pausing a toast whose timer already fired is a no-op (hover-pause race, does not throw)', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger input={{ message: 'Saved!', duration: 100 }} />
      </ToastProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('show'));
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('a danger toast with a non-zero duration is forced to duration=0 (never auto-dismissed) and warns in dev', () => {
    vi.useFakeTimers();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ToastProvider>
        <Trigger input={{ variant: 'danger', message: 'Failed!', duration: 4000 }} />
      </ToastProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('show'));
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('Failed!')).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Failed!')).not.toBeInTheDocument();
  });

  it('a danger toast with duration=0 does not warn (explicit, not defaulted)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ToastProvider>
        <Trigger input={{ variant: 'danger', message: 'Failed!', duration: 0 }} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('show'));
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('stacks multiple toasts with the newest rendered last', () => {
    function MultiTrigger() {
      const { show } = useToast();
      return (
        <button
          onClick={() => {
            show({ message: 'First', duration: 0 });
            show({ message: 'Second', duration: 0 });
          }}
        >
          show both
        </button>
      );
    }

    render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('show both'));
    const messages = screen.getAllByText(/^(First|Second)$/);
    expect(messages.map((el) => el.textContent)).toEqual(['First', 'Second']);
  });
});
