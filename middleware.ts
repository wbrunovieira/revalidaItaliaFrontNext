// middleware.ts

import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Define routing configuration inline to avoid import issues
const routing = {
  locales: ['it', 'pt', 'es'],
  defaultLocale: 'pt',
  localePrefix: 'always' as const,
  localeDetection: true,
};

// Create the next-intl middleware with configuration
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for reset-password route
  if (pathname === '/reset-password' || pathname.startsWith('/reset-password/')) {
    console.log('[Middleware] Skipping for reset-password route:', pathname);
    return NextResponse.next();
  }

  // For all other paths, use next-intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except static files, API routes, and reset-password
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon.png|favicon.svg|images/books|icons|manifests|reset-password).*)',
    '/',
  ],
};
