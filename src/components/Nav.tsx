'use client';

import { useTranslations, useLocale } from 'next-intl';
import MenuToggle from './MenuToggle';
import Logo from './Logo';
import SearchInput from './SearchInput';
import Avatar from './Avatar';
import LanguageButton from './LanguageButton';
import LogoutButton from './LogoutButton';
import Notifications from './Notifications';

interface NavProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Nav({
  collapsed,
  onToggle,
}: NavProps) {
  const t = useTranslations('Nav');
  const locale = useLocale();

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-primary shadow-2xl z-20">
      <div className="flex items-center gap-4">
        <MenuToggle
          collapsed={collapsed}
          onToggle={onToggle}
        />
        <Logo />
      </div>

      <div className=" md:flex-1 md:px-8">
        <SearchInput />
      </div>

      <div className="md:flex items-center gap-4">
        <LanguageButton />
        <LogoutButton />
        <Avatar />
        <Notifications />
      </div>
    </nav>
  );
}
