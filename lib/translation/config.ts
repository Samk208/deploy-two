/**
 * Google Translate Configuration
 * 
 * This file defines supported languages and translation settings.
 * Modifying this file will not break existing functionality.
 */

export const TRANSLATION_CONFIG = {
  // Feature flag - set to false to completely disable translation
  enabled: process.env.NEXT_PUBLIC_ENABLE_TRANSLATE !== 'false',
  // Migration flag - when true, we use new API but still want UI controls
  migrationEnabled: process.env.NEXT_PUBLIC_TRANSLATION_MIGRATION === 'true',
  
  // Google Translate script URL
  scriptUrl: 'https://translate.google.com/translate_a/element.js',
  
  // Supported languages
  languages: {
    en: { code: 'en', label: 'EN', name: 'English' },
    ko: { code: 'ko', label: 'KO', name: '한국어' },
    'zh-CN': { code: 'zh-CN', label: '简体', name: '简体中文' },
  },
  
  // Default language
  defaultLanguage: 'en',
  
  // Cookie and storage keys
  cookieName: 'googtrans',
  storageKey: 'preferred_lang',
  
  // Container ID for Google Translate element (DO NOT CHANGE - prevents conflicts)
  containerId: 'google-translate-isolated-container',
  
  // Callback function name (DO NOT CHANGE - required by Google)
  callbackName: 'googleTranslateElementInit',
} as const;

export type LanguageCode = keyof typeof TRANSLATION_CONFIG.languages;

export const LANGUAGE_CODES = Object.keys(TRANSLATION_CONFIG.languages) as LanguageCode[];
