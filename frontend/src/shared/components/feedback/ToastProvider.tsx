import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { Toast, type ToastVariant } from './Toast';
import styles from './Toast.module.css';

export type { ToastVariant };

export interface ToastInput {
  variant?: ToastVariant;
  message: string;
  duration?: number;
}

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface TimerEntry {
  /** Milliseconds left to run — updated by `pause`, consumed by `resume`. */
  remaining: number;
  /** `Date.now()` when the current run started (or resumed). */
  startedAt: number;
  /** `undefined` while paused (no live timer to clear). */
  timeoutId: ReturnType<typeof setTimeout> | undefined;
}

export interface ToastContextValue {
  show(input: ToastInput): void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  // Per-toast timer bookkeeping — not React state, since pausing/resuming
  // must not itself trigger a re-render of the toast list.
  const timers = useRef<Map<number, TimerEntry>>(new Map());

  const remove = useCallback((id: number) => {
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number, duration: number) => {
      const timeoutId = setTimeout(() => remove(id), duration);
      timers.current.set(id, { remaining: duration, startedAt: Date.now(), timeoutId });
    },
    [remove],
  );

  // Toast hover-pause race: the timer may already have fired (and removed
  // the toast) between the user's pointer entering it and this call landing
  // — guard against a missing entry rather than throwing.
  const pause = useCallback((id: number) => {
    const entry = timers.current.get(id);
    if (!entry || entry.timeoutId === undefined) {
      return;
    }
    clearTimeout(entry.timeoutId);
    const elapsed = Date.now() - entry.startedAt;
    timers.current.set(id, { ...entry, remaining: Math.max(0, entry.remaining - elapsed), timeoutId: undefined });
  }, []);

  const resume = useCallback((id: number) => {
    const entry = timers.current.get(id);
    if (!entry || entry.timeoutId !== undefined) {
      return;
    }
    const timeoutId = setTimeout(() => remove(id), entry.remaining);
    timers.current.set(id, { ...entry, startedAt: Date.now(), timeoutId });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `remove` is stable (only depends on the ref + setToasts setter).
  }, []);

  const show = useCallback(
    ({ variant = 'info', message, duration = DEFAULT_DURATION }: ToastInput) => {
      let effectiveDuration = duration;
      // A danger toast can never auto-dismiss — anything that requires a
      // decision belongs in an `Alert`/`ConfirmDialog`, not a toast that
      // vanishes on its own. Force duration to 0 rather than silently
      // dropping the caller's intent, and say so loudly in dev.
      if (variant === 'danger' && duration !== 0) {
        effectiveDuration = 0;
        if (import.meta.env.DEV) {
          console.warn(
            '[Toast] variant="danger" toasts never auto-dismiss — forcing duration to 0. ' +
              'Use <Alert variant="danger" assertive /> (or a Modal/ConfirmDialog) for anything that requires a decision.',
          );
        }
      }

      const id = ++counter.current;
      setToasts((current) => [...current, { id, variant, message }]);
      if (effectiveDuration > 0) {
        schedule(id, effectiveDuration);
      }
    },
    [schedule],
  );

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            variant={toast.variant}
            message={toast.message}
            onDismiss={remove}
            onPause={pause}
            onResume={resume}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
