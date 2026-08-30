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

export interface ToastContextValue {
  show(input: ToastInput): void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);
const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    ({ variant = 'info', message, duration = DEFAULT_DURATION }: ToastInput) => {
      const id = ++counter.current;
      setToasts((current) => [...current, { id, variant, message }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} variant={toast.variant} message={toast.message} />
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
