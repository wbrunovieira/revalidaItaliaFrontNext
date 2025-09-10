// /src/components/Nav.tsx

'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

import MenuToggle from './MenuToggle';
import Logo from './Logo';
import SearchInput from './SearchInput';

import LanguageButton from './LanguageButton';
import NotificationBell from './NotificationBell';
import UserDropdown from './UserDropdown';

interface NavProps {
  collapsed: boolean;
  onToggle: () => void;
}

function Nav({ collapsed, onToggle }: NavProps) {
  const t = useTranslations('Nav');

  return (
    <>
      {/* Mobile and Tablet Layouts */}
      <nav
        aria-label={t('home')}
        className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#0C3559] via-[#0F2940] to-[#0C3559] z-20 xl:hidden"
        style={{
          boxShadow: '0 4px 20px rgba(12, 53, 89, 0.25), 0 8px 32px rgba(12, 53, 89, 0.15), 0 12px 48px rgba(139, 202, 217, 0.1)'
        }}
        suppressHydrationWarning
      >
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}
        />
        
        {/* Noise texture overlay for depth */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />
        
        <div className="flex flex-col">
          {/* iPad Mini Layout (768px - 819px) - TODO: Implement specific layout */}
          <div className="hidden md:hidden">
            {/* This will be implemented based on iPad Mini requirements */}
          </div>

          {/* Tablet Layout (iPad Air/Pro - 820px to 1279px) */}
          {/* Current layout works well for iPad Air (820px) and iPad Pro */}
          <div className="block xl:hidden">
            {/* Row 1: Logo and User actions */}
            <div className="flex items-center justify-between px-5 py-3">
              <Logo alt={t('home')} />
              <div className="flex items-center">
                <div className="-mr-2">
                  <NotificationBell />
                </div>
                <UserDropdown />
              </div>
            </div>

            {/* Row 2: Search full width */}
            <div className="px-5 pb-3 relative z-50">
              <div className="w-full">
                <SearchInput />
              </div>
            </div>

            {/* Row 3: Menu toggle and Language button */}
            <div className="flex items-center justify-between px-5 pb-4">
              <MenuToggle collapsed={collapsed} onToggle={onToggle} />
              <div className="scale-75">
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
                <NotificationBell />
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
        className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#0C3559] via-[#0F2940] to-[#0C3559] z-20 hidden xl:block"
        style={{
          boxShadow: '0 4px 20px rgba(12, 53, 89, 0.25), 0 8px 32px rgba(12, 53, 89, 0.15), 0 12px 48px rgba(139, 202, 217, 0.1)'
        }}
        suppressHydrationWarning
      >
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}
        />
        
        {/* Noise texture overlay for depth */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />
        
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
            <div className="flex items-center">
              <div className="-mr-2">
                <NotificationBell />
              </div>
              <UserDropdown />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default memo(Nav);
