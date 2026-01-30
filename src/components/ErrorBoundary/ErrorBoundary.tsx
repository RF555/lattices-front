import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 7v5M12 16v.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            We encountered an unexpected error. Please try again or contact
            support if the problem persists.
          </p>
          <div className="flex gap-3">
            <Button onClick={this.handleRetry}>Try Again</Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-6 p-4 bg-gray-100 rounded-md text-xs text-red-600 max-w-full overflow-auto">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
