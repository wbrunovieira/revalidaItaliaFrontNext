// src/components/Nav.tsx

'use client';

import { useTranslations } from 'next-intl';

import MenuToggle from './MenuToggle';
import Logo from './Logo';
import SearchInput from './SearchInput';

import LanguageButton from './LanguageButton';
import LogoutButton from './LogoutButton';
import Notifications from './Notifications';

import Avatar from './Avatar';

interface NavProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Nav({
  collapsed,
  onToggle,
}: NavProps) {
  const t = useTranslations('Nav');

  return (
    <nav
      aria-label={t('home')}
      className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-primary shadow-2xl z-20"
    >
      <div className="flex items-center gap-4">
        <MenuToggle
          collapsed={collapsed}
          onToggle={onToggle}
        />
        <Logo alt={t('home')} />
      </div>

      <div className="md:flex-1 md:px-8">
        <SearchInput />
      </div>

      <div className="md:flex items-center gap-4">
        <LanguageButton />
        <Notifications />

        <Avatar />

        <LogoutButton />
      </div>
    </nav>
  );
}
