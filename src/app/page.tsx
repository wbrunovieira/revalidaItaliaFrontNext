import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { normalizeLocale } from '@/lib/normalizelocale';

function parseAcceptLanguage(
  acceptLanguage: string
): string {
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.split(';q=');
      return {
        code: code.trim(),
        q: qValue ? parseFloat(qValue) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);

  return languages[0]?.code || '';
}

export default async function RootPage() {
  const requestHeaders = await headers();
  const acceptLanguage =
    requestHeaders.get('accept-language') || '';

  const preferredLang = parseAcceptLanguage(acceptLanguage);
  const normalizedLocale = normalizeLocale(preferredLang);

  redirect(`/${normalizedLocale}`);
}
