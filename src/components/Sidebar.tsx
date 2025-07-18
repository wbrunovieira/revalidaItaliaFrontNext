// /src/components/Sidebar.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
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
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  const navItems: {
    label: string;
    icon: JSX.Element;
    href: string;
    matchPaths?: string[];
  }[] = [
    {
      label: t('home'),
      icon: <Home size={24} />,
      href: `/${locale}`,
      matchPaths: [`/${locale}`],
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
      href: `/${locale}/tracks`,
      matchPaths: [`/${locale}/tracks`],
    },
    {
      label: t('courses'),
      icon: <BookOpen size={24} />,
      href: `/${locale}/courses`,
      matchPaths: [`/${locale}/courses`],
    },
    {
      label: t('faq'),
      icon: <HelpCircle size={24} />,
      href: `/${locale}/faq`,
    },
  ];

  const profileNavItems: {
    label: string;
    icon: JSX.Element;
    href: string;
    matchPaths?: string[];
  }[] = [
    {
      label: t('profile'),
      icon: (
        <Image
          src="/icons/avatar.svg"
          alt={t('profile')}
          width={24}
          height={24}
        />
      ),
      href: `/${locale}/profile`,
      matchPaths: [`/${locale}/profile`],
    },
  ];

  const isActive = (
    href: string,
    matchPaths?: string[]
  ) => {
    if (pathname === href) return true;

    if (href === `/${locale}`) {
      return pathname === href;
    }

    if (
      pathname.startsWith(href + '/') ||
      pathname === href
    ) {
      return true;
    }

    if (matchPaths) {
      return matchPaths.some(
        path =>
          pathname === path ||
          pathname.startsWith(path + '/')
      );
    }

    return false;
  };

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 bg-primary text-background-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl ${
        collapsed ? 'w-20' : 'w-64'
      } z-10`}
    >
      <div
        className={`flex p-4 ${
          collapsed ? 'justify-center' : 'justify-end'
        }`}
      >
        <button
          onClick={onToggle}
          className="group p-2 rounded-lg hover:bg-secondary/50 transition-all duration-300 hover:shadow-md"
          aria-label={
            collapsed ? t('expand') : t('collapse')
          }
        >
          <span className="transition-all duration-300 group-hover:scale-110 inline-block">
            {collapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto pb-4">
        {/* Seção Principal de Navegação */}
        <ul
          className={`space-y-2 ${
            collapsed ? 'px-2' : 'px-3'
          }`}
        >
          {navItems.map(
            ({ label, icon, href, matchPaths }) => {
              const active = isActive(href, matchPaths);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`
                    group flex items-center gap-3 rounded-lg transition-all duration-300 ease-in-out
                    relative overflow-hidden
                    ${
                      collapsed
                        ? 'p-3 justify-center'
                        : 'p-3'
                    }
                    ${
                      active
                        ? 'bg-secondary text-white shadow-lg border-l-4 border-white translate-x-1'
                        : 'hover:bg-secondary/50 hover:shadow-md hover:translate-x-2 hover:border-l-4 hover:border-white/60 border-l-4 border-transparent'
                    }
                  `}
                  >
                    {/* Efeito de gradiente no hover */}
                    <div
                      className={`
                    absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0
                    translate-x-[-100%] group-hover:translate-x-[100%]
                    transition-transform duration-700 ease-in-out
                    ${active ? 'opacity-0' : 'opacity-100'}
                  `}
                    />

                    <span
                      className={`
                    relative z-10 transition-all duration-300 ease-in-out
                    ${
                      active
                        ? 'scale-110 text-white'
                        : 'group-hover:scale-110 group-hover:rotate-3'
                    }
                  `}
                    >
                      {icon}
                    </span>
                    {!collapsed && (
                      <span
                        className={`
                      relative z-10 whitespace-nowrap font-medium transition-all duration-300
                      ${
                        active
                          ? 'text-white translate-x-0'
                          : 'group-hover:translate-x-1 group-hover:text-white'
                      }
                    `}
                      >
                        {label}
                      </span>
                    )}

                    {active && (
                      <div
                        className={`
                      absolute w-2 h-2 bg-white rounded-full animate-pulse
                      ${
                        collapsed
                          ? 'right-1 top-1'
                          : 'right-3 top-1/2 -translate-y-1/2'
                      }
                    `}
                      />
                    )}
                  </Link>
                </li>
              );
            }
          )}
        </ul>

        {/* Divisor */}
        <div
          className={`my-6 ${collapsed ? 'px-2' : 'px-3'}`}
        >
          <div className="border-t border-white/20"></div>
        </div>

        {/* Seção do Perfil */}
        <ul
          className={`space-y-2 ${
            collapsed ? 'px-2' : 'px-3'
          }`}
        >
          {profileNavItems.map(
            ({ label, icon, href, matchPaths }) => {
              const active = isActive(href, matchPaths);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`
                    group flex items-center gap-3 rounded-lg transition-all duration-300 ease-in-out
                    relative overflow-hidden
                    ${
                      collapsed
                        ? 'p-3 justify-center'
                        : 'p-3'
                    }
                    ${
                      active
                        ? 'bg-secondary text-white shadow-lg border-l-4 border-white translate-x-1'
                        : 'hover:bg-secondary/50 hover:shadow-md hover:translate-x-2 hover:border-l-4 hover:border-white/60 border-l-4 border-transparent'
                    }
                  `}
                  >
                    {/* Efeito de gradiente no hover */}
                    <div
                      className={`
                    absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0
                    translate-x-[-100%] group-hover:translate-x-[100%]
                    transition-transform duration-700 ease-in-out
                    ${active ? 'opacity-0' : 'opacity-100'}
                  `}
                    />

                    <span
                      className={`
                    relative z-10 transition-all duration-300 ease-in-out
                    ${
                      active
                        ? 'scale-110 text-white'
                        : 'group-hover:scale-110 group-hover:rotate-3'
                    }
                  `}
                    >
                      {icon}
                    </span>
                    {!collapsed && (
                      <span
                        className={`
                      relative z-10 whitespace-nowrap font-medium transition-all duration-300
                      ${
                        active
                          ? 'text-white translate-x-0'
                          : 'group-hover:translate-x-1 group-hover:text-white'
                      }
                    `}
                      >
                        {label}
                      </span>
                    )}

                    {active && (
                      <div
                        className={`
                      absolute w-2 h-2 bg-white rounded-full animate-pulse
                      ${
                        collapsed
                          ? 'right-1 top-1'
                          : 'right-3 top-1/2 -translate-y-1/2'
                      }
                    `}
                      />
                    )}
                  </Link>
                </li>
              );
            }
          )}
        </ul>
      </nav>
    </aside>
  );
}
