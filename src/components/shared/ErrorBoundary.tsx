/**
 * LoanMate — Error Boundary
 * Catches unexpected React render errors and shows a recovery screen.
 */
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[LoanMate ErrorBoundary]", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Hard reload as last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col h-full bg-white items-center justify-center px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            An unexpected error occurred. Your data is safe — please restart the app.
          </p>
          {this.state.error && (
            <p className="text-gray-300 text-xs mb-6 font-mono bg-gray-50 px-3 py-2 rounded-xl max-w-full overflow-hidden text-ellipsis">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-[#1B2E4B] text-white font-semibold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-[#1B2E4B]/20"
          >
            Restart App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
