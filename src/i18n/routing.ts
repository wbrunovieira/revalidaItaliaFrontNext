// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['it', 'pt', 'es'],
  defaultLocale: 'pt',
  localePrefix: 'always',
  localeDetection: true,
});

// Public routes that should bypass authentication checks
export const publicRoutes = ['/login', '/reset-password'];

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);