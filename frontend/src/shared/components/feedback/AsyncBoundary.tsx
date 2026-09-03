import type { ReactNode } from 'react';

import { toUserMessage } from '@shared/errors';
import { useT } from '@shared/i18n';
import type { UseApiDataResult } from '@shared/hooks/useApiData';

import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

export interface AsyncBoundaryProps<T> {
  query: UseApiDataResult<T>;
  empty?: ReactNode;
  children(data: T): ReactNode;
}

/** Renders loading/error/empty/data branches for a `useApiData()` result. */
export function AsyncBoundary<T>({ query, empty, children }: AsyncBoundaryProps<T>) {
  const { t } = useT();

  if (query.isLoading) {
    return <LoadingState />;
  }
  if (query.error) {
    return <ErrorState description={toUserMessage(query.error, t)} onRetry={query.reload} />;
  }
  if (empty && (query.data === undefined || (Array.isArray(query.data) && query.data.length === 0))) {
    return <>{empty}</>;
  }
  return <>{children(query.data as T)}</>;
}
