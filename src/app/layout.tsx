// src/app/layout.tsx
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import PandaVideoErrorSuppressor from '@/components/PandaVideoErrorSuppressor';
import DevToolsManager from '@/components/DevToolsManager';
import CloudWatchRUM from '@/components/CloudWatchRUM';

import {
  Plus_Jakarta_Sans,
  Spectral,
} from 'next/font/google';
import Script from 'next/script';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plus-jakarta-sans',
});
const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-spectral',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt"
      className={`${plusJakarta.variable} ${spectral.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <CloudWatchRUM />
        <PandaVideoErrorSuppressor />
        <DevToolsManager />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
