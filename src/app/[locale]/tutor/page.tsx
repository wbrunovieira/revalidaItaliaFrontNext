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
      <header className="sticky top-0 z-50 bg-primary border-b border-gray-800 shadow-2xl p-8">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Left side - Logo */}
          <div className="flex items-center gap-4">
            <Logo alt={navT('home')} />
          </div>

          {/* Center - Title */}
          <div className="flex-1 text-center p-8">
            <h1 className="text-5xl font-bold text-white">{t('dashboard.title')}</h1>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
            {/* Go to Classes Button */}
            <Link
              href={`/${locale}/courses`}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors font-medium"
            >
              <BookOpen size={18} />
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
        <div className="p-6 border-b border-gray-800">
          <p className="text-gray-300">{t('dashboard.subtitle')}</p>
        </div>

        <TutorDashboard locale={locale} />
      </main>
    </div>
  );
}
