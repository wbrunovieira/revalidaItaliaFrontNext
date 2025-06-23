'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Home,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { JSX } from 'react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const t = useTranslations('Sidebar');
  const navItems: {
    label: string;
    icon: JSX.Element;
    href: string;
  }[] = [
    {
      label: t('home'),
      icon: <Home size={24} />,
      href: '/',
    },
    {
      label: t('trails'),
      icon: (
        <Image
          src="/icons/trail.svg"
          alt={t('trails')}
          width={24}
          height={24}
        />
      ),
      href: '/trails',
    },
    {
      label: t('courses'),
      icon: <BookOpen size={24} />,
      href: '/courses',
    },
    {
      label: t('faq'),
      icon: <HelpCircle size={24} />,
      href: '/faq',
    },
  ];

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 bg-primary text-background-white flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      } z-10`}
    >
      <div className="flex justify-end p-4">
        <button
          onClick={onToggle}
          className="p-2 rounded hover:bg-secondary transition-colors"
          aria-label={
            collapsed ? t('expand') : t('collapse')
          }
        >
          {collapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-2 px-2">
          {navItems.map(({ label, icon, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 p-2 rounded hover:bg-secondary transition-colors"
              >
                {icon}
                {!collapsed && (
                  <span className="whitespace-nowrap">
                    {label}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
