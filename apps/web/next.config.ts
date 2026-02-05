import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@codementor/shared', '@codementor/db'],
};

export default nextConfig;
