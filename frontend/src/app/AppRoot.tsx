import { Suspense } from 'react';

import { AppLoading } from '@shared/components/AppLoading';
import { RootErrorBoundary } from '@shared/components/RootErrorBoundary';

import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './routing/AppRouter';

export function AppRoot() {
  return (
    <RootErrorBoundary>
      <AppProviders>
        <Suspense fallback={<AppLoading />}>
          <AppRouter />
        </Suspense>
      </AppProviders>
    </RootErrorBoundary>
  );
}
