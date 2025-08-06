// src/app/[locale]/layout.tsx
import { getTranslations } from 'next-intl/server';
import {
  NextIntlClientProvider,
  type AbstractIntlMessages,
} from 'next-intl';
import type { Metadata } from 'next';
import { normalizeLocale } from '@/lib/normalizelocale';
import { QueryProvider } from '@/components/providers/query-provider';

const SUPPORTED_LOCALES: Array<'pt' | 'es' | 'it'> = [
  'pt',
  'es',
  'it',
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const t = await getTranslations({
    locale,
    namespace: 'meta',
  });

  const baseUrl = 'https://www.revalidaitalia.com';
  const canonicalUrl =
    locale === 'pt' ? baseUrl : `${baseUrl}/${locale}`;

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        pt: baseUrl,
        es: `${baseUrl}/es`,
        it: `${baseUrl}/it`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: canonicalUrl,
      siteName: 'Revalida Italia',
      locale,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      site: '@revalidaitalia',
      creator: '@revalidaitalia',

      images: [`${baseUrl}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  const { default: messages } = (await import(
    `../../../messages/${locale}.json`
  )) as { default: AbstractIntlMessages };

  return (
    <NextIntlClientProvider
      key={locale}
      locale={locale}
      messages={messages}
    >
      <QueryProvider>
        {children}
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
