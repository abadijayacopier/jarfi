import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['routeros-client', 'node-routeros', 'mysql2', 'source-map-support'],
};

export default nextConfig;
