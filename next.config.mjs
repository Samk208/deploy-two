/** @type {import('next').NextConfig} */
// Fixed invalid import alias: removed 'dnd-pkg' alias; use '@hello-pangea/dnd' directly
// Derive Supabase project hostname from env to avoid using unsupported wildcards
import { createRequire } from 'module'
import path from 'path'
const require = createRequire(import.meta.url)
let DND_DIR
let DND_ENTRY
try {
  // Resolve to the package root dir
  DND_DIR = path.dirname(require.resolve('@hello-pangea/dnd/package.json'))
  // Resolve to the main entry file used by webpack; fall back to ESM entry if needed
  try {
    DND_ENTRY = require.resolve('@hello-pangea/dnd')
  } catch {
    // Package may not ship compiled dist under pnpm; fall back to TS source entry
    DND_ENTRY = path.join(DND_DIR, 'src', 'index.ts')
  }
} catch {}
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;
const IS_DEV = process.env.NODE_ENV === 'development'
const IS_NETLIFY = !!process.env.NETLIFY

const nextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Ensure pnpm-linked ESM packages are properly resolved/transpiled
  transpilePackages: ["@hello-pangea/dnd"],
  webpack: (config) => {
    if (DND_DIR) {
      config.resolve = config.resolve || {}
      config.resolve.alias = config.resolve.alias || {}
      // Map the concrete entry (prefer TS source) to package name to avoid pnpm/junction issues
      if (DND_ENTRY) {
        config.resolve.alias['@hello-pangea/dnd$'] = DND_ENTRY
      }
    }
    return config
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    // Netlify sometimes struggles with Next's image optimizer in certain setups.
    // Disable optimization on Netlify by default; can be overridden with env.
    // To re-enable later, set NEXT_IMAGE_UNOPTIMIZED="false" in your env.
    unoptimized: IS_NETLIFY || process.env.NEXT_IMAGE_UNOPTIMIZED === 'true',
    // Allow optimized remote images from common sources used in the project
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      // Always allow HTTPS access to Supabase storage
      SUPABASE_HOST && {
        protocol: 'https',
        hostname: SUPABASE_HOST,
        pathname: '/storage/v1/object/public/**',
      },
      // Allow HTTP to Supabase host ONLY during local development
      IS_DEV && SUPABASE_HOST && {
        protocol: 'http',
        hostname: SUPABASE_HOST,
        pathname: '/storage/v1/object/public/**',
      },
      // Dev: local Supabase storage emulator patterns
      IS_DEV && {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      IS_DEV && {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ].filter(Boolean),
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Ensure environment variables are properly loaded
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // For better debugging in development
  ...(process.env.NODE_ENV === 'development' && {
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),
  async headers() {
    return [
      {
        // Cache optimized image responses aggressively for best performance
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache Next.js static assets aggressively and immutably
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache public images for a reasonable time (1 week)
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
      {
        // Ensure the service worker is always fetched fresh
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        // Optional: CSP in Report-Only mode to observe violations without blocking
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy-Report-Only',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https: data:; frame-src 'self' https:; base-uri 'self'; form-action 'self';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
