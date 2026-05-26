import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['handler.pbthub.com'],
    },
  },
};

export default nextConfig;
