// Enhanced next.config.mjs based on Next.js 15 best practices
// Replace your current next.config.mjs with this

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable unoptimized for external URLs (removes domain restrictions)
    unoptimized: false,
    
    // Configure remote patterns for external image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // SECURITY FIX: Use specific Supabase project hostname instead of wildcard
      // Derive hostname from NEXT_PUBLIC_SUPABASE_URL environment variable
      process.env.NEXT_PUBLIC_SUPABASE_URL && {
        protocol: 'https',
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      }
    ].filter(Boolean), // Remove null entries when env var is not set
    
    // Specify supported image formats
    formats: ['image/webp', 'image/avif'],
    
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Image sizes for different viewport widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Enable lazy loading by default
    loading: 'lazy',
    
    // Minimize layout shift
    minimumCacheTTL: 60,
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
    // Next.js 15 uses `turbopack` key (not `turbo`)
    turbopack: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Enable standalone output for better deployment
  output: 'standalone',
  
  // Configure webpack for better bundling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };

    // SVG rule fallback for webpack (so both Turbopack and webpack builds work)
    // This allows importing SVGs as React components: `import Logo from "./logo.svg"`
    // and falls back to url/file loader for other cases
    config.module.rules.push({
      test: /\.svg$/,
      oneOf: [
        {
          issuer: /\.[jt]sx?$/,
          use: [
            {
              loader: require.resolve('@svgr/webpack'),
              options: { svgo: true },
            },
          ],
        },
        {
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 8 * 1024 } }, // url-loader style
        },
      ],
    });

    return config;
  },
  
  // Enable compression
  compress: true,
  
  // Improve build performance
  swcMinify: true,
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;