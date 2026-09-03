import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';

describe('Badge', () => {
  it('defaults to the neutral variant', () => {
    render(<Badge>Neutral</Badge>);
    expect(screen.getByText('Neutral')).toHaveAttribute('data-variant', 'neutral');
  });

  it('renders the info variant', () => {
    render(<Badge variant="info">Role</Badge>);
    expect(screen.getByText('Role')).toHaveAttribute('data-variant', 'info');
  });

  it('renders the success variant', () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText('Active')).toHaveAttribute('data-variant', 'success');
  });
});
