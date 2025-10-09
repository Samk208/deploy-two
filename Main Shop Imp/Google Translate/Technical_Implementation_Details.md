# Google Translate - Technical Implementation Details

## Component Architecture

### GoogleTranslate.tsx - Core Implementation

```typescript
Location: components/global/GoogleTranslate.tsx
Key Features:
- Complete DOM isolation using document.documentElement
- Client-side only rendering with mounted state
- Global initialization prevention
- Zero React cleanup policy
- Language persistence via cookies + localStorage
- Auto-sync mechanism every 2 seconds
```

### GoogleTranslateErrorBoundary.tsx - Error Protection

```typescript
Location: components/global/GoogleTranslateErrorBoundary.tsx
Key Features:
- Enhanced DOM conflict detection
- Progressive backoff retry (up to 5 attempts)
- Silent error recovery
- Specific React reconciliation error catching
```

### Header Integration

```typescript
Location: components/layout/header.tsx
Implementation:
<GoogleTranslateErrorBoundary>
  <GoogleTranslate />
</GoogleTranslateErrorBoundary>
```

## Critical Code Patterns

### DOM Isolation Pattern

```typescript
const createIsolatedContainer = () => {
  let container = document.getElementById(
    "google-translate-isolated-container"
  );

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

    const innerDiv = document.createElement("div");
    innerDiv.id = "google_translate_element";
    container.appendChild(innerDiv);

    // Critical: Use documentElement, not body
    document.documentElement.appendChild(container);
  }

  return container;
};
```

### Error Detection Pattern

```typescript
static getDerivedStateFromError(error: Error): State {
  const isDOMConflictError =
    error.message?.includes('removeChild') ||
    error.message?.includes('appendChild') ||
    error.message?.includes('The node to be removed is not a child') ||
    error.stack?.includes('removeChildFromContainer') ||
    error.stack?.includes('commitDeletionEffectsOnFiber') ||
    error.stack?.includes('recursivelyTraverseDeletionEffects');

  if (isDOMConflictError) {
    console.warn('Google Translate DOM conflict intercepted:', error.message);
    return { hasError: true, error, retryCount: 0 };
  }

  throw error; // Re-throw non-Google Translate errors
}
```

### Language Control API

```typescript
// Set language programmatically
window.setTranslateLanguage = (lang: "en" | "ko" | "zh-CN") => {
  if (lang === "en") {
    // Clear translation cookies and reload
    document.cookie =
      "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("preferred_lang");
    window.location.reload();
    return;
  }

  const cookieValue = `/auto/${lang}`;
  document.cookie = `googtrans=${cookieValue};path=/;max-age=${60 * 60 * 24 * 365}`;
  localStorage.setItem("preferred_lang", lang);

  // Update Google Translate select element
  setTimeout(() => {
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select && select.value !== lang) {
      select.value = lang;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, 100);
};

// Get current language
window.getTranslateLanguage = (): "auto" | "en" | "ko" | "zh-CN" => {
  const match = document.cookie.match(/(?:^|; )googtrans=([^;]+)/);
  if (!match) return "en";
  const parts = decodeURIComponent(match[1]).split("/");
  const code = parts[2];
  return code === "en" || code === "ko" || code === "zh-CN" ? code : "en";
};
```

## CSS Hide Rules

```css
/* Complete hiding of Google Translate UI elements */
.goog-te-banner-frame.skiptranslate,
.goog-te-banner-frame {
  display: none !important;
  height: 0 !important;
  visibility: hidden !important;
  position: absolute !important;
  top: -9999px !important;
}

body {
  top: 0px !important;
  position: relative !important;
}

.skiptranslate iframe {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  position: absolute !important;
  top: -9999px !important;
}

.goog-te-gadget,
.goog-logo-link,
.goog-te-balloon-frame,
#goog-gt-tt,
.goog-tooltip {
  display: none !important;
  position: absolute !important;
  top: -9999px !important;
}

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
```

## Environment Setup

### Development

```bash
# Start development server
npm run dev

# Server typically runs on:
# http://localhost:3003 (auto-detected port)
```

### Dependencies

```json
{
  "next": "15.2.4",
  "react": "18.3.1",
  "react-dom": "18.3.1"
}
```

### Script Loading

```typescript
// Google Translate script loaded via Next.js Script component
<Script
  src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
  strategy="afterInteractive"
  onError={(e) => {
    console.error("Failed to load Google Translate script:", e);
  }}
/>
```

## Deployment Notes

### Production Considerations

1. **CDN**: Google Translate script loads from Google's CDN
2. **CSP**: Ensure Content Security Policy allows Google domains
3. **HTTPS**: Google Translate requires HTTPS in production
4. **Cookies**: Ensure cookie settings work across domains

### Build Process

```bash
# Production build
npm run build
npm start
```

## Monitoring & Analytics

### Console Logging

- Error boundary catches and logs DOM conflicts
- Development mode shows detailed error information
- Production mode uses minimal logging

### Performance Monitoring

- Google Translate script loads asynchronously
- No impact on initial page load
- Minimal memory footprint due to isolation

## Security Considerations

### CSP Headers

```
script-src 'self' https://translate.google.com https://translate.googleapis.com;
frame-src https://translate.google.com;
```

### Cookie Policy

- Google Translate uses functional cookies only
- No personal data stored in translation preferences
- Language preference stored in localStorage as fallback

---

**Implementation Date**: January 2025  
**Last Tested**: All functionality verified  
**Browser Support**: Chrome, Firefox, Safari, Edge  
**Mobile Support**: Full responsive support
