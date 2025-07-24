export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import TutorReviewPage from '@/components/TutorReviewPage';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function TutorReviewPageWrapper({
  params,
}: {
  params: Promise<{
    locale: string;
    attemptId: string;
  }>;
}) {
  const { locale, attemptId } = await params;

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
          <div className="flex items-center gap-4 mb-4">
            <Link
              href={`/${locale}/tutor`}
              className="inline-flex items-center gap-2 text-white hover:text-secondary"
            >
              <ArrowLeft size={20} /> {t('back')}
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold text-white">
            {t('review.title')}
          </h1>
          <p className="text-gray-300 mt-2">
            {t('review.subtitle')}
          </p>
        </div>

        <TutorReviewPage 
          attemptId={attemptId} 
          locale={locale} 
          backUrl={`/${locale}/tutor`}
        />
      </div>
    </NavSidebar>
  );
}