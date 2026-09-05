import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';

describe('Badge', () => {
  it('defaults to the neutral variant and tone', () => {
    render(<Badge>Neutral</Badge>);
    const badge = screen.getByText('Neutral');
    expect(badge).toHaveAttribute('data-variant', 'neutral');
    expect(badge).toHaveAttribute('data-tone', 'neutral');
  });

  it('tone="neutral" (the default) overrides a colour variant — a caller passing variant alone gets no colour (AC8)', () => {
    render(<Badge variant="info">Role</Badge>);
    const badge = screen.getByText('Role');
    expect(badge).toHaveAttribute('data-variant', 'neutral');
    expect(badge).toHaveAttribute('data-tone', 'neutral');
  });

  it('tone="semantic" maps the info variant to its colour', () => {
    render(
      <Badge variant="info" tone="semantic">
        Role
      </Badge>,
    );
    const badge = screen.getByText('Role');
    expect(badge).toHaveAttribute('data-variant', 'info');
    expect(badge).toHaveAttribute('data-tone', 'semantic');
  });

  it('tone="semantic" maps the success variant to its colour', () => {
    render(
      <Badge variant="success" tone="semantic">
        Active
      </Badge>,
    );
    expect(screen.getByText('Active')).toHaveAttribute('data-variant', 'success');
  });

  it('tone="semantic" maps the danger variant to its colour', () => {
    render(
      <Badge variant="danger" tone="semantic">
        Failed
      </Badge>,
    );
    expect(screen.getByText('Failed')).toHaveAttribute('data-variant', 'danger');
  });
});
