

---

## 📁 Folder structure

```
next-translate-starter-pages-ts/
├── public/
│   └── assets/
│       ├── lang-config.js
│       └── translation.js
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   └── index.tsx
├── components/
│   └── LanguageSwitcher.tsx
├── styles/
│   └── globals.css
├── tsconfig.json
├── package.json
└── next.config.js
```

You’ll also want to install `nookies` (or any cookie library).

---

## 📦 package.json (minimal dependencies)

```json
{
  "name": "next-translate-starter-pages-ts",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "nookies": "^2.5.2"
  },
  "devDependencies": {
    "typescript": "latest",
    "@types/react": "latest",
    "@types/node": "latest"
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "esnext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## next.config.js

```js
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
};
```

---

## public/assets/lang-config.js

```js
window.__GOOGLE_TRANSLATION_CONFIG__ = {
  languages: [
    { title: "English", name: "en" },
    { title: "한국어", name: "ko" },
    { title: "简体中文", name: "zh-CN" },
    { title: "繁體中文", name: "zh-TW" },
  ],
  defaultLanguage: "en"
};
```

---

## public/assets/translation.js

```js
function TranslateInit() {
  if (
    !window.__GOOGLE_TRANSLATION_CONFIG__ ||
    typeof window.google === "undefined" ||
    !window.google.translate ||
    !window.google.translate.TranslateElement
  ) {
    return;
  }

  const config = window.__GOOGLE_TRANSLATION_CONFIG__;
  const { defaultLanguage, languages } = config;
  const langs = languages.map(l => l.name).join(",");

  try {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: defaultLanguage,
        includedLanguages: langs,
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false,
      },
      "google_translate_element"
    );
  } catch (err) {
    console.error("[TranslateInit] failed:", err);
  }
}
```

---

## pages/_document.tsx

```tsx
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <script src="/assets/lang-config.js" defer />
          <script src="/assets/translation.js" defer />
          <script
            src="//translate.google.com/translate_a/element.js?cb=TranslateInit"
            defer
          />
        </Head>
        <body>
          <div id="google_translate_element"></div>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
```

---

## pages/_app.tsx

```tsx
import { AppProps } from "next/app";
import "../styles/globals.css";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <LanguageSwitcher />
      <Component {...pageProps} />
    </>
  );
}
```

---

## pages/index.tsx

```tsx
export default function Home() {
  return (
    <div>
      <h1>Hello, world!</h1>
      <p>This is English by default. Try switching languages.</p>
    </div>
  );
}
```

---

## components/LanguageSwitcher.tsx

```tsx
"use client";
import { useEffect, useState } from "react";
import { parseCookies, setCookie } from "nookies";

interface LangObj {
  title: string;
  name: string;
}

declare global {
  interface Window {
    __GOOGLE_TRANSLATION_CONFIG__?: {
      languages: LangObj[];
      defaultLanguage: string;
    };
  }
}

const COOKIE_NAME = "googtrans";

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState<string | null>(null);
  const [config, setConfig] = useState<LangObj[] | null>(null);

  useEffect(() => {
    if (window.__GOOGLE_TRANSLATION_CONFIG__) {
      setConfig(window.__GOOGLE_TRANSLATION_CONFIG__.languages);
    }
    const cookies = parseCookies();
    const val = cookies[COOKIE_NAME];
    if (val) {
      const parts = val.split("/");
      const lang = parts[parts.length - 1];
      setCurrent(lang);
    } else if (window.__GOOGLE_TRANSLATION_CONFIG__) {
      setCurrent(window.__GOOGLE_TRANSLATION_CONFIG__.defaultLanguage);
    }
  }, []);

  if (!config || current === null) {
    return null;
  }

  const switchLang = (lang: string) => {
    try {
      setCookie(null, COOKIE_NAME, `/auto/${lang}`, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    } catch (err) {
      console.warn("[LangSwitcher] setCookie error:", err);
    }
    window.location.reload();
  };

  return (
    <div className="language-switcher notranslate">
      {config.map((lang) => (
        <button
          key={lang.name}
          disabled={lang.name === current}
          onClick={() => switchLang(lang.name)}
        >
          {lang.title}
        </button>
      ))}
    </div>
  );
}
```

---

## styles/globals.css

```css
/* Hide Google translate banner */
.goog-te-banner-frame.skiptranslate {
  display: none !important;
}
body {
  top: 0 !important;
}

.goog-te-gadget {
  font-family: inherit;
  font-size: 14px;
}
.goog-te-gadget-simple {
  background-color: transparent;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 4px;
  display: inline-block;
}
.goog-te-gadget img {
  display: none !important;
}
.goog-te-gadget-simple .goog-te-menu-value span {
  color: inherit;
}
.goog-te-gadget > div {
  display: none !important;
}

/* Prevent translation UI from being translated */
.notranslate {
  translate: no !important;
}
```

---

### ✅ Notes & caveats

* This is for **Pages Router**. If your project uses **App Router**, changes are different (you inject in `app/layout.tsx` instead).

* All your “freeze” flags (CORE_FREEZE, etc.) remain untouched — this is additive code only.

* You might run into the **removeChild / DOM mutation** error when navigating pages (commonly reported for Next.js + Google widget) — see this StackOverflow post:

  > “NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.” ([Stack Overflow][1])
  > The root cause: Google’s widget mutates the DOM outside React’s control.
  > Mitigation: wrap text or content in stable containers (e.g. `<span>`, `<div>`), avoid React re-render bumps in elements that Google has replaced.

* Another discussion: “Google no longer supports this widget” and risk of future breaks. ([Stack Overflow][2])

* The blog by Mohammad Faisal describes almost identical method (lang-config, translation scripts, cookie, switching) in Next.js. ([mdfaisal.com][3])

---

If you like, I can also generate the **App Router + TypeScript** version of the same starter, and upload both to a GitHub Gist or repo so you can clone. Which one do you prefer (App Router / TS, or JS version)?

[1]: https://stackoverflow.com/questions/79500999/integrating-google-translate-widget-in-next-js-application?utm_source=chatgpt.com "Integrating google translate widget in Next JS application"
[2]: https://stackoverflow.com/questions/64879633/nextjs-google-translate-widget?utm_source=chatgpt.com "NextJS Google Translate Widget - Stack Overflow"
[3]: https://www.mdfaisal.com/blog/nextjs-internationalization-using-google-translator?utm_source=chatgpt.com "NextJS Internationalization using Google Translator"
