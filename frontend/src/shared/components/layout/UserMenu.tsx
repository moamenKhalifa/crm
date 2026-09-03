import { Dropdown, type DropdownItem } from '../overlay/Dropdown';
import styles from './UserMenu.module.css';

export interface UserMenuProps {
  displayName: string;
  email: string;
  signOutLabel: string;
  onSignOut(): void;
  /** TODO(IA-6): wired once /profile ships. */
  profileHref?: string;
  /** TODO(IA-9): wired once /profile/password ships. */
  changePasswordHref?: string;
  profileLabel?: string;
  changePasswordLabel?: string;
}

/** Trigger shows only the display name/email — never a token or role. */
export function UserMenu({
  displayName,
  email,
  signOutLabel,
  onSignOut,
  profileHref,
  changePasswordHref,
  profileLabel,
  changePasswordLabel,
}: UserMenuProps) {
  const label = displayName || email;

  const items: DropdownItem[] = [];

  if (profileHref && profileLabel) {
    items.push({
      key: 'profile',
      label: profileLabel,
      // TODO(IA-6): navigate to `profileHref` once /profile ships.
      onSelect: () => {
        window.location.assign(profileHref);
      },
    });
  }

  if (changePasswordHref && changePasswordLabel) {
    items.push({
      key: 'change-password',
      label: changePasswordLabel,
      // TODO(IA-9): navigate to `changePasswordHref` once /profile/password ships.
      onSelect: () => {
        window.location.assign(changePasswordHref);
      },
    });
  }

  if (items.length > 0) {
    items.push({ key: 'divider', divider: true });
  }

  items.push({
    key: 'sign-out',
    label: signOutLabel,
    onSelect: onSignOut,
  });

  return <Dropdown align="end" trigger={<span className={styles.trigger}>{label}</span>} items={items} />;
}
