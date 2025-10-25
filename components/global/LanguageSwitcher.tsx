/**
 * Language Switcher Component
 *
 * Provides UI for switching between supported languages.
 * Integrates with Google Translate via utility functions.
 *
 * FEATURES:
 * - Dropdown menu with supported languages
 * - Shows current language
 * - Persists selection via cookie/localStorage
 * - Handles translation failures gracefully
 *
 * USAGE:
 * <LanguageSwitcher />
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TRANSLATION_CONFIG,
  type LanguageCode,
} from "@/lib/translation/config";
import {
  getCurrentLanguage,
  setTranslateLanguage,
} from "@/lib/translation/utils";
import { useEffect, useState } from "react";

// Globe icon component
const GlobeIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    />
  </svg>
);

// Chevron down icon
const ChevronDownIcon = () => (
  <svg
    className="h-3 w-3"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export function LanguageSwitcher() {
  // CLIENT-SIDE ONLY: Prevent SSR hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageCode>(
    TRANSLATION_CONFIG.defaultLanguage as LanguageCode
  );
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get initial language
    const lang = getCurrentLanguage();
    setCurrentLang(lang);

    // KNOWN ISSUE: Google Translate may change language after page load
    // SOLUTION: Poll current language periodically to keep UI in sync
    const syncInterval = setInterval(() => {
      const updatedLang = getCurrentLanguage();
      if (updatedLang !== currentLang) {
        setCurrentLang(updatedLang);
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [currentLang]);

  // Handle language change
  const handleLanguageChange = (langCode: LanguageCode) => {
    if (langCode === currentLang || isChanging) return;

    console.log(`[Language Switcher] Changing language to ${langCode}`);
    setIsChanging(true);

    try {
      // Update language via utility function
      // This handles all the complexity of Google Translate interaction
      setTranslateLanguage(langCode);

      // Update local state immediately for better UX
      setCurrentLang(langCode);
    } catch (error) {
      console.error("[Language Switcher] Failed to change language:", error);

      // FALLBACK: Reset changing state on error
      setIsChanging(false);
    }

    // Reset changing state after a delay
    // This prevents rapid clicking and gives Google Translate time to work
    setTimeout(() => {
      setIsChanging(false);
    }, 1500);
  };

  // Skip rendering during SSR or if feature disabled entirely and not in migration mode
  if (
    !mounted ||
    (!TRANSLATION_CONFIG.enabled && !TRANSLATION_CONFIG.migrationEnabled)
  ) {
    return null;
  }

  // Get current language label
  const currentLanguage = TRANSLATION_CONFIG.languages[currentLang];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2 hover:bg-gray-100 transition-colors"
          aria-label="Select language"
          disabled={isChanging}
        >
          <GlobeIcon />
          <span className="text-sm font-medium">
            {isChanging ? "..." : currentLanguage.label}
          </span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(TRANSLATION_CONFIG.languages).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as LanguageCode)}
            className={`flex items-center justify-between cursor-pointer ${
              currentLang === code ? "bg-gray-100 font-medium" : ""
            }`}
            disabled={isChanging}
          >
            <span>{lang.name}</span>
            {currentLang === code && (
              <svg
                className="h-4 w-4 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
