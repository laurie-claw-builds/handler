import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: ['handler.pbthub.com', 'http://localhost:3000'],
    },
  },
};

export default nextConfig;
