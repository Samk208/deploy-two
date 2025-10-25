/**
 * Google Translate Component
 *
 * This component implements Google Website Translator with complete DOM isolation
 * to prevent React reconciliation errors.
 *
 * ARCHITECTURE:
 * - Creates isolated container outside React's DOM tree
 * - Loads Google Translate script once globally
 * - Manages translation state via cookies and localStorage
 *
 * KNOWN ISSUES HANDLED:
 * 1. React removeChild errors: Container attached to document.documentElement
 * 2. Script duplication: Global flag prevents multiple loads
 * 3. SSR compatibility: Client-side only with mounted guard
 * 4. Navigation persistence: Cookie-based state restoration
 * 5. Cleanup conflicts: NO DOM cleanup of Google elements
 */

"use client";

// Note: Window types for Google Translate are defined in lib/translation/utils.ts
// to avoid conflicts with the new translation system

import { TRANSLATION_CONFIG } from "@/lib/translation/config";
import {
  getCurrentLanguage,
  initializeTranslation,
} from "@/lib/translation/utils";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

// GLOBAL FLAG: Prevent multiple Google Translate initializations
// This persists across component re-mounts and navigation
let isGoogleTranslateInitialized = false;
let isolatedContainer: HTMLElement | null = null;

export function GoogleTranslate() {
  // CLIENT-SIDE ONLY: Prevent SSR hydration issues
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Skip if not mounted or feature disabled
    if (!mounted || !TRANSLATION_CONFIG.enabled) return;

    // SAFETY CHECK: Only initialize once globally
    if (isGoogleTranslateInitialized) {
      console.log("[Translation] Already initialized, skipping...");
      return;
    }

    /**
     * Create isolated container for Google Translate
     *
     * CRITICAL: Attached to documentElement, NOT document.body
     * This prevents React from trying to manage it during reconciliation
     */
    const createIsolatedContainer = () => {
      // SAFETY: Check if container already exists
      if (isolatedContainer && document.contains(isolatedContainer)) {
        return isolatedContainer;
      }

      const container = document.createElement("div");
      container.id = TRANSLATION_CONFIG.containerId;

      // CRITICAL: Hide completely with multiple CSS strategies
      // Position off-screen, make invisible, disable interactions
      container.style.cssText = `
        position: fixed !important;
        top: -10000px !important;
        left: -10000px !important;
        width: 0px !important;
        height: 0px !important;
        visibility: hidden !important;
        pointer-events: none !important;
        overflow: hidden !important;
        z-index: -9999 !important;
        opacity: 0 !important;
      `;

      // CRITICAL: Attach to documentElement, outside React's scope
      try {
        document.documentElement.appendChild(container);
        isolatedContainer = container;
        console.log("[Translation] Isolated container created");
        return container;
      } catch (error) {
        console.error("[Translation] Failed to create container:", error);
        return null;
      }
    };

    /**
     * Initialize Google Translate Element
     *
     * KNOWN ISSUE: Must wait for google.translate to be available
     * FALLBACK: Retry mechanism with timeout
     */
    const initGoogleTranslate = () => {
      // SAFETY CHECK: Verify Google Translate library is loaded
      if (
        typeof window.google === "undefined" ||
        !window.google?.translate?.TranslateElement
      ) {
        console.warn("[Translation] Google Translate not loaded yet");
        return false;
      }

      const container = createIsolatedContainer();
      if (!container) {
        console.error("[Translation] Failed to create container");
        return false;
      }

      try {
        // Create Google Translate Element
        new (window as any).google.translate.TranslateElement(
          {
            // Supported languages
            pageLanguage: TRANSLATION_CONFIG.defaultLanguage,
            includedLanguages: Object.keys(TRANSLATION_CONFIG.languages).join(
              ","
            ),

            // Layout: SIMPLE hides the UI (we build our own)
            layout: (window as any).google.translate.TranslateElement
              .InlineLayout.SIMPLE,

            // Auto-display: false prevents banner from showing
            autoDisplay: false,

            // Multiple languages: allow switching between all supported languages
            multilanguagePage: true,
          },
          TRANSLATION_CONFIG.containerId
        );

        console.log("[Translation] Google Translate initialized");
        isGoogleTranslateInitialized = true;

        // Restore previously selected language
        initializeTranslation();

        return true;
      } catch (error) {
        console.error(
          "[Translation] Failed to initialize Google Translate:",
          error
        );
        return false;
      }
    };

    // Define global callback for Google Translate script
    // REQUIRED: Google calls this after script loads
    window.googleTranslateElementInit = () => {
      console.log("[Translation] Google callback triggered");

      // KNOWN ISSUE: Sometimes library isn't immediately available
      // FALLBACK: Retry with delays
      let retries = 0;
      const maxRetries = 10;
      const retryDelay = 100;

      const attemptInit = () => {
        const success = initGoogleTranslate();

        if (!success && retries < maxRetries) {
          retries++;
          console.log(`[Translation] Retry ${retries}/${maxRetries}...`);
          setTimeout(attemptInit, retryDelay * retries);
        } else if (!success) {
          console.error(
            "[Translation] Failed to initialize after maximum retries"
          );
        }
      };

      attemptInit();
    };

    // If script is already loaded, trigger initialization
    if (scriptLoaded) {
      window.googleTranslateElementInit?.();
    }

    // CLEANUP STRATEGY: NO DOM manipulation
    // CRITICAL: Never try to remove Google Translate DOM elements
    // This prevents the "removeChild" error completely
    return () => {
      // Only clean up our own listeners, leave Google Translate untouched
      console.log(
        "[Translation] Component unmounting (keeping Google Translate active)"
      );

      // IMPORTANT: Do NOT remove isolatedContainer
      // Browser will clean it up on page unload
    };
  }, [mounted, scriptLoaded]);

  // Hooks must run unconditionally; render guard is applied just before JSX return

  // Re-apply language on route changes (SPA navigation)
  // ENHANCED: MutationObserver + event listeners to catch late-rendered content
  // ROLLBACK: Set NEXT_PUBLIC_TRANSLATION_RACE_FIX=false to disable this strategy
  useEffect(() => {
    if (!isGoogleTranslateInitialized) return;
    const lang = getCurrentLanguage();
    if (!lang || lang === TRANSLATION_CONFIG.defaultLanguage) return;

    // FEATURE FLAG: Enhanced re-apply strategy
    // Set NEXT_PUBLIC_TRANSLATION_RACE_FIX=false to disable and rollback
    const useEnhancedReapply =
      process.env.NEXT_PUBLIC_TRANSLATION_RACE_FIX !== "false";

    // Debounced apply function to prevent excessive calls
    let applyTimeout: NodeJS.Timeout | null = null;
    const debouncedApply = (delay = 50) => {
      if (applyTimeout) clearTimeout(applyTimeout);
      applyTimeout = setTimeout(() => {
        const select = document.querySelector(
          ".goog-te-combo"
        ) as HTMLSelectElement | null;
        if (select) {
          try {
            if (select.value !== lang) select.value = lang;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            if (process.env.NODE_ENV !== "production") {
              console.log("[Translation] Re-applied language:", lang);
            }
          } catch (error) {
            // Silently ignore errors - non-critical
          }
        }
      }, delay);
    };

    // Initial applies (legacy behavior - always active)
    debouncedApply(0);
    debouncedApply(100);
    debouncedApply(300);

    if (!useEnhancedReapply) {
      return () => {
        if (applyTimeout) clearTimeout(applyTimeout);
      };
    }

    // ENHANCED STRATEGY: MutationObserver for late-rendered content
    // This catches content that hydrates after initial route change
    let observer: MutationObserver | null = null;
    let observerTimeout: NodeJS.Timeout | null = null;

    const startObserver = () => {
      // Watch for added nodes in the document body
      observer = new MutationObserver((mutations) => {
        // Only react to added nodes (not attributes or text changes)
        const hasAddedNodes = mutations.some((m) => m.addedNodes.length > 0);
        if (hasAddedNodes) {
          debouncedApply(100);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });

      if (process.env.NODE_ENV !== "production") {
        console.log("[Translation] MutationObserver started");
      }

      // Stop observer after 1.5 seconds (long enough to catch late content)
      observerTimeout = setTimeout(() => {
        if (observer) {
          observer.disconnect();
          observer = null;
          if (process.env.NODE_ENV !== "production") {
            console.log("[Translation] MutationObserver stopped");
          }
        }
      }, 1500);
    };

    // Start observer after a brief delay to let initial content settle
    const observerStartTimeout = setTimeout(startObserver, 50);

    // EVENT LISTENERS: Handle browser navigation edge cases
    // - pageshow: Handles back/forward cache (bfcache) restoration
    // - visibilitychange: Handles tab switching
    // - focus: Handles window focus restoration
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page restored from bfcache
        debouncedApply(100);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        debouncedApply(100);
      }
    };

    const handleFocus = () => {
      debouncedApply(100);
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      if (applyTimeout) clearTimeout(applyTimeout);
      if (observerStartTimeout) clearTimeout(observerStartTimeout);
      if (observerTimeout) clearTimeout(observerTimeout);
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [pathname]);

  // Skip rendering during SSR or when feature disabled
  if (!mounted || !TRANSLATION_CONFIG.enabled) {
    return null;
  }

  return (
    <>
      {/* Load Google Translate Script */}
      <Script
        id="google-translate-script"
        src={`${TRANSLATION_CONFIG.scriptUrl}?cb=${TRANSLATION_CONFIG.callbackName}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("[Translation] Script loaded");
          setScriptLoaded(true);
        }}
        onError={(error) => {
          console.error("[Translation] Script failed to load:", error);
          // FALLBACK: Continue without translation, user can refresh
        }}
      />

      {/* Global CSS to hide Google Translate UI elements */}
      <style jsx global>{`
        /* Hide Google Translate banner frame */
        .goog-te-banner-frame {
          display: none !important;
          position: absolute !important;
          top: -9999px !important;
          visibility: hidden !important;
        }

        /* Hide Google Translate iframe */
        .skiptranslate iframe {
          display: none !important;
          position: absolute !important;
          top: -9999px !important;
          visibility: hidden !important;
        }

        /* Hide Google Translate gadget */
        .goog-te-gadget {
          display: none !important;
          position: absolute !important;
          top: -9999px !important;
          visibility: hidden !important;
        }

        /* Hide our isolated container */
        #${TRANSLATION_CONFIG.containerId} {
          position: fixed !important;
          top: -10000px !important;
          left: -10000px !important;
          width: 0 !important;
          height: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          overflow: hidden !important;
          z-index: -9999 !important;
          opacity: 0 !important;
        }

        /* Prevent body top margin that Google Translate sometimes adds */
        body {
          top: 0 !important;
        }

        /* Hide any floating elements Google Translate might create */
        .goog-te-spinner-pos,
        .goog-te-balloon-frame {
          display: none !important;
        }
      `}</style>
    </>
  );
}
