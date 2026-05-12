import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['100.100.30.3', '100.100.30.4', 'localhost', '0.0.0.0'],
};

export default nextConfig;
