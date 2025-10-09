import { ClientProviders } from "@/components/client-providers";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/lib/auth-context";
import GoogleTranslate from "@/components/global/GoogleTranslate";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <AuthProvider>
          <ClientProviders>
            <GoogleTranslate />
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
