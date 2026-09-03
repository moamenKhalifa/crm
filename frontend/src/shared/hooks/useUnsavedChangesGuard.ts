import { useContext, useEffect } from 'react';
import { UNSAFE_DataRouterContext as DataRouterContext, useBlocker } from 'react-router-dom';

import { useT } from '@shared/i18n';

/**
 * Warns before a dirty form's changes are discarded (AC15) — a `beforeunload`
 * prompt for a full page close/reload, plus a client-side navigation prompt
 * via `react-router`'s blocker.
 */
export function useUnsavedChangesGuard(isDirty: boolean, message?: string): void {
  const { t } = useT();
  const resolvedMessage = message ?? t('forms.unsavedChanges.confirm');

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // `useBlocker` throws outside a data router (`createBrowserRouter` +
  // `RouterProvider` — what the app actually uses; tests that mount a page
  // inside a plain `<MemoryRouter>` do not provide one). Router topology is
  // fixed for the app's lifetime, so this conditional never flips between
  // renders of a given mounted instance — it's safe despite looking
  // conditional to the static rule.
  const hasDataRouter = useContext(DataRouterContext) != null;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- see comment above
  const blocker = hasDataRouter ? useBlocker(({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname) : null;

  useEffect(() => {
    if (blocker?.state !== 'blocked') {
      return;
    }
    if (window.confirm(resolvedMessage)) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker, resolvedMessage]);
}
