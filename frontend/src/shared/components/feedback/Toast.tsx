import styles from './Toast.module.css';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps {
  variant: ToastVariant;
  message: string;
}

export function Toast({ variant, message }: ToastProps) {
  return (
    <div className={styles.toast} data-variant={variant}>
      {message}
    </div>
  );
}
