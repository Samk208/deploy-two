"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class GoogleTranslateErrorBoundary extends React.Component<
  Props,
  State
> {
  private maxRetries = 5;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    // Enhanced detection for React DOM conflicts with Google Translate
    const isDOMConflictError =
      error.message?.includes("removeChild") ||
      error.message?.includes("appendChild") ||
      error.message?.includes("The node to be removed is not a child") ||
      error.message?.includes("google") ||
      error.message?.includes("translate") ||
      error.stack?.includes("removeChildFromContainer") ||
      error.stack?.includes("commitDeletionEffectsOnFiber") ||
      error.stack?.includes("commitDeletionEffects") ||
      error.stack?.includes("recursivelyTraverseDeletionEffects");

    if (isDOMConflictError) {
      console.warn("Google Translate DOM conflict intercepted:", error.message);
      return { hasError: true, error, retryCount: 0 };
    }

    // Re-throw non-Google Translate errors to parent boundaries
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Google Translate Error Boundary - DOM conflict details:", {
      error: error.message,
      stack: error.stack?.substring(0, 500),
      componentStack: errorInfo.componentStack?.substring(0, 300),
    });
  }

  componentDidUpdate() {
    // Auto-recovery with progressive backoff
    if (this.state.hasError && this.state.retryCount < this.maxRetries) {
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }

      const delay = Math.min(1000 * Math.pow(1.5, this.state.retryCount), 8000);

      this.retryTimeout = setTimeout(() => {
        console.log(
          `Recovering from Google Translate DOM conflict (attempt ${this.state.retryCount + 1}/${this.maxRetries})`
        );
        this.setState({
          hasError: false,
          error: undefined,
          retryCount: this.state.retryCount + 1,
        });
      }, delay);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Silent recovery mode - don't show error UI
      return (
        <div style={{ display: "none" }}>
          {/* Google Translate DOM conflict - auto-recovering */}
        </div>
      );
    }

    return this.props.children;
  }
}
