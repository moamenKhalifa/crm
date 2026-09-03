import { Component, type ErrorInfo, type ReactNode } from 'react';

import { redactForTelemetry } from '@shared/errors/redact';
import { i18n } from '@shared/i18n';

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
      redactForTelemetry({ message: error.message, stack: error.stack }),
      redactForTelemetry(errorInfo),
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
