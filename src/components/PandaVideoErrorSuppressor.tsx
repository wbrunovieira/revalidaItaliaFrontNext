'use client';

import { useEffect } from 'react';

export default function PandaVideoErrorSuppressor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Intercept fetch to handle Panda Video 404s gracefully
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      
      // Check if it's a Panda Video AI config request
      if (typeof url === 'string' && 
          url.includes('config.tv.pandavideo.com.br') && 
          url.includes('-ai.json')) {
        try {
          const response = await originalFetch(...args);
          if (!response.ok) {
            console.warn('Panda Video AI config not found (this is expected):', url);
          }
          return response;
        } catch (error) {
          console.warn('Panda Video AI config error (this is expected):', error);
          // Return a mock response to prevent the error from propagating
          return new Response('{}', {
            status: 404,
            statusText: 'Not Found'
          });
        }
      }
      
      return originalFetch(...args);
    };

    // Handle unhandled promise rejections from Panda Video
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Check if it's a Panda Video error
      if (error && (
        (error.message && error.message.includes('Not 2xx response')) ||
        (error.stack && error.stack.includes('pandavideo')) ||
        (event.promise && String(event.promise).includes('pandavideo'))
      )) {
        console.warn('Suppressed Panda Video error:', error);
        event.preventDefault(); // This prevents the Next.js red error overlay
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}