import { Component } from 'react';

/**
 * ErrorBoundary — class-based error boundary that catches render and lifecycle
 * errors thrown anywhere in its subtree and renders a fallback instead of
 * unmounting the whole app.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.fallback] Custom fallback rendered
 *   when an error is caught. When omitted, a default panel showing the error
 *   message plus a "Reload" button (`window.location.reload()`) is used.
 * @param {(error: Error, info: { componentStack?: string }) => void} [props.onError]
 *   Optional callback invoked from `componentDidCatch` (e.g. report to an
 *   external monitoring service).
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, info);
    }
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      if (fallback != null) return fallback;
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-bg-surface border border-border rounded-lg shadow-card p-8 text-center">
            <p className="text-sm font-medium text-text mb-1">Something went wrong</p>
            {error != null && (
              <p className="text-xs font-mono text-danger-light break-all mb-4">{error.message}</p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleTryAgain}
                aria-label="Try again without reloading the page"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-black transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                aria-label="Go to home page"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-text transition-colors hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Go to home
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                aria-label="Reload the page"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-text-muted transition-colors hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
