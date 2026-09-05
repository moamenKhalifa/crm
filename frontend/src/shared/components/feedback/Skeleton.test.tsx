import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

const skeletonCss = readFileSync(join(process.cwd(), 'src/shared/components/feedback/Skeleton.module.css'), 'utf-8');

describe('Skeleton', () => {
  it('is a presentation-only, aria-hidden placeholder sized via inline/block size', () => {
    const { container } = render(<Skeleton inlineSize="60%" blockSize="1.5em" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute('role', 'presentation');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el.style.inlineSize).toBe('60%');
    expect(el.style.blockSize).toBe('1.5em');
  });

  it('respects prefers-reduced-motion by disabling the animation (source assertion — jsdom does not evaluate @media)', () => {
    expect(skeletonCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(skeletonCss).toMatch(/animation:\s*none/);
    expect(skeletonCss).toMatch(/background:\s*var\(--color-surface-muted\)/);
  });
});
