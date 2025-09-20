'use client'

import { useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    googleTranslateElementInit: () => void
    google: any
    setTranslateLanguage?: (lang: 'en' | 'ko' | 'zh-CN') => void
    getTranslateLanguage?: () => 'auto' | 'en' | 'ko' | 'zh-CN'
  }
}

export default function GoogleTranslate() {
  useEffect(() => {
    // Define the initialization function
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            // Restrict to English, Korean, Chinese (Simplified & Traditional)
            includedLanguages: 'en,ko,zh-CN',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        )
      }
    }

    const preferredKey = 'preferred_lang'

    // Programmatic language change via cookie + select
    const setLang = (lang: 'en' | 'ko' | 'zh-CN') => {
      try {
        // If switching to English, we need to clear the translation
        if (lang === 'en') {
          // Clear all Google Translate cookies to reset to original language
          document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          const host = window.location.hostname
          if (host && host.includes('.')) {
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${host}; path=/;`
          }
          // Clear localStorage preference
          try { localStorage.removeItem(preferredKey) } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('Failed to remove localStorage preference:', e)
            }
          }
          // Reload page to show original English content
          window.location.reload()
          return
        }
        
        const cookieValue = `/auto/${lang}`
        // Set for path and domain (domain may be ignored on localhost)
        document.cookie = `googtrans=${cookieValue};path=/;max-age=${60 * 60 * 24 * 365}`
        const host = window.location.hostname
        if (host && host.includes('.')) {
          document.cookie = `googtrans=${cookieValue};domain=.${host};path=/;max-age=${60 * 60 * 24 * 365}`
        }

        // Persist user preference so we can re-apply if Google banner is closed/reset
        try { localStorage.setItem(preferredKey, lang) } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to set localStorage preference:', e)
          }
        }

        // Update the hidden select, if present
        const select = document.querySelector<HTMLSelectElement>('.goog-te-combo')
        if (select) {
          // Map our codes to Google's values
          const value = lang
          if (select.value !== value) {
            select.value = value
            select.dispatchEvent(new Event('change'))
          }
        } else {
          // If not yet present, force a reload to let GT read the cookie
          window.location.reload()
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error in setTranslateLanguage:', e)
        }
      }
    }
    const getLang = (): 'auto' | 'en' | 'ko' | 'zh-CN' => {
      const m = document.cookie.match(/(?:^|; )googtrans=([^;]+)/)
      if (!m) return 'en' // Default to English if no cookie
      const val = decodeURIComponent(m[1]) // e.g., /auto/ko
      const parts = val.split('/')
      const code = parts[2]
      if (code === 'en' || code === 'ko' || code === 'zh-CN') return code as 'en' | 'ko' | 'zh-CN'
      // If no valid language code or cookie is being cleared, return English
      return 'en'
    }
    window.setTranslateLanguage = setLang
    window.getTranslateLanguage = getLang

    // Re-apply preferred language if Google banner was closed and cookie cleared/reset
    const syncInterval = window.setInterval(() => {
      try {
        const preferred = (localStorage.getItem(preferredKey) as 'en' | 'ko' | 'zh-CN' | null)
        if (!preferred) return
        const current = getLang()
        if (current !== preferred) {
          setLang(preferred)
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error in sync interval:', e)
        }
      }
    }, 2000)

    // Also re-apply when tab becomes visible again
    const onVis = () => {
      try {
        const preferred = (localStorage.getItem(preferredKey) as 'en' | 'ko' | 'zh-CN' | null)
        if (preferred && getLang() !== preferred) setLang(preferred)
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error in visibility change handler:', e)
        }
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      window.clearInterval(syncInterval)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <>
      {/* Keep widget in DOM for Google, but hide its UI */}
      <div id="google_translate_element" className="sr-only" />
      <Script
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
      <style jsx global>{`
        /* Hide Google Translate toolbar and banner */
        .goog-te-banner-frame.skiptranslate,
        .goog-te-banner-frame {
          display: none !important;
          height: 0 !important;
          visibility: hidden !important;
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
        }
        
        /* Keep the translation but hide the frame */
        .skiptranslate:not(.goog-te-gadget):not(#google_translate_element) {
          display: none !important;
        }
        
        /* Hide the default Google dropdown and branding completely */
        .goog-te-gadget { display: none !important; }
        .goog-logo-link { display: none !important; }
        .goog-te-balloon-frame { display: none !important; }
        #goog-gt-tt { display: none !important; visibility: hidden !important; }
        .goog-tooltip { display: none !important; }
        .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; box-shadow: none !important; }
      `}</style>
    </>
  )
}
