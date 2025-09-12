import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Debug logging
  console.log('[Middleware] Processing path:', pathname);
  console.log('[Middleware] Query params:', request.nextUrl.search);
  console.log('[Middleware] Full URL:', request.url);

  // Get locales from routing config
  const locales = routing.locales;
  const defaultLocale = routing.defaultLocale;

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Special handling for /reset-password path without locale
  if (pathname === '/reset-password') {
    const searchParams = request.nextUrl.search; // Preserve query params like ?token=...
    
    // Get locale from accept-language header or use default
    const acceptLanguage = request.headers.get('accept-language');
    let locale = defaultLocale;
    
    if (acceptLanguage) {
      const detectedLocale = acceptLanguage
        .split(',')
        .map((lang) => lang.split(';')[0].split('-')[0].trim())
        .find((lang) => locales.includes(lang as any));
      
      if (detectedLocale) {
        locale = detectedLocale;
      }
    }
    
    console.log('[Middleware] Redirecting /reset-password to:', `/${locale}/reset-password${searchParams}`);
    return NextResponse.redirect(
      new URL(`/${locale}/reset-password${searchParams}`, request.url)
    );
  }

  // Prevent any malformed reset-password paths like /reset-password/login
  if (pathname.startsWith('/reset-password/')) {
    const searchParams = request.nextUrl.search;
    
    // Get locale from accept-language header or use default
    const acceptLanguage = request.headers.get('accept-language');
    let locale = defaultLocale;
    
    if (acceptLanguage) {
      const detectedLocale = acceptLanguage
        .split(',')
        .map((lang) => lang.split(';')[0].split('-')[0].trim())
        .find((lang) => locales.includes(lang as any));
      
      if (detectedLocale) {
        locale = detectedLocale;
      }
    }
    
    console.log('[Middleware] Cleaning malformed reset-password path:', pathname);
    console.log('[Middleware] Redirecting to:', `/${locale}/reset-password${searchParams}`);
    // Redirect to the correct reset-password page
    return NextResponse.redirect(
      new URL(`/${locale}/reset-password${searchParams}`, request.url)
    );
  }

  // If path has locale and it's reset-password with extra segments, clean it
  if (pathnameHasLocale) {
    const match = pathname.match(/^\/([^\/]+)\/reset-password\/.+/);
    if (match) {
      const locale = match[1];
      const searchParams = request.nextUrl.search;
      console.log('[Middleware] Cleaning malformed localized reset-password path:', pathname);
      console.log('[Middleware] Redirecting to:', `/${locale}/reset-password${searchParams}`);
      return NextResponse.redirect(
        new URL(`/${locale}/reset-password${searchParams}`, request.url)
      );
    }
  }

  // Use next-intl middleware for all other paths
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except static files and API routes
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};