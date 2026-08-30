import { Badge, type BadgeVariant } from './Badge';
import styles from './Status.module.css';

export interface StatusProps {
  variant?: BadgeVariant;
  label: string;
}

export function Status({ variant = 'neutral', label }: StatusProps) {
  return (
    <Badge variant={variant}>
      <span className={styles.dot} data-variant={variant} aria-hidden="true" />
      {label}
    </Badge>
  );
}
