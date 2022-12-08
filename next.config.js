/** @type {import('next').NextConfig} */

const nextConfig = {
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
  optimizeFonts: false,
}

module.exports = nextConfig
