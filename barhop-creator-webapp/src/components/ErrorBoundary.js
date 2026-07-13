import React from 'react';
import { FaceFrownIcon } from '@heroicons/react/24/outline';
import { buttonClasses } from './ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // You can log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface px-4 text-content">
          <div className="w-full max-w-lg rounded-2xl border border-edge bg-surface-raised p-10 text-center shadow-card">
            <FaceFrownIcon
              className="mx-auto mb-4 h-12 w-12 text-danger"
              aria-hidden="true"
            />
            <h1 className="mb-2 font-display text-2xl font-bold text-content">
              Oops! Something went wrong
            </h1>
            <p className="mb-6 text-content-muted">
              We are sorry, but something unexpected happened. Do not worry,
              your data is safe.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 rounded-lg border border-edge bg-surface p-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-content-muted">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-danger">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex justify-center gap-4">
              <button
                className={buttonClasses('primary')}
                onClick={this.handleReset}
              >
                Go to Dashboard
              </button>
              <button
                className={buttonClasses('secondary')}
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
