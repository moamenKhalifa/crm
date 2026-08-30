import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppRoot } from './AppRoot';

describe('AppRoot', () => {
  it('redirects an unauthenticated visitor at / to /sign-in via /agent', async () => {
    window.history.pushState({}, '', '/');
    render(<AppRoot />);

    // / -> /agent (unprotected redirect) -> /agent requires auth -> /sign-in
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});
