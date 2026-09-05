import { Badge, type BadgeVariant } from './Badge';
import styles from './Status.module.css';

export interface StatusProps {
  variant?: BadgeVariant;
  label: string;
}

/**
 * Status chip: dot + label, never colour alone (AC7). The dot is
 * `aria-hidden`, so `label` alone forms the accessible name — no separate
 * sr-only echo of the label is added, since that would duplicate the
 * accessible name rather than clarify it.
 *
 * Always opts Badge in to its semantic colour (`tone="semantic"`) — a
 * status's colour is exactly the "documented state map" case tone-gating
 * exists to allow, unlike a plain metadata chip.
 */
export function Status({ variant = 'neutral', label }: StatusProps) {
  return (
    <Badge variant={variant} tone="semantic">
      <span className={styles.dot} data-variant={variant} aria-hidden="true" />
      {label}
    </Badge>
  );
}
