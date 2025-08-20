// /src/components/Nav.tsx

'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

import MenuToggle from './MenuToggle';
import Logo from './Logo';
import SearchInput from './SearchInput';

import LanguageButton from './LanguageButton';
import Notifications from './Notifications';
import UserDropdown from './UserDropdown';

interface NavProps {
  collapsed: boolean;
  onToggle: () => void;
}

function Nav({ collapsed, onToggle }: NavProps) {
  const t = useTranslations('Nav');

  return (
    <>
      {/* Mobile and Tablet Layout - 2 rows */}
      <nav
        aria-label={t('home')}
        className="fixed top-0 left-0 right-0 bg-primary shadow-2xl z-20 xl:hidden"
        suppressHydrationWarning
      >
        <div className="flex flex-col">
          {/* Mobile and Tablet Layout - 2 sections */}
          <div className="xl:hidden">
            {/* Row 1: Logo and User actions */}
            <div className="flex items-center justify-between px-5 py-3">
              <Logo alt={t('home')} />
              <div className="flex items-center gap-4">
                <Notifications />
                <UserDropdown />
              </div>
            </div>

            {/* Row 2: Menu toggle, Search centered, and Language button */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 pb-4">
              <MenuToggle collapsed={collapsed} onToggle={onToggle} />
              <div className="w-full max-w-md mx-auto">
                <SearchInput />
              </div>
              <div className="flex-shrink-0 scale-90">
                <LanguageButton />
              </div>
            </div>
          </div>

          {/* This section should never show now - keeping for structure */}
          <div className="hidden">
            <div className="flex items-center justify-between px-4 md:px-6 min-h-[4rem] py-2">
              <div className="flex items-center gap-3">
                <MenuToggle collapsed={collapsed} onToggle={onToggle} />
                <Logo alt={t('home')} />
              </div>
              <div className="flex items-center gap-3">
                <LanguageButton />
                <Notifications />
                <UserDropdown />
              </div>
            </div>

            {/* Search row for tablets */}
            <div className="px-4 md:px-6 pb-4 pt-1">
              <div className="w-full max-w-md mx-auto">
                <SearchInput />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Desktop Layout - Single row with grid */}
      <nav
        aria-label={t('home')}
        className="fixed top-0 left-0 right-0 h-16 bg-primary shadow-2xl z-20 hidden xl:block"
        suppressHydrationWarning
      >
        <div className="h-full px-6 grid grid-cols-3 items-center gap-4">
          {/* Left section - Logo and Menu */}
          <div className="flex items-center gap-4">
            <MenuToggle collapsed={collapsed} onToggle={onToggle} />
            <Logo alt={t('home')} />
          </div>

          {/* Center section - Search */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <SearchInput />
            </div>
          </div>

          {/* Right section - Language, Notifications, and User */}
          <div className="flex items-center gap-4 justify-end">
            <LanguageButton />
            <Notifications />
            <UserDropdown />
          </div>
        </div>
      </nav>
    </>
  );
}

export default memo(Nav);
