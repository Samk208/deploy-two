import { ClientProviders } from "@/components/client-providers";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/lib/auth-context";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { Suspense } from "react";
import "./globals.css";

// ==========================================
// TRANSLATION INTEGRATION - ADDITIVE ONLY
// These imports add translation functionality
// without modifying existing code
// ==========================================
import { ApiPageTranslator } from "@/components/global/ApiPageTranslator";
import { GlobalErrorHandler } from "@/components/global/GlobalErrorHandler";
import { GoogleTranslate } from "@/components/global/GoogleTranslate";
import { GoogleTranslateErrorBoundary } from "@/components/global/GoogleTranslateErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateViewport() {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: dark)", color: "#000000" },
      { color: "#ffffff" },
    ],
  };
}

export const metadata: Metadata = {
  applicationName: "One-Link",
  // Ensure correct absolute URLs for OpenGraph/Twitter images in prod builds
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "One-Link - Influencer Commerce Platform",
    template: "%s | One-Link",
  },
  description:
    "Connect suppliers, influencers, and customers in one seamless commerce platform. Build your shop, discover products, and grow your business.",
  keywords: [
    "influencer marketing",
    "e-commerce",
    "affiliate marketing",
    "social commerce",
  ],
  authors: [{ name: "One-Link Team" }],
  creator: "One-Link",
  publisher: "One-Link",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://onelink.com",
    siteName: "One-Link",
    title: "One-Link - Influencer Commerce Platform",
    description:
      "Connect suppliers, influencers, and customers in one seamless commerce platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "One-Link - Influencer Commerce Platform",
    description:
      "Connect suppliers, influencers, and customers in one seamless commerce platform.",
    creator: "@onelink",
  },
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ============================================
  // MIGRATION FLAG: Controls translation system
  // - false (default): Use legacy widget (current behavior)
  // - true: Use new Google Cloud Translation API
  // ============================================
  const useNewTranslationAPI =
    process.env.NEXT_PUBLIC_TRANSLATION_MIGRATION === "true";

  const spUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let spOrigin: string | null = null;
  try {
    spOrigin = spUrl ? new URL(spUrl).origin : null;
  } catch {
    spOrigin = null;
  }

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {spOrigin ? (
          <link rel="preconnect" href={spOrigin} crossOrigin="" />
        ) : null}
      </head>
      <body
        className="font-sans antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ClientProviders>
            {/* ============================================
                TRANSLATION INTEGRATION
                
                LEGACY WIDGET (Old System):
                - Renders when NEXT_PUBLIC_TRANSLATION_MIGRATION=false
                - Client-side Google Translate widget
                - Known issue: Can cause DOM conflicts
                
                NEW API (Migration Target):
                - Active when NEXT_PUBLIC_TRANSLATION_MIGRATION=true
                - Backend-powered via Google Cloud API
                - No DOM conflicts, better control
                ============================================ */}
            {/* Translation mounting
               - If widget is enabled → mount GoogleTranslate
               - Else if API migration is enabled → mount ApiPageTranslator for full-page API translation
            */}
            <GlobalErrorHandler />
            <GoogleTranslateErrorBoundary>
              {process.env.NEXT_PUBLIC_ENABLE_TRANSLATE !== "false" ? (
                <GoogleTranslate />
              ) : process.env.NEXT_PUBLIC_TRANSLATION_MIGRATION === "true" ? (
                <ApiPageTranslator />
              ) : null}
            </GoogleTranslateErrorBoundary>

            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg z-50"
            >
              Skip to main content
            </a>

            <Suspense fallback={<div>Loading...</div>}>
              <Header />

              <main
                id="main-content"
                data-testid="primary-main"
                className="flex-1"
              >
                {children}
              </main>

              <Footer />
              <CookieBanner />
            </Suspense>
          </ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
