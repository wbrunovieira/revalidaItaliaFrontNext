export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import TutorDashboard from '@/components/TutorDashboard';
import Logo from '@/components/Logo';
import LanguageButton from '@/components/LanguageButton';
import Notifications from '@/components/Notifications';
import UserDropdown from '@/components/UserDropdown';

export default async function TutorPage({
  params,
}: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const { locale } = await params;

  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  const t = await getTranslations({
    locale,
    namespace: 'Tutor',
  });

  const navT = await getTranslations({
    locale,
    namespace: 'Nav',
  });

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      {/* Custom Header for Tutor */}
      <header className="sticky top-0 z-50 bg-primary border-b border-gray-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 sm:h-16">
          {/* Left side - Logo */}
          <div className="flex items-center gap-4 mb-3 sm:mb-0">
            <Logo alt={navT('home')} />
          </div>

          {/* Center - Title */}
          <div className="flex-1 text-center mb-3 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">{t('dashboard.title')}</h1>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end">
            {/* Go to Classes Button */}
            <Link
              href={`/${locale}/courses`}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors font-medium text-sm sm:text-base"
            >
              <BookOpen size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">{navT('goToClasses') || 'Aulas'}</span>
            </Link>

            {/* Language Selector */}
            <LanguageButton />

            {/* Notifications */}
            <Notifications />

            {/* User Dropdown */}
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-800">
          <p className="text-sm sm:text-base text-gray-300">{t('dashboard.subtitle')}</p>
        </div>

        <TutorDashboard locale={locale} />
      </main>
    </div>
  );
}
