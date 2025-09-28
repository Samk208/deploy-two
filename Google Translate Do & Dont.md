# Google Translate Do & Don’t

This project implements Google Website Translator (client-side) without a traditional i18n library. Use this guide to keep any new work consistent and conflict-free when you build/merge a standalone feature.

## Where It’s Implemented
- **Component**: `components/global/GoogleTranslate.tsx`
  - Injects Google script: `https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit`
  - Initializes `google.translate.TranslateElement` targeting `#google_translate_element`
  - Exposes helpers on `window`: `setTranslateLanguage(lang)` and `getTranslateLanguage()`
  - Persists language via cookie `googtrans` and `localStorage` key `preferred_lang`
  - Hides Google’s default UI with global CSS, keeping only the translation effect.
- **Header**: `components/layout/header.tsx`
  - Renders `<GoogleTranslate />`
  - Shows a custom language menu (EN / KO / 简体)
  - Uses `window.setTranslateLanguage()` and `window.getTranslateLanguage()` for control/state

## Public Contract (match these exactly)
- **Container id**: `google_translate_element`
- **Window helpers**:
  - `window.setTranslateLanguage('en' | 'ko' | 'zh-CN')`
  - `window.getTranslateLanguage(): 'auto' | 'en' | 'ko' | 'zh-CN'`
- **Persistence**:
  - Cookie: `googtrans` (value like `/auto/ko`)
  - LocalStorage: `preferred_lang`
- **Languages enabled**: `en, ko, zh-CN`
- **Header label mapping**: `en -> EN`, `ko -> KO`, `zh-CN -> 简体`

## Do
- **Keep it client-only**: Initialize in `useEffect`. Do not run during SSR.
- **Render the hidden container**: `<div id="google_translate_element" className="sr-only" />`
- **Load the script after interactive** using Next.js `next/script`.
- **Use the provided window helpers** to switch languages and to read the current code.
- **Persist user choice** to `preferred_lang` and sync it with `googtrans` cookie.
- **Hide default Google UI** using the same global CSS rules to avoid duplicate toolbars and iframes.
- **Guard single-instance behavior**: Only one TranslateElement should be present per page.
- **Feature-flag if needed**: e.g., `NEXT_PUBLIC_ENABLE_TRANSLATE` to toggle on/off safely.

## Don’t
- **Don’t change ids or API names**: Keep `google_translate_element`, `setTranslateLanguage`, `getTranslateLanguage` as-is to avoid merge conflicts.
- **Don’t add another i18n framework globally** without a plan; this app currently relies on the Google widget.
- **Don’t mount multiple Translate widgets** or manipulate the DOM outside the defined container.
- **Don’t alter `<html lang>` globally**; SSR content remains in English and translation is applied client-side.
- **Don’t remove the cookie/LS logic**; it’s required for reliable switching and persistence.

## How to add to a standalone project (merge-ready)
1. **Copy `components/global/GoogleTranslate.tsx`** as-is (or replicate its behavior precisely).
2. **Render `<GoogleTranslate />` once** in your layout/header.
3. **Provide a language menu** that:
   - Displays the current label derived from `window.getTranslateLanguage()`
   - Calls `window.setTranslateLanguage('en'|'ko'|'zh-CN')` on selection
4. **Include the same global CSS** to hide Google’s default UI.
5. **Optional**: Gate rendering with `NEXT_PUBLIC_ENABLE_TRANSLATE`.

## Testing Checklist
- **Language flow**: EN → KO → EN and EN → zh-CN → EN correctly updates content and cookies.
- **Persistence**: Refresh keeps the selected language per `preferred_lang` and `googtrans`.
- **Single instance**: Only one TranslateElement mounts; no duplicate Google banners/iframes.
- **Isolation**: With feature flag off, script doesn’t load and no `googtrans` is set.
- **Cross-page**: Navigating between routes preserves language choice.

## Troubleshooting
- **No translation happening**: Ensure `#google_translate_element` exists and script URL includes `?cb=googleTranslateElementInit`.
- **Switch not working**: Verify `.goog-te-combo` exists after initialization; if not, reload after setting `googtrans`.
- **Banner showing**: Ensure the global CSS hide rules are applied.
- **Local dev domain cookie**: On `localhost`, domain cookie may be ignored; path cookie still works.

## Security & Compliance Notes
- **PII/Sensitive UI**: Add `class="notranslate"` to elements you don’t want translated.
- **CSP**: If you enforce CSP, allow `https://translate.google.com` for scripts.
- **No keys**: Website Translator requires no API key, but still avoid exposing other secrets.

## File References
- `components/global/GoogleTranslate.tsx`
- `components/layout/header.tsx`
