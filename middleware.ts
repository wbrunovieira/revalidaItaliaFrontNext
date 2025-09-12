import { NextRequest, NextResponse } from 'next/server';

const locales = ['pt', 'it', 'es'];
const defaultLocale = 'pt';

// Get the preferred locale from the request
function getLocale(request: NextRequest): string {
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

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Debug logging
  console.log('[Middleware] Processing path:', pathname);
  console.log('[Middleware] Query params:', request.nextUrl.search);
  
  // CRITICAL: Block any attempt to access /reset-password/login or similar malformed paths
  // This should NEVER happen - reset-password is a standalone page
  if (pathname.includes('reset-password') && pathname.includes('login')) {
    console.log('[Middleware] BLOCKING malformed reset-password/login path');
    const searchParams = request.nextUrl.search;
    
    // Extract locale if present
    const localeMatch = pathname.match(/^\/([^\/]+)\//);
    const locale = localeMatch && locales.includes(localeMatch[1]) ? localeMatch[1] : getLocale(request);
    
    // Force redirect to correct reset-password page
    return NextResponse.redirect(
      new URL(`/${locale}/reset-password${searchParams}`, request.url)
    );
  }
  
  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Special handling for /reset-password path without locale
  if (pathname === '/reset-password') {
    const searchParams = request.nextUrl.search; // Preserve query params like ?token=...
    const locale = getLocale(request);
    
    console.log('[Middleware] Redirecting /reset-password to:', `/${locale}/reset-password${searchParams}`);
    return NextResponse.redirect(
      new URL(`/${locale}/reset-password${searchParams}`, request.url)
    );
  }
  
  // If path already has locale, let it through
  if (pathnameHasLocale) {
    console.log('[Middleware] Path already has locale, passing through');
    return NextResponse.next();
  }
  
  // For paths without locale, add the locale
  const locale = getLocale(request);
  
  // For the root path
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(`/${locale}`, request.url)
    );
  }
  
  // For other paths, prepend the locale
  return NextResponse.redirect(
    new URL(`/${locale}${pathname}${request.nextUrl.search}`, request.url)
  );
}

export const config = {
  // Match all paths except static files and API routes
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};