/**
 * Google Translate Error Boundary
 * 
 * This error boundary specifically catches and recovers from DOM conflicts
 * between React and Google Translate.
 * 
 * ARCHITECTURE:
 * - Catches React reconciliation errors caused by Google Translate DOM mutations
 * - Auto-recovers with exponential backoff
 * - Re-throws non-Google Translate errors for proper error handling
 * - Silent in production to prevent user disruption
 * 
 * ERROR DETECTION:
 * Identifies Google Translate errors by checking for:
 * - "removeChild" in error message
 * - "appendChild" in error message
 * - React fiber reconciliation in stack trace
 * - Google Translate related keywords
 */

'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class GoogleTranslateErrorBoundary extends Component<Props, State> {
  private readonly maxRetries = 5;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      retryCount: 0,
    };
  }

  /**
   * Detect if error is caused by Google Translate DOM manipulation
   * 
   * KNOWN PATTERNS:
   * - "removeChild" / "appendChild" in message
   * - React reconciliation in stack trace
   * - "The node to be removed is not a child"
   */
  static isGoogleTranslateError(error: Error): boolean {
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';

    // Check error message for DOM manipulation keywords
    const hasDOMError =
      message.includes('removechild') ||
      message.includes('appendchild') ||
      message.includes('insertbefore') ||
      message.includes('the node to be removed is not a child');

    // Check stack trace for React reconciliation
    const hasReactReconciliation =
      stack.includes('removechildfromcontainer') ||
      stack.includes('commitdeletioneffectsonfiber') ||
      stack.includes('recursivelytraversedeletioneffects') ||
      stack.includes('commitdeletion');

    // Check for Google Translate related keywords
    const hasGoogleKeywords =
      stack.includes('google') ||
      stack.includes('translate') ||
      stack.includes('goog-te') ||
      message.includes('google') ||
      message.includes('translate');

    return (hasDOMError && hasReactReconciliation) || hasGoogleKeywords;
  }

  static getDerivedStateFromError(error: Error): State | null {
    // Only catch Google Translate related errors
    if (GoogleTranslateErrorBoundary.isGoogleTranslateError(error)) {
      console.warn('[Translation Error Boundary] Caught Google Translate DOM conflict:', error.message);
      
      // CRITICAL: Suppress the error in production to prevent user disruption
      if (process.env.NODE_ENV === 'production') {
        // Silent recovery in production
        return {
          hasError: false,
          error: undefined,
          retryCount: 0,
        };
      }
      
      return {
        hasError: true,
        error,
        retryCount: 0,
      };
    }

    // Re-throw other errors to maintain proper error handling
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only handle Google Translate errors
    if (!GoogleTranslateErrorBoundary.isGoogleTranslateError(error)) {
      throw error;
    }

    console.error('[Translation Error Boundary] Error details:', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });

    // In production, silently recover immediately
    if (process.env.NODE_ENV === 'production') {
      this.setState({
        hasError: false,
        error: undefined,
        retryCount: 0,
      });
      return;
    }

    // In development, attempt auto-recovery
    this.attemptRecovery();
  }

  /**
   * Attempt automatic recovery from error
   * 
   * STRATEGY:
   * - Progressive backoff: delay increases with each retry
   * - Maximum retries: prevents infinite loops
   * - Silent recovery: no user notification unless max retries reached
   */
  private attemptRecovery = () => {
    const { retryCount } = this.state;

    if (retryCount < this.maxRetries) {
      // Calculate delay with exponential backoff
      // Retry 1: 500ms, Retry 2: 1000ms, Retry 3: 1500ms, etc.
      const delay = 500 * (retryCount + 1);

      console.log(
        `[Translation Error Boundary] Attempting recovery ${retryCount + 1}/${this.maxRetries} in ${delay}ms...`
      );

      // Clear any existing retry timeout
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }

      // Schedule recovery attempt
      this.retryTimeout = setTimeout(() => {
        this.setState((prevState) => ({
          hasError: false,
          error: undefined,
          retryCount: prevState.retryCount + 1,
        }));
      }, delay);
    } else {
      console.error(
        '[Translation Error Boundary] Maximum retries reached. Manual intervention required.'
      );
    }
  };

  /**
   * Manual recovery trigger
   * Resets error state and retry count
   */
  private handleRetry = () => {
    console.log('[Translation Error Boundary] Manual retry triggered');
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: 0,
    });
  };

  /**
   * Reload page as last resort
   * Clears all state including Google Translate
   */
  private handleReload = () => {
    console.log('[Translation Error Boundary] Reloading page...');
    window.location.reload();
  };

  componentWillUnmount() {
    // Clean up retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children } = this.props;

    // If no error or auto-recovery in progress, render children
    if (!hasError || retryCount < this.maxRetries) {
      return children;
    }

    // PRODUCTION: Show minimal error UI only after max retries
    // DEVELOPMENT: Show detailed error information
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment) {
      // Production: Silent recovery (component just doesn't render translation UI)
      console.error('[Translation Error Boundary] Silent error in production');
      return children;
    }

    // Development: Show detailed error UI
    return (
      <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-800">Translation Error</h3>
            <p className="text-sm text-red-700 mt-1">
              {error?.message || 'An error occurred with Google Translate'}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Retried {retryCount} times. Translation features may be unavailable.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={this.handleRetry}
                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors"
              >
                Retry
              </button>
              <button
                onClick={this.handleReload}
                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
