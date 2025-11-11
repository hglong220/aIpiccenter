/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'picsum.photos', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    config.module.rules.push({
      test: /\.page\.tsx?$/,
      loader: 'next/dist/build/webpack/loaders/null-loader',
    })

    config.resolve = config.resolve || {}
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    }

    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({ canvas: 'commonjs canvas' })
    }

    return config
  },
}

module.exports = nextConfig

