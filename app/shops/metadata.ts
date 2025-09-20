import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover Creator Shops | One-Link Marketplace',
  description: 'Browse curated collections from top influencers and creators. Find unique products in fashion, tech, beauty, home decor, fitness, and more.',
  keywords: [
    'influencer shops',
    'creator marketplace',
    'curated products',
    'influencer recommendations',
    'social commerce',
    'creator economy',
    'fashion influencers',
    'tech reviews',
    'beauty products',
    'home decor',
    'fitness gear'
  ],
  openGraph: {
    title: 'Discover Creator Shops | One-Link Marketplace',
    description: 'Browse curated collections from top influencers and creators. Find unique products recommended by your favorite creators.',
    type: 'website',
    url: '/shops',
    images: [
      {
        url: '/og-shops.jpg',
        width: 1200,
        height: 630,
        alt: 'One-Link Creator Shops Marketplace'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Creator Shops | One-Link Marketplace',
    description: 'Browse curated collections from top influencers and creators.',
    images: ['/og-shops.jpg']
  },
  alternates: {
    canonical: '/shops'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
}
