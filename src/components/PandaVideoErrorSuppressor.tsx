'use client';

import { useEffect } from 'react';

export default function PandaVideoErrorSuppressor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Intercept fetch to handle Panda Video 404s gracefully
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];

      // Check if it's a Panda Video request (broader check)
      if (typeof url === 'string' &&
          (url.includes('pandavideo.com') || url.includes('panda'))) {
        try {
          const response = await originalFetch(...args);
          // Silently handle all Panda Video errors
          return response;
        } catch {
          // Return empty mock response for any Panda Video error
          return new Response('{}', {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return originalFetch(...args);
    };

    // Suppress console errors related to Panda Video
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const message = String(args[0] || '');
      if (message.includes('pandavideo') ||
          message.includes('PandaVideoErrorSuppressor') ||
          message.includes('Not 2xx response')) {
        return; // Silently ignore
      }
      originalError(...args);
    };

    // Handle unhandled promise rejections from Panda Video
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorStr = String(error);

      // Check if it's a Panda Video error (more comprehensive check)
      if (errorStr.includes('pandavideo') ||
          errorStr.includes('panda') ||
          errorStr.includes('Not 2xx response') ||
          (error?.message && error.message.includes('Not 2xx response'))) {
        event.preventDefault(); // Prevent Next.js error overlay
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.fetch = originalFetch;
      console.error = originalError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}