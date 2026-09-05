import type { ReactNode } from 'react';

import { isApiError } from '@shared/api';
import { toUserMessage } from '@shared/errors';
import { useT } from '@shared/i18n';
import type { UseApiDataResult } from '@shared/hooks/useApiData';

import { ErrorState } from './ErrorState';
import { LoadingBoundary } from './LoadingBoundary';
import { LoadingState } from './LoadingState';

export interface AsyncBoundaryProps<T> {
  query: UseApiDataResult<T>;
  empty?: ReactNode;
  children(data: T): ReactNode;
}

/**
 * Renders loading/error/empty/data branches for a `useApiData()` result.
 * Loading is wrapped in `LoadingBoundary` so a fetch that resolves almost
 * instantly never flashes the spinner for a single frame (AC10).
 */
export function AsyncBoundary<T>({ query, empty, children }: AsyncBoundaryProps<T>) {
  const { t } = useT();

  const isEmpty = empty && (query.data === undefined || (Array.isArray(query.data) && query.data.length === 0));

  // Only evaluate the render-prop branches while not loading: `children` may
  // assume `query.data` is defined, and calling it eagerly during the
  // loading phase (data still `undefined`) would crash — even though
  // `LoadingBoundary` below wouldn't actually display the result.
  let content: ReactNode = null;
  if (!query.isLoading) {
    if (query.error) {
      content = (
        <ErrorState
          description={toUserMessage(query.error, t)}
          onRetry={query.reload}
          // A real ApiError always carries the *concept* of a correlation id
          // (even if the specific response happened to omit one) — pass '' so
          // `ErrorState` renders its "(no reference)" fallback rather than
          // hiding the line entirely. A plain non-API `Error` never had one,
          // so no reference line is rendered at all in that case.
          correlationId={isApiError(query.error) ? (query.error.correlationId ?? '') : undefined}
        />
      );
    } else if (isEmpty) {
      content = <>{empty}</>;
    } else {
      content = <>{children(query.data as T)}</>;
    }
  }

  return (
    <LoadingBoundary loading={query.isLoading} fallback={<LoadingState />}>
      {content}
    </LoadingBoundary>
  );
}
