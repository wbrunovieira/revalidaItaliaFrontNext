// src/components/Nav.tsx
'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

import MenuToggle from './MenuToggle';
import Logo from './Logo';
import SearchInput from './SearchInput';
import Avatar from './Avatar';
import LanguageButton from './LanguageButton';
import LogoutButton from './LogoutButton';
import Notifications from './Notifications';

export default function Nav() {
  const t = useTranslations('Nav');
  const locale = useLocale();

  return (
    <nav className="fixed flex justify-between">
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
          <Avatar />
        </li>
        <li>
          <Notifications />
        </li>
      </ul>

      <div className="flex items-center gap-4">
        <LanguageButton />
        <LogoutButton />
      </div>
    </nav>
  );
}
