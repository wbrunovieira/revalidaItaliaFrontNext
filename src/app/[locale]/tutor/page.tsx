export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import TutorDashboard from '@/components/TutorDashboard';

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

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-300 mt-2">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <TutorDashboard locale={locale} />
      </div>
    </NavSidebar>
  );
}