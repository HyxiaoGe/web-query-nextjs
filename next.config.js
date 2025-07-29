/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['redis']
  },
  output: 'standalone',
  env: {
    SEARXNG_URL: process.env.SEARXNG_URL || 'http://localhost:8888',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    CACHE_TTL: process.env.CACHE_TTL || '3600',
    MAX_RESULTS: process.env.MAX_RESULTS || '10',
    REQUEST_TIMEOUT: process.env.REQUEST_TIMEOUT || '30000'
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/search',
        destination: '/',
        permanent: false,
      },
    ];
  }
};

module.exports = nextConfig;