import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Alert } from './Alert';

const alertCss = readFileSync(join(process.cwd(), 'src/shared/components/feedback/Alert.module.css'), 'utf-8');

describe('Alert under RTL (AC12)', () => {
  afterEach(() => {
    document.documentElement.dir = '';
  });

  it('never hard-codes flex-direction: row-reverse — RTL mirroring is inherited from the writing mode', () => {
    expect(alertCss).not.toMatch(/row-reverse/);
  });

  it('Retry appears before Dismiss in DOM order even under RTL; both remain reachable and functional', () => {
    document.documentElement.dir = 'rtl';
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    render(
      <Alert variant="danger" onRetry={onRetry} dismissible onDismiss={onDismiss}>
        Something failed
      </Alert>,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Retry');
    expect(buttons[1]).toHaveAccessibleName('Dismiss');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders role="alert" for a danger banner even under RTL', () => {
    document.documentElement.dir = 'rtl';
    render(<Alert variant="danger">Failed</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
