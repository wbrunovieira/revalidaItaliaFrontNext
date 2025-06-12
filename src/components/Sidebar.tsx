'use client';

import Link from 'next/link';
import {
  Home,
  BookOpen,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const t = useTranslations('Sidebar');
  const navItems = [
    { label: t('home'), icon: Home, href: '/' },
    {
      label: t('courses'),
      icon: BookOpen,
      href: '/courses',
    },
    { label: t('faq'), icon: HelpCircle, href: '/faq' },
  ];

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 bg-primary text-white flex flex-col transition-all duration-300 ease-in-out ${
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
          {navItems.map(({ label, icon: Icon, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 p-2 rounded hover:bg-secondary transition-colors"
              >
                <Icon size={24} />
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
