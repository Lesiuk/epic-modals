import React, { Component, type ReactNode, type ErrorInfo } from 'react';

export interface ErrorBoundaryProps {

  children: ReactNode;

  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);

  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      if (fallback !== undefined) {
        if (typeof fallback === 'function') {
          return fallback(this.state.error, this.reset);
        }
        return fallback;
      }

      return (
        <div style={{
          padding: '16px',
          color: '#dc2626',
          backgroundColor: '#fef2f2',
          borderRadius: '4px',
          fontSize: '14px',
        }}>
          <strong>Error:</strong> {this.state.error.message}
          <button
            onClick={this.reset}
            style={{
              marginLeft: '8px',
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
              border: '1px solid #dc2626',
              borderRadius: '4px',
              backgroundColor: 'white',
              color: '#dc2626',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithErrorBoundary;
}
