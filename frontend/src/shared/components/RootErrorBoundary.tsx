import { Component, type ErrorInfo, type ReactNode } from 'react';

import { i18n } from '@shared/i18n';

const SENSITIVE_FIELDS = new Set(['password', 'access_token', 'refresh_token', 'token']);

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrub);
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_FIELDS.has(key.toLowerCase()) ? '[REDACTED]' : scrub(val);
    }
    return result;
  }
  return value;
}

interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
}

export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Never log the raw error/errorInfo — scrub any field that could carry
    // a password or token (e.g. serialized form state bubbling up in props).
    console.error(
      'Unhandled application error:',
      scrub({ message: error.message, stack: error.stack }),
      scrub(errorInfo),
    );
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h1>{i18n.t('errors.unexpected')}</h1>
          <button type="button" onClick={this.handleReload}>
            {i18n.t('states.retry')}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
