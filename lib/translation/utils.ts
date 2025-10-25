/**
 * Translation Utility Functions
 * 
 * These utilities handle language switching, persistence, and state management
 * for Google Translate. All functions include safety checks and fallbacks.
 */

import { TRANSLATION_CONFIG, type LanguageCode } from './config';

/**
 * SAFETY CHECK: Ensure we're in browser environment
 * Prevents SSR errors
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Set a cookie with proper encoding and path
 * FALLBACK: Silently fails if cookies are disabled
 */
function setCookie(name: string, value: string, days = 365): void {
  if (!isBrowser) return;
  
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    // Set cookie with path=/ to work across all routes
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`;
  } catch (error) {
    console.warn('[Translation] Failed to set cookie:', error);
    // FALLBACK: Continue without cookie persistence
  }
}

/**
 * Get a cookie value by name
 * FALLBACK: Returns null if not found or cookies disabled
 */
function getCookie(name: string): string | null {
  if (!isBrowser) return null;
  
  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
  } catch (error) {
    console.warn('[Translation] Failed to read cookie:', error);
  }
  
  return null;
}

/**
 * Get current language from cookie or localStorage
 * FALLBACK: Returns default language if no preference found
 * 
 * Cookie format: /auto/ko or /en/ko
 * We extract the target language (second part)
 */
export function getCurrentLanguage(): LanguageCode {
  if (!isBrowser) return TRANSLATION_CONFIG.defaultLanguage as LanguageCode;
  
  try {
    // Try localStorage first (more reliable)
    const stored = localStorage.getItem(TRANSLATION_CONFIG.storageKey);
    if (stored && isValidLanguage(stored)) {
      return stored as LanguageCode;
    }
    
    // Fall back to cookie
    const cookie = getCookie(TRANSLATION_CONFIG.cookieName);
    if (cookie) {
      // Cookie format: /auto/ko or /en/ko
      const parts = cookie.split('/');
      const targetLang = parts[2] || parts[1];
      if (targetLang && isValidLanguage(targetLang)) {
        return targetLang as LanguageCode;
      }
    }
  } catch (error) {
    console.warn('[Translation] Failed to get current language:', error);
  }
  
  // FALLBACK: Return default language
  return TRANSLATION_CONFIG.defaultLanguage as LanguageCode;
}

/**
 * Check if a language code is valid
 * SAFETY CHECK: Prevents invalid language codes from breaking translation
 */
export function isValidLanguage(code: string): boolean {
  return code in TRANSLATION_CONFIG.languages;
}

/**
 * Set the translation language
 * This updates both cookie and localStorage, then triggers Google Translate
 * 
 * KNOWN ISSUE HANDLING:
 * - Checks if Google Translate is initialized before calling
 * - Falls back to page reload if direct switching fails
 * - Persists choice even if Google Translate fails to load
 */
export function setTranslateLanguage(langCode: LanguageCode): void {
  // Allow switching in both legacy widget mode and migration (API) mode
  if (!isBrowser) return;
  
  // SAFETY CHECK: Validate language code
  if (!isValidLanguage(langCode)) {
    console.warn(`[Translation] Invalid language code: ${langCode}`);
    return;
  }
  
  try {
    // Store preference for API-based translation
    localStorage.setItem(TRANSLATION_CONFIG.storageKey, langCode);
    
    // Set cookie to maintain compatibility and persistence across reloads
    // Format: /auto/ko (auto-detect source, translate to target)
    setCookie(TRANSLATION_CONFIG.cookieName, `/auto/${langCode}`);
    
    // If legacy Google widget is enabled and available, drive it directly
    if (TRANSLATION_CONFIG.enabled && window.google?.translate) {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select && select.parentNode && select.isConnected) {
        select.value = langCode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
    
    // Otherwise, reload to re-render API-based translated text
    console.log('[Translation] Applying language via reload...');
    window.location.reload();
  } catch (error) {
    console.error('[Translation] Failed to set language:', error);
    // FALLBACK: Try reload as last resort
    try {
      window.location.reload();
    } catch {
      // Ultimate fallback: do nothing, keep current language
    }
  }
}

/**
 * Initialize translation on page load
 * Restores previously selected language from cookie/localStorage
 * 
 * SAFETY: Multiple calls are safe (idempotent)
 */
export function initializeTranslation(): void {
  // Run on client for both legacy and migration modes
  if (!isBrowser) return;
  
  try {
    const currentLang = getCurrentLanguage();
    
    // If not default language, ensure cookie is set for persistence
    if (currentLang !== TRANSLATION_CONFIG.defaultLanguage) {
      setCookie(TRANSLATION_CONFIG.cookieName, `/auto/${currentLang}`);
    }
  } catch (error) {
    console.warn('[Translation] Failed to initialize translation:', error);
    // FALLBACK: Continue without initialization, user can manually select language
  }
}

/**
 * Reset translation to default language
 * Clears all translation state
 */
export function resetTranslation(): void {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(TRANSLATION_CONFIG.storageKey);
    setCookie(TRANSLATION_CONFIG.cookieName, '', -1); // Delete cookie
    window.location.reload();
  } catch (error) {
    console.error('[Translation] Failed to reset translation:', error);
  }
}

/**
 * Type declarations for window object extensions
 * Allows TypeScript to recognize our custom properties
 */
declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (config: any, elementId: string) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}
