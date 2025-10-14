"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
    setTranslateLanguage?: (lang: "en" | "ko" | "zh-CN") => void;
    getTranslateLanguage?: () => "auto" | "en" | "ko" | "zh-CN";
    __googleTranslateInitialized?: boolean;
    __googleTranslateCleanupScheduled?: boolean;
  }
}

export default function GoogleTranslate() {
  const [mounted, setMounted] = useState(false);
  const pathname = typeof window !== "undefined" ? window.location?.pathname || "" : "";
  const appPathname = usePathname() || pathname;

  // Define routes where the widget must be disabled
  const isExcludedRoute = (() => {
    if (!appPathname) return false;
    if (appPathname.startsWith("/api")) return true;
    if (appPathname === "/sign-in" || appPathname === "/sign-out") return true;
    if (appPathname.startsWith("/admin")) return true;
    if (appPathname.startsWith("/checkout")) return true;
    return false;
  })();

  // Ensure component only runs on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isExcludedRoute) return;

    // Single global initialization check
    if (window.__googleTranslateInitialized) return;
    window.__googleTranslateInitialized = true;

    // Create completely isolated container outside React's DOM tree
    const createIsolatedContainer = () => {
      // Check if container already exists
      let container = document.getElementById(
        "google-translate-isolated-container"
      ) as HTMLDivElement;

      if (!container) {
        container = document.createElement("div");
        container.id = "google-translate-isolated-container";
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
        `;

        // Create inner element for Google Translate
        const innerDiv = document.createElement("div");
        innerDiv.id = "google_translate_element";
        container.appendChild(innerDiv);

        // Append directly to document.documentElement to completely avoid React
        document.documentElement.appendChild(container);
      }

      return container;
    };

    // Global initialization with complete DOM isolation
    window.googleTranslateElementInit = () => {
      try {
        createIsolatedContainer();

        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: "en,ko,zh-CN",
              layout:
                window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            "google_translate_element"
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error initializing Google Translate:", error);
        }
      }
    };

    const preferredKey = "preferred_lang";

    // Programmatic language change via cookie + select
    const setLang = (lang: "en" | "ko" | "zh-CN") => {
      try {
        // If switching to English, we need to clear the translation
        if (lang === "en") {
          // Clear all Google Translate cookies to reset to original language
          document.cookie =
            "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          const host = window.location.hostname;
          if (host && host.includes(".")) {
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${host}; path=/;`;
          }
          // Clear localStorage preference
          try {
            localStorage.removeItem(preferredKey);
          } catch (e) {
            if (process.env.NODE_ENV !== "production") {
              console.error("Failed to remove localStorage preference:", e);
            }
          }
          // Reload page to show original English content
          window.location.reload();
          return;
        }

        const cookieValue = `/auto/${lang}`;
        // Set for path and domain (domain may be ignored on localhost)
        document.cookie = `googtrans=${cookieValue};path=/;max-age=${60 * 60 * 24 * 365}`;
        const host = window.location.hostname;
        if (host && host.includes(".")) {
          document.cookie = `googtrans=${cookieValue};domain=.${host};path=/;max-age=${60 * 60 * 24 * 365}`;
        }

        // Persist user preference so we can re-apply if Google banner is closed/reset
        try {
          localStorage.setItem(preferredKey, lang);
        } catch (e) {
          if (process.env.NODE_ENV !== "production") {
            console.error("Failed to set localStorage preference:", e);
          }
        }

        // Update the hidden select, if present - with enhanced safety
        setTimeout(() => {
          try {
            const select =
              document.querySelector<HTMLSelectElement>(".goog-te-combo");
            if (select && select.parentNode && select.isConnected) {
              const value = lang;
              if (select.value !== value) {
                select.value = value;
                const event = new Event("change", { bubbles: true });
                select.dispatchEvent(event);
              }
            } else {
              // If not yet present, force a reload to let GT read the cookie
              window.location.reload();
            }
          } catch (e) {
            if (process.env.NODE_ENV !== "production") {
              console.warn("Error updating Google Translate select:", e);
            }
            // Fallback to reload if DOM manipulation fails
            window.location.reload();
          }
        }, 100);
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error in setTranslateLanguage:", e);
        }
      }
    };

    const getLang = (): "auto" | "en" | "ko" | "zh-CN" => {
      const m = document.cookie.match(/(?:^|; )googtrans=([^;]+)/);
      if (!m) return "en"; // Default to English if no cookie
      const val = decodeURIComponent(m[1]); // e.g., /auto/ko
      const parts = val.split("/");
      const code = parts[2];
      if (code === "en" || code === "ko" || code === "zh-CN")
        return code as "en" | "ko" | "zh-CN";
      // If no valid language code or cookie is being cleared, return English
      return "en";
    };

    window.setTranslateLanguage = setLang;
    window.getTranslateLanguage = getLang;

    // Re-apply preferred language if Google banner was closed and cookie cleared/reset
    const syncInterval = window.setInterval(() => {
      try {
        const preferred = localStorage.getItem(preferredKey) as
          | "en"
          | "ko"
          | "zh-CN"
          | null;
        if (!preferred) return;
        const current = getLang();
        if (current !== preferred) {
          setLang(preferred);
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error in sync interval:", e);
        }
      }
    }, 2000);

    // Also re-apply when tab becomes visible again
    const onVis = () => {
      try {
        const preferred = localStorage.getItem(preferredKey) as
          | "en"
          | "ko"
          | "zh-CN"
          | null;
        if (preferred && getLang() !== preferred) setLang(preferred);
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Error in visibility change handler:", e);
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);

    // NO CLEANUP - Let Google Translate persist globally
    // This prevents React DOM conflicts during unmounting
    // The isolated container will be cleaned up by browser on page unload
    return () => {
      // Only clean up our own listeners, leave Google Translate untouched
      try {
        window.clearInterval(syncInterval);
      } catch (e) {
        // Silent fail
      }

      try {
        document.removeEventListener("visibilitychange", onVis);
      } catch (e) {
        // Silent fail
      }

      // DO NOT clean up the Google Translate DOM elements
      // This prevents the "removeChild" error entirely
    };
  }, [mounted]);

  // Don't render anything during SSR
  if (!mounted || isExcludedRoute) {
    return null;
  }

  return (
    <>
      {/* Minimal placeholder - Google Translate is isolated outside React */}
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
        onError={(e) => {
          if (process.env.NODE_ENV !== "production") {
            console.error("Failed to load Google Translate script:", e);
          }
        }}
      />
      <style jsx global>{`
        /* Enhanced hiding rules for Google Translate UI */
        .goog-te-banner-frame.skiptranslate,
        .goog-te-banner-frame {
          display: none !important;
          height: 0 !important;
          visibility: hidden !important;
          position: absolute !important;
          top: -9999px !important;
        }

        /* Reset body position that Google Translate adds */
        body {
          top: 0px !important;
          position: relative !important;
        }

        /* Hide the iframe at the top */
        .skiptranslate iframe {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          position: absolute !important;
          top: -9999px !important;
        }

        /* Keep the translation but hide the frame */
        .skiptranslate:not(.goog-te-gadget):not(#google_translate_element) {
          display: none !important;
          position: absolute !important;
          top: -9999px !important;
        }

        /* Hide the default Google dropdown and branding completely */
        .goog-te-gadget {
          display: none !important;
          position: absolute !important;
          top: -9999px !important;
        }
        .goog-logo-link {
          display: none !important;
          position: absolute !important;
          top: -9999px !important;
        }
        .goog-te-balloon-frame {
          display: none !important;
          position: absolute !important;
          top: -9999px !important;
        }
        #goog-gt-tt {
          display: none !important;
          visibility: hidden !important;
          position: absolute !important;
          top: -9999px !important;
        }
        .goog-tooltip {
          display: none !important;
          position: absolute !important;
          top: -9999px !important;
        }
        .goog-tooltip:hover {
          display: none !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }

        /* Hide isolated container completely */
        #google-translate-isolated-container {
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
        }

        /* Ensure Google Translate elements inside container are also hidden */
        #google-translate-isolated-container * {
          position: absolute !important;
          top: -10000px !important;
          left: -10000px !important;
          width: 0px !important;
          height: 0px !important;
          visibility: hidden !important;
          pointer-events: none !important;
          overflow: hidden !important;
          z-index: -9999 !important;
          opacity: 0 !important;
        }
      `}</style>
    </>
  );
}
