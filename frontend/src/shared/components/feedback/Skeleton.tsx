import type { CSSProperties } from 'react';

import styles from './Skeleton.module.css';

export interface SkeletonProps {
  inlineSize?: CSSProperties['inlineSize'];
  blockSize?: CSSProperties['blockSize'];
  className?: string;
}

/** Decorative shimmer placeholder — never announced, never focusable (G9). */
export function Skeleton({ inlineSize, blockSize, className }: SkeletonProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ inlineSize, blockSize }}
    />
  );
}
