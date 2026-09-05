import type { ComponentProps } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LocaleProvider } from '@shared/i18n';

import { UserMenu } from './UserMenu';

function renderMenu(props: Partial<ComponentProps<typeof UserMenu>> = {}) {
  return render(
    <LocaleProvider>
      <UserMenu
        displayName="Moamen Khalifa"
        email="moamen@example.com"
        signOutLabel="Sign out"
        onSignOut={vi.fn()}
        {...props}
      />
    </LocaleProvider>,
  );
}

describe('UserMenu', () => {
  it('the trigger is a button with aria-haspopup="menu" and avatar initials "MK"', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: /Moamen Khalifa/ });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(screen.getByText('MK')).toBeInTheDocument();
  });

  it('renders roleLabel under the name', () => {
    renderMenu({ roleLabel: 'Administrator' });
    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('menu opens on click and Escape closes it (AC7)', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: /Moamen Khalifa/ });

    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('the Language items show English and العربية; selecting العربية calls setLocale', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: /Moamen Khalifa/ }));

    expect(screen.getByRole('menuitem', { name: /^English/ })).toBeInTheDocument();
    const arabicItem = screen.getByRole('menuitem', { name: /^العربية/ });
    fireEvent.click(arabicItem);

    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    // Re-open and confirm the checkmark now sits on the Arabic item — this
    // confirms `setLocale('ar')` actually ran and the switcher reflects it.
    fireEvent.click(screen.getByRole('button', { name: /Moamen Khalifa/ }));
    expect(screen.getByRole('menuitem', { name: /^العربية ✓/ })).toBeInTheDocument();
    document.documentElement.dir = '';
  });
});
