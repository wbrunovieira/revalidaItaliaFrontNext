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
  ChevronDown,
  Layers,
  ClipboardList,
  Brain,
  HeartHandshake,
  MessageSquare,
  Video,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  JSX,
  useState,
  useEffect,
  useCallback,
} from 'react';

interface Module {
  id: string;
  slug: string;
  order: number;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
}

interface Course {
  id: string;
  slug: string;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
}

interface Track {
  id: string;
  slug: string;
  order: number;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
  courses?: Course[];
}

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

  const [modules, setModules] = useState<Module[]>([]);
  const [currentCourse, setCurrentCourse] =
    useState<Course | null>(null);
  const [expandedCourse, setExpandedCourse] =
    useState(false);

  const [currentTrack, setCurrentTrack] =
    useState<Track | null>(null);

  // Extract course slug from pathname
  const courseSlugMatch = pathname.match(
    /\/courses\/([^\/]+)/
  );
  const courseSlug = courseSlugMatch
    ? courseSlugMatch[1]
    : null;
  const isInCoursePage = !!courseSlug;

  // Extract track slug from pathname
  const trackSlugMatch = pathname.match(
    /\/tracks\/([^\/]+)/
  );
  const trackSlug = trackSlugMatch
    ? trackSlugMatch[1]
    : null;
  const isInTrackPage = !!trackSlug;

  const fetchTrackAndCourses = useCallback(
    async (slug: string) => {
      try {
        // Fetch track details
        const trackResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks?slug=${slug}`
        );
        if (trackResponse.ok) {
          const tracks = await trackResponse.json();
          const track = tracks.find(
            (t: Track) => t.slug === slug
          );
          if (track) {
            setCurrentTrack(track);
          }
        }
      } catch (error) {
        console.error('Error fetching track data:', error);
      }
    },
    []
  );

  const fetchCourseAndModules = useCallback(
    async (slug: string) => {
      try {
        // Fetch course details
        const courseResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses?slug=${slug}`
        );
        if (courseResponse.ok) {
          const courses = await courseResponse.json();
          const course = courses.find(
            (c: Course) => c.slug === slug
          );
          if (course) {
            setCurrentCourse(course);
            setExpandedCourse(true);

            // Fetch modules
            const modulesResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${course.id}/modules`
            );
            if (modulesResponse.ok) {
              const modulesData =
                await modulesResponse.json();
              setModules(
                modulesData.sort(
                  (a: Module, b: Module) =>
                    a.order - b.order
                )
              );
            }
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
      }
    },
    []
  );

  // Fetch course and modules when in a course page
  useEffect(() => {
    if (courseSlug) {
      fetchCourseAndModules(courseSlug);
    } else {
      setModules([]);
      setCurrentCourse(null);
      setExpandedCourse(false);
    }
  }, [courseSlug, fetchCourseAndModules]);

  // Fetch track and courses when in a track page
  useEffect(() => {
    if (trackSlug) {
      fetchTrackAndCourses(trackSlug);
    } else {
      setCurrentTrack(null);
    }
  }, [trackSlug, fetchTrackAndCourses]);

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
      label: t('assessments'),
      icon: <ClipboardList size={24} />,
      href: `/${locale}/assessments`,
      matchPaths: [`/${locale}/assessments`],
    },
    {
      label: t('flashcards'),
      icon: <Brain size={24} />,
      href: `/${locale}/flashcards/progress`,
      matchPaths: [`/${locale}/flashcards`],
    },
    {
      label: t('community'),
      icon: <HeartHandshake size={24} />,
      href: `/${locale}/community`,
      matchPaths: [`/${locale}/community`],
    },
    {
      label: t('liveSessions'),
      icon: <Video size={24} />,
      href: `/${locale}/live-sessions`,
      matchPaths: [`/${locale}/live-sessions`],
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
    {
      label: t('myTickets'),
      icon: <MessageSquare size={24} />,
      href: `/${locale}/my-tickets`,
      matchPaths: [`/${locale}/my-tickets`],
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
      className={`fixed top-16 left-0 bottom-0 bg-primary text-background-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl ${
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
              const isCoursesItem =
                href === `/${locale}/courses`;
              const showCourseExpansion =
                isCoursesItem &&
                isInCoursePage &&
                currentCourse;

              const isTracksItem =
                href === `/${locale}/tracks`;
              const showTrackExpansion =
                isTracksItem &&
                isInTrackPage &&
                currentTrack;

              return (
                <li key={href}>
                  <div>
                    {/* Always show the main navigation item */}
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
                          active && pathname === href
                            ? 'bg-secondary text-white shadow-lg border-l-4 border-white translate-x-1'
                            : showCourseExpansion
                            ? 'hover:bg-secondary/50 hover:shadow-md hover:translate-x-2 hover:border-l-4 hover:border-white/60 border-l-4 border-transparent'
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

                    {/* Track expansion under Tracks item */}
                    {showTrackExpansion && (
                      <>
                        {/* Collapsed state - show indicator */}
                        {collapsed && (
                          <div className="relative">
                            {/* Connection visual */}
                            <div className="absolute left-1/2 -translate-x-1/2 -top-4">
                              <div className="w-px h-5 bg-white/40"></div>
                              <div className="w-1 h-1 bg-white/60 rounded-full -ml-px"></div>
                            </div>

                            <div className="mt-1 px-3">
                              <div className="p-1 bg-secondary/80 rounded-md flex justify-center shadow-sm border border-white/20">
                                <Image
                                  src="/icons/trail.svg"
                                  alt="Trail"
                                  width={12}
                                  height={12}
                                  className="opacity-90"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Expanded state - show full track */}
                        {!collapsed && (
                          <div className="mt-1 ml-12 relative">
                            {/* Connection line for track */}
                            <div className="absolute -left-2 top-0 h-8 w-px bg-white/20"></div>
                            <div className="absolute -left-2 top-4 w-2 h-px bg-white/20"></div>

                            {/* Current track */}
                            <div className="w-full flex items-center gap-2 p-2 rounded-lg bg-secondary text-white shadow-md border-l-4 border-white translate-x-1">
                              <Image
                                src="/icons/trail.svg"
                                alt="Trail"
                                width={14}
                                height={14}
                              />
                              <span className="text-sm font-medium truncate flex-1 text-left">
                                {currentTrack.translations.find(
                                  t => t.locale === locale
                                )?.title ||
                                  currentTrack.slug}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Course expansion under Courses item */}
                    {showCourseExpansion && (
                      <>
                        {/* Collapsed state - show indicator */}
                        {collapsed && (
                          <div className="relative">
                            {/* Connection visual */}
                            <div className="absolute left-1/2 -translate-x-1/2 -top-4">
                              <div className="w-px h-5 bg-white/40"></div>
                              <div className="w-1 h-1 bg-white/60 rounded-full -ml-px"></div>
                            </div>

                            <div className="mt-1 px-3">
                              <div className="p-1 bg-secondary/80 rounded-md flex justify-center shadow-sm border border-white/20">
                                <BookOpen
                                  size={12}
                                  className="text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Expanded state - show full course and modules */}
                        {!collapsed && (
                          <div className="mt-1 ml-12 relative">
                            {/* Connection line for modules */}
                            <div className="absolute -left-2 top-0 bottom-0 w-px bg-white/20"></div>
                            <div className="absolute -left-2 top-4 w-2 h-px bg-white/20"></div>

                            {/* Current course */}
                            <button
                              onClick={() =>
                                setExpandedCourse(
                                  !expandedCourse
                                )
                              }
                              className={`
                          w-full group flex items-center gap-2 p-2 rounded-lg transition-all duration-300
                          bg-secondary text-white shadow-md border-l-4 border-white translate-x-1
                        `}
                            >
                              <BookOpen
                                size={14}
                                className="flex-shrink-0"
                              />
                              <span className="text-sm font-medium truncate flex-1 text-left">
                                {currentCourse.translations.find(
                                  t => t.locale === locale
                                )?.title ||
                                  currentCourse.slug}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-300 ${
                                  expandedCourse
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                            </button>

                            {/* Modules list */}
                            {expandedCourse && (
                              <ul className="mt-1 ml-6 space-y-0.5">
                                {modules.map(module => {
                                  const moduleTranslation =
                                    module.translations.find(
                                      t =>
                                        t.locale === locale
                                    );
                                  const isModuleActive =
                                    pathname.includes(
                                      `/modules/${module.slug}`
                                    );

                                  return (
                                    <li key={module.id}>
                                      <Link
                                        href={`/${locale}/courses/${courseSlug}/modules/${module.slug}`}
                                        className={`
                                    group flex items-center gap-2 p-2 rounded-lg transition-all duration-300
                                    ${
                                      isModuleActive
                                        ? 'bg-white/30 text-white'
                                        : 'hover:bg-white/10 hover:text-white text-gray-300'
                                    }
                                  `}
                                      >
                                        <Layers
                                          size={14}
                                          className="flex-shrink-0"
                                        />
                                        <span className="text-xs truncate">
                                          {moduleTranslation?.title ||
                                            `Module ${module.order}`}
                                        </span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
