/**
 * useTranslationProtection Hook
 * 
 * Protects specific elements from Google Translate DOM mutations
 * by adding 'notranslate' class dynamically.
 * 
 * USE CASE: Product pages with dynamic content that causes React conflicts
 */

'use client';

import { useEffect } from 'react';

export interface TranslationProtectionOptions {
  /**
   * CSS selectors to protect from translation
   * Elements matching these selectors will get 'notranslate' class
   */
  selectors?: string[];
  
  /**
   * Whether to protect images (prevent alt text translation)
   */
  protectImages?: boolean;
  
  /**
   * Whether to protect buttons (prevent button text translation)
   */
  protectButtons?: boolean;
  
  /**
   * Whether to protect inputs (prevent placeholder translation)
   */
  protectInputs?: boolean;
  
  /**
   * Custom data attributes to protect
   */
  protectDataAttributes?: string[];
}

const DEFAULT_OPTIONS: TranslationProtectionOptions = {
  selectors: [],
  protectImages: false,
  protectButtons: false,
  protectInputs: false,
  protectDataAttributes: [],
};

/**
 * Hook to protect specific elements from Google Translate
 * 
 * @example
 * ```tsx
 * // In a product page component
 * useTranslationProtection({
 *   selectors: ['.product-price', '.product-sku'],
 *   protectImages: true
 * });
 * ```
 */
export function useTranslationProtection(
  options: TranslationProtectionOptions = DEFAULT_OPTIONS
) {
  useEffect(() => {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    /**
     * Add 'notranslate' class to elements
     */
    const protectElements = () => {
      try {
        // Protect custom selectors
        if (mergedOptions.selectors && mergedOptions.selectors.length > 0) {
          mergedOptions.selectors.forEach((selector) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
              if (!el.classList.contains('notranslate')) {
                el.classList.add('notranslate');
                console.log(`[Translation Protection] Protected element: ${selector}`);
              }
            });
          });
        }
        
        // Protect images
        if (mergedOptions.protectImages) {
          const images = document.querySelectorAll('img');
          images.forEach((img) => {
            if (!img.classList.contains('notranslate')) {
              img.classList.add('notranslate');
            }
          });
        }
        
        // Protect buttons
        if (mergedOptions.protectButtons) {
          const buttons = document.querySelectorAll('button');
          buttons.forEach((btn) => {
            if (!btn.classList.contains('notranslate')) {
              btn.classList.add('notranslate');
            }
          });
        }
        
        // Protect inputs
        if (mergedOptions.protectInputs) {
          const inputs = document.querySelectorAll('input, textarea');
          inputs.forEach((input) => {
            if (!input.classList.contains('notranslate')) {
              input.classList.add('notranslate');
            }
          });
        }
        
        // Protect data attributes
        if (mergedOptions.protectDataAttributes && mergedOptions.protectDataAttributes.length > 0) {
          mergedOptions.protectDataAttributes.forEach((attr) => {
            const elements = document.querySelectorAll(`[${attr}]`);
            elements.forEach((el) => {
              if (!el.classList.contains('notranslate')) {
                el.classList.add('notranslate');
              }
            });
          });
        }
      } catch (error) {
        console.warn('[Translation Protection] Failed to protect elements:', error);
      }
    };
    
    // Initial protection
    protectElements();
    
    // Re-protect after a delay (in case of dynamic content)
    const timeoutId = setTimeout(protectElements, 1000);
    
    // Set up MutationObserver to protect dynamically added elements
    const observer = new MutationObserver(() => {
      protectElements();
    });
    
    // Observe DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [options]);
}

/**
 * Quick protection presets for common use cases
 */
export const TranslationProtectionPresets = {
  /**
   * Product page protection
   * Protects prices, SKUs, and product identifiers
   */
  productPage: {
    selectors: [
      '[data-testid*="price"]',
      '[data-testid*="sku"]',
      '[data-testid*="product-id"]',
      '.price',
      '.sku',
      '.product-code',
    ],
    protectImages: true,
  },
  
  /**
   * Form protection
   * Protects form inputs and buttons
   */
  forms: {
    protectInputs: true,
    protectButtons: true,
  },
  
  /**
   * Dashboard protection
   * Protects data tables and metrics
   */
  dashboard: {
    selectors: [
      '[data-testid*="metric"]',
      '[data-testid*="stat"]',
      '.metric',
      '.statistic',
      'table',
    ],
  },
} as const;
