/** @type {import('next').NextConfig} */
// Derive Supabase project hostname from env to avoid using unsupported wildcards
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
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
      SUPABASE_HOST && {
        protocol: 'https',
        hostname: SUPABASE_HOST,
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
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
