import type { ReactNode } from 'react';

import styles from './Badge.module.css';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeTone = 'neutral' | 'semantic';

export interface BadgeProps {
  variant?: BadgeVariant;
  /**
   * `'neutral'` (default) always renders neutral styling, regardless of
   * `variant` — colour is applied only where it maps to a documented
   * semantic state (AC8). Pass `tone="semantic"` to opt in to `variant`'s
   * colour (used by `Status`, for example).
   */
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ variant = 'neutral', tone = 'neutral', children }: BadgeProps) {
  // Enforced at the render boundary, not just the type: a caller passing
  // `variant="info"` without `tone="semantic"` must not get colour.
  const appliedVariant: BadgeVariant = tone === 'semantic' ? variant : 'neutral';

  return (
    <span className={styles.badge} data-variant={appliedVariant} data-tone={tone}>
      {children}
    </span>
  );
}
