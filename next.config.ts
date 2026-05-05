import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['routeros-client', 'node-routeros', 'mysql2', 'source-map-support'],
  allowedDevOrigins: ['100.100.30.4'],
};

export default nextConfig;
