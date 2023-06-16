/** @type {import('next').NextConfig} */

const withTM = require('next-transpile-modules')([
  '@pusher/push-notifications-web',
])

const nextConfig = withTM({
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
