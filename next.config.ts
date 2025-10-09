import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  // Allow cross-origin requests from local network
  allowedDevOrigins: [
    '192.168.56.1',    // IP da máquina tentando acessar
    '192.168.1.*',     // Toda rede 192.168.1.x
    '192.168.0.*',     // Toda rede 192.168.0.x
    '192.168.56.*',    // Toda rede 192.168.56.x
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.*',
      },
      {
        protocol: 'http',
        hostname: '192.168.56.*',
      },
    ],
    // Allow serving images from public/uploads
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
