// src/components/Nav.tsx
'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function Nav() {
  const t = useTranslations('Nav');
  const locale = useLocale(); // 'pt', 'es' ou 'it'

  return (
    <nav>
      <ul
        style={{
          display: 'flex',
          gap: '1rem',
          listStyle: 'none',
        }}
      >
        <li>
          <Link href={`/${locale}`}>{t('home')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/blog`}>{t('blog')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/faq`}>{t('FAQ')}</Link>
        </li>
        <li>
          <Link href={`/${locale}/cursos`}>
            {t('cursos')}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
