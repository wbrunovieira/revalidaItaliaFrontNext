// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['it', 'pt', 'es'],

  defaultLocale: 'pt',
  localePrefix: 'always',
  localeDetection: true,
});

console.log('locales do routing', routing.locales);
console.log(
  'locales do routing localeDetection',
  routing.localeDetection
);
console.log(' routing', routing);
