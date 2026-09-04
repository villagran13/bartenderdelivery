import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dojiw2m9tvv09.cloudfront.net',
        pathname: '/85899/**',
      },
    ],
  },
}

export default nextConfig
