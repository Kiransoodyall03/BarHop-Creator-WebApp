import React from 'react';

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
        <div className="flex min-h-screen items-center justify-center bg-surface-deep px-4 text-gray-100">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface-card p-10 text-center">
            <div className="mb-4 text-6xl">💥</div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Oops! Something went wrong
            </h1>
            <p className="mb-6 text-gray-400">
              We are sorry, but something unexpected happened. Do not worry,
              your data is safe.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 rounded-lg border border-white/10 bg-surface p-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-400">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-red-300">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex justify-center gap-4">
              <button
                className="rounded-lg bg-accent px-5 py-2.5 font-semibold text-black transition hover:bg-accent-dim hover:shadow-glow-amber"
                onClick={this.handleReset}
              >
                Go to Dashboard
              </button>
              <button
                className="rounded-lg border border-white/15 px-5 py-2.5 font-semibold text-gray-200 transition hover:border-accent/60 hover:text-accent"
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
