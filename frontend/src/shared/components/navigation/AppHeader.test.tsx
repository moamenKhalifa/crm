import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultBranding } from '@shared/theme';

import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  it('renders the logo <img>, decorative (empty alt) since the adjacent app-name text already carries the brand name (AC1)', () => {
    const { container } = render(<AppHeader branding={defaultBranding} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', '');
    expect(screen.getByText(defaultBranding.appName)).toBeInTheDocument();
  });

  it('falls back to the app-name text when the logo fails to load, without a broken image (AC1)', () => {
    const { container } = render(<AppHeader branding={defaultBranding} />);

    const img = container.querySelector('img') as HTMLImageElement;
    fireEvent.error(img);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(screen.getByText(defaultBranding.appName)).toBeInTheDocument();
  });

  it('the brand is a link to "/" labelled home', () => {
    render(<AppHeader branding={defaultBranding} />);
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders an optional menuToggle slot', () => {
    render(<AppHeader branding={defaultBranding} menuToggle={<button>☰</button>} />);
    expect(screen.getByRole('button', { name: '☰' })).toBeInTheDocument();
  });
});
