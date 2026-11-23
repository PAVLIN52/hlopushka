import type { NextConfig } from 'next';

/** Конфигурация Next.js: standalone-сборка для Docker и общий пакет контрактов. */
const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@hlopushka/shared'],
};

export default nextConfig;
