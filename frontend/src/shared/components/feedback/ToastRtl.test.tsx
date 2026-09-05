import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ToastProvider, useToast } from './ToastProvider';

// jsdom does not compute layout, so a physical left/right position can't be
// asserted by measuring pixels — assert against the CSS source instead, the
// same pattern `AppSidebar.rtl.test.tsx` uses.
const toastCss = readFileSync(join(process.cwd(), 'src/shared/components/feedback/Toast.module.css'), 'utf-8');

function Trigger() {
  const { show } = useToast();
  return <button onClick={() => show({ message: 'Saved!', duration: 0 })}>show</button>;
}

describe('Toast under RTL (AC12)', () => {
  afterEach(() => {
    document.documentElement.dir = '';
  });

  it('the viewport is anchored with inset-inline-end / inset-block-end, never physical right/bottom', () => {
    expect(toastCss).toContain('inset-inline-end');
    expect(toastCss).toContain('inset-block-end');
    expect(/(?<![-\w])right\s*:/.test(toastCss)).toBe(false);
    expect(/(?<![-\w])bottom\s*:/.test(toastCss)).toBe(false);
  });

  it('renders and dismisses correctly with the document set to RTL', () => {
    document.documentElement.dir = 'rtl';
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('show'));
    });
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });
});
