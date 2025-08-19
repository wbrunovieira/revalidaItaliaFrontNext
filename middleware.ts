import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['pt', 'it', 'es'];
const defaultLocale = 'pt';

// Get the preferred locale from the request
function getLocale(request: NextRequest): string {
  // Check if there's a locale in the pathname
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    const locale = pathname.split('/')[1];
    return locale;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const detectedLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].split('-')[0].trim())
      .find((lang) => locales.includes(lang));
    
    if (detectedLocale) {
      return detectedLocale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Special handling for /login without locale
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    const locale = getLocale(request);
    // Remove any duplicate /login/login pattern
    const cleanPath = pathname.replace(/^\/login\/login/, '/login');
    return NextResponse.redirect(
      new URL(`/${locale}${cleanPath}`, request.url)
    );
  }

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    
    // For the root path, redirect to the locale root
    if (pathname === '/') {
      return NextResponse.redirect(
        new URL(`/${locale}`, request.url)
      );
    }
    
    // For other paths, prepend the locale
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }

  // Prevent double login path (e.g., /pt/login/login)
  const match = pathname.match(/^\/([^\/]+)\/login\/login/);
  if (match) {
    const locale = match[1];
    return NextResponse.redirect(
      new URL(`/${locale}/login`, request.url)
    );
  }
}

export const config = {
  // Skip all internal paths (_next, _vercel, etc.)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_vercel).*)',
  ],
};