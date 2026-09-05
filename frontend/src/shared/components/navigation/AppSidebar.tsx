import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { NavLink } from 'react-router-dom';

import { useAuthorization } from '@shared/authorization';
import { useT } from '@shared/i18n';
import { useBreakpoint } from '@shared/theme';

import styles from './AppSidebar.module.css';

export interface AppSidebarItem {
  key: string;
  label: string;
  icon: ReactNode;
  to: string;
  permission?: string;
  role?: string;
}

export interface AppSidebarGroup {
  key: string;
  label: string;
  items: AppSidebarItem[];
}

export interface AppSidebarProps {
  id?: string;
  /** Preferred shape from Story 14. */
  groups?: AppSidebarGroup[];
  /** Legacy shape — wrapped as a single unlabelled group for back-compat. */
  items?: AppSidebarItem[];
  /** Mobile/tablet-drawer control — owned by the parent so `☰` can live in the header. */
  isDrawerOpen?: boolean;
  onDrawerClose?: () => void;
  toggleButtonRef?: RefObject<HTMLButtonElement>;
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

interface GroupsProps {
  groups: AppSidebarGroup[];
  collapsed: boolean;
  navLabel: string;
}

function SidebarGroups({ groups, collapsed, navLabel }: GroupsProps) {
  return (
    <nav aria-label={navLabel} className={styles.nav}>
      {groups.map((group) => (
        <div key={group.key} className={styles.group}>
          {group.label && <h2 className={styles.groupLabel}>{group.label}</h2>}
          <ul className={styles.list}>
            {group.items.map((item) => (
              <li key={item.key}>
                <NavLink
                  to={item.to}
                  // `NavLink` already sets `aria-current="page"` on the active
                  // link itself (react-router built-in) — not duplicated here.
                  className={({ isActive }) => cx(styles.link, isActive && styles.linkActive)}
                  title={collapsed ? item.label : undefined}
                >
                  <span aria-hidden="true" className={styles.icon}>
                    {item.icon}
                  </span>
                  {/* When collapsed, this text is the sole accessible-name
                      source (clipped visually, shown on hover/focus via CSS) —
                      not a second, `aria-hidden` duplicate of a separately
                      "visible" label, which would double up the announced
                      name (see `Button.tsx`'s `disabledReason` fix). */}
                  <span role={collapsed ? 'tooltip' : undefined} className={collapsed ? styles.tooltip : undefined}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function normalizeGroups(groups: AppSidebarGroup[] | undefined, items: AppSidebarItem[] | undefined): AppSidebarGroup[] {
  if (groups) {
    return groups;
  }
  if (items) {
    return [{ key: '__legacy', label: '', items }];
  }
  return [];
}

/** Filters items/groups via `useAuthorization()` and renders as a collapsible aside (`≥ desktop`) or a focus-trapped drawer (`< desktop`). */
export function AppSidebar({ id, groups, items, isDrawerOpen = false, onDrawerClose, toggleButtonRef }: AppSidebarProps) {
  const { hasRole, hasPermission } = useAuthorization();
  const { t } = useT();
  const [collapsed, setCollapsed] = useState(false);
  const breakpoint = useBreakpoint();
  const isDrawerMode = breakpoint === 'mobile' || breakpoint === 'tablet';
  const containerRef = useRef<HTMLElement>(null);

  const filteredGroups = normalizeGroups(groups, items)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.role && !hasRole(item.role)) {
          return false;
        }
        if (item.permission && !hasPermission(item.permission)) {
          return false;
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  // Focus trap for the drawer variant — mirrors `Modal.tsx`'s idiom.
  useEffect(() => {
    if (!isDrawerMode || !isDrawerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDrawerClose?.();
        return;
      }
      if (event.key === 'Tab') {
        const focusable = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (!focusable || focusable.length === 0) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // AC6 — return focus to `☰`, unless the viewport changed to desktop
      // while the drawer was open (the toggle button is now unmounted).
      // Deliberately reads `.current` at cleanup time, not captured at
      // effect-setup time — the whole point of `isConnected` here is to
      // check whether the button is *still* mounted *now*, at close time.
      if (toggleButtonRef?.current?.isConnected) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        toggleButtonRef.current.focus();
      }
    };
  }, [isDrawerMode, isDrawerOpen, onDrawerClose, toggleButtonRef]);

  if (filteredGroups.length === 0) {
    return null;
  }

  const navLabel = t('nav.sidebar.label');

  if (isDrawerMode) {
    if (!isDrawerOpen) {
      return null;
    }
    return (
      <div className={styles.drawerBackdrop} onMouseDown={onDrawerClose}>
        <aside
          id={id}
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.sidebar.drawerTitle')}
          className={styles.drawer}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <SidebarGroups groups={filteredGroups} collapsed={false} navLabel={navLabel} />
        </aside>
      </div>
    );
  }

  return (
    <aside id={id} ref={containerRef} className={styles.sidebar} data-collapsed={collapsed || undefined}>
      <button
        type="button"
        className={styles.collapseButton}
        onClick={() => setCollapsed((value) => !value)}
        aria-label={t('nav.sidebar.collapse')}
      >
        ☰
      </button>
      <SidebarGroups groups={filteredGroups} collapsed={collapsed} navLabel={navLabel} />
    </aside>
  );
}
