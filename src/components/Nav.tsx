// src/components/Nav.tsx
'use client';

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
    <nav className="fixed top-0 left-0 right-0 flex flex-col md:flex-row md:items-center justify-between px-4 py-3 bg-primary shadow">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <MenuToggle />
        <Logo />
      </div>

      <div className="w-full mb-4 md:mb-0 md:flex-1 md:px-8">
        <SearchInput />
      </div>

      <div className="flex flex-col items-end gap-4">
        <div className="flex items-center gap-4">
          <LanguageButton />
          <LogoutButton />
        </div>
        <div className="flex items-center gap-4">
          <Avatar />
          <Notifications />
        </div>
      </div>
    </nav>
  );
}
