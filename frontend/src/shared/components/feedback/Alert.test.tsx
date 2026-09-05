import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Alert } from './Alert';

describe('Alert', () => {
  it('defaults to role="status" for info/success/warning', () => {
    render(<Alert variant="info">Heads up</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('defaults to role="alert" for danger', () => {
    render(<Alert variant="danger">Something failed</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('the assertive prop overrides the variant default in either direction', () => {
    const { rerender } = render(
      <Alert variant="info" assertive>
        Urgent info
      </Alert>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(
      <Alert variant="danger" assertive={false}>
        Quiet danger
      </Alert>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('calls onRetry when the Retry button is clicked', () => {
    const onRetry = vi.fn();
    render(
      <Alert variant="danger" onRetry={onRetry}>
        Failed to load
      </Alert>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the correlation id when set', () => {
    render(
      <Alert variant="danger" correlationId="abc-123">
        Failed
      </Alert>,
    );
    expect(screen.getByText('Reference: abc-123')).toBeInTheDocument();
  });

  it('does not render a correlation id when unset', () => {
    render(<Alert variant="danger">Failed</Alert>);
    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
  });

  it('dismiss hides the alert and calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(
      <Alert variant="info" dismissible onDismiss={onDismiss}>
        Notice
      </Alert>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Notice')).not.toBeInTheDocument();
  });

  it('renders extra actions alongside Retry', () => {
    render(
      <Alert variant="success" actions={<a href="/next">Continue</a>}>
        Saved
      </Alert>,
    );
    expect(screen.getByRole('link', { name: 'Continue' })).toBeInTheDocument();
  });

  it('renders an optional title', () => {
    render(
      <Alert variant="warning" title="Approaching limit">
        You are near your quota.
      </Alert>,
    );
    expect(screen.getByText('Approaching limit')).toBeInTheDocument();
  });
});
