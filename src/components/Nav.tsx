// src/components/Nav.tsx
'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

import MenuToggle from './MenuToggle';
import Logo from './Logo';
import SearchInput from './SearchInput';

export default function Nav() {
  const t = useTranslations('Nav');
  const locale = useLocale();

  return (
    <nav>
      <ul className="flex gap-4 list-none items-center">
        <li>
          <MenuToggle />
        </li>
        <li>
          <Logo />
        </li>
        <li>
          <SearchInput />
        </li>

        <li>
          <Link href={`/${locale}`}>{t('home')}</Link>
        </li>
      </ul>
    </nav>
  );
}
