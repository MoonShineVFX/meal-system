/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV !== 'production',
})

const nextConfig = withPWA({
  async redirects() {
    return [
      {
        source: '/',
        destination: '/live',
        permanent: false,
      },
    ]
  },
  assetPrefix:
    process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_CDN_URL
      : undefined,
  images: {
    loader: 'custom',
  },
  experimental: {
    swcPlugins: [
      [
        'next-superjson-plugin',
        {
          excluded: [],
        },
      ],
    ],
  },
  reactStrictMode: true,
})

module.exports = nextConfig
