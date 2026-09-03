import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UserMenu } from './UserMenu';

describe('UserMenu', () => {
  it('renders the display name and calls onSignOut when the item is selected', () => {
    const onSignOut = vi.fn();
    render(
      <UserMenu displayName="Agent Example" email="agent@example.com" signOutLabel="Sign out" onSignOut={onSignOut} />,
    );

    expect(screen.getByText('Agent Example')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Agent Example' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('falls back to email when displayName is empty', () => {
    render(<UserMenu displayName="" email="agent@example.com" signOutLabel="Sign out" onSignOut={() => {}} />);
    expect(screen.getByText('agent@example.com')).toBeInTheDocument();
  });
});
