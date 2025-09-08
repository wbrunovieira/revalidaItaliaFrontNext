import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Use custom loader for S3 when in production with S3 enabled
    ...(process.env.NEXT_PUBLIC_USE_S3 === 'true' && {
      loader: 'custom',
      loaderFile: './src/lib/imageLoader.ts',
    }),
    // Allow serving images from public/uploads
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
