/**
 * Global Error Handler for Google Translate DOM Conflicts
 * 
 * This script catches uncaught errors at the window level and suppresses
 * Google Translate related DOM conflicts to prevent user disruption.
 * 
 * CRITICAL: This is a last-resort fallback for errors that escape
 * the React error boundary.
 */

'use client';

import { useEffect } from 'react';

export function GlobalErrorHandler() {
  useEffect(() => {
    /**
     * Check if error is Google Translate related
     */
    const isGoogleTranslateError = (error: Error | ErrorEvent): boolean => {
      const message = typeof error === 'object' && 'message' in error 
        ? error.message?.toLowerCase() || '' 
        : '';
      
      const errorStr = error.toString().toLowerCase();
      
      return (
        message.includes('removechild') ||
        message.includes('appendchild') ||
        message.includes('insertbefore') ||
        message.includes('the node to be removed is not a child') ||
        errorStr.includes('removechild') ||
        errorStr.includes('google') ||
        errorStr.includes('translate') ||
        errorStr.includes('goog-te')
      );
    };

    /**
     * Global error event handler
     * Catches errors that escape React error boundaries
     */
    const handleError = (event: ErrorEvent) => {
      if (event.error && isGoogleTranslateError(event.error)) {
        console.warn(
          '[Global Error Handler] Suppressed Google Translate DOM conflict:',
          event.error.message
        );
        
        // Prevent error from showing in console (production only)
        if (process.env.NODE_ENV === 'production') {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      }
      
      return false;
    };

    /**
     * Global unhandled rejection handler
     * Catches promise rejections
     */
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && isGoogleTranslateError(event.reason)) {
        console.warn(
          '[Global Error Handler] Suppressed Google Translate promise rejection:',
          event.reason.message
        );
        
        // Prevent error from showing in console (production only)
        if (process.env.NODE_ENV === 'production') {
          event.preventDefault();
          return true;
        }
      }
      
      return false;
    };

    // Attach global error handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // This component renders nothing
  return null;
}
