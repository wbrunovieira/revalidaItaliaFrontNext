// src/app/[locale]/access-denied/page.tsx

import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ShieldX, Lock, Calendar, ArrowLeft, Home } from 'lucide-react';

interface AccessDeniedPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    reason?: string;
    course?: string;
    module?: string;
    days?: string;
  }>;
}

export default async function AccessDeniedPage({
  params,
  searchParams,
}: AccessDeniedPageProps) {
  const { locale } = await params;
  const { reason, course, days } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'AccessDenied' });

  // Determinar o tipo de erro
  const isNotEnrolled = reason === 'not-enrolled' || reason === 'course-access-denied';
  const isModuleLocked = reason === 'module-locked';
  const isAccessExpired = reason === 'access-expired';

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Card principal */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-700">
          {/* Ícone */}
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${
              isModuleLocked
                ? 'bg-yellow-500/20'
                : isAccessExpired
                ? 'bg-orange-500/20'
                : 'bg-red-500/20'
            }`}>
              {isModuleLocked ? (
                <Lock size={48} className="text-yellow-400" />
              ) : isAccessExpired ? (
                <Calendar size={48} className="text-orange-400" />
              ) : (
                <ShieldX size={48} className="text-red-400" />
              )}
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white text-center mb-4">
            {isModuleLocked
              ? t('moduleLocked.title')
              : isAccessExpired
              ? t('accessExpired.title')
              : t('notEnrolled.title')
            }
          </h1>

          {/* Descrição */}
          <p className="text-gray-400 text-center mb-6">
            {isModuleLocked
              ? t('moduleLocked.description', { days: days || '0' })
              : isAccessExpired
              ? t('accessExpired.description')
              : t('notEnrolled.description')
            }
          </p>

          {/* Informação adicional para módulo bloqueado */}
          {isModuleLocked && days && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="text-yellow-400 flex-shrink-0" size={24} />
                <div>
                  <p className="text-yellow-400 font-medium">
                    {t('moduleLocked.availableIn')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {days} {t('moduleLocked.days')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-3">
            {course ? (
              <Link
                href={`/${locale}/courses/${course}`}
                className="flex items-center justify-center gap-2 bg-secondary text-primary font-semibold py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors"
              >
                <ArrowLeft size={20} />
                {t('backToCourse')}
              </Link>
            ) : null}

            <Link
              href={`/${locale}`}
              className="flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Home size={20} />
              {t('backToHome')}
            </Link>

            {isNotEnrolled && (
              <Link
                href={`/${locale}/courses`}
                className="flex items-center justify-center gap-2 text-secondary hover:text-secondary/80 transition-colors py-2"
              >
                {t('viewCourses')}
              </Link>
            )}
          </div>
        </div>

        {/* Texto de ajuda */}
        <p className="text-gray-500 text-sm text-center mt-6">
          {t('needHelp')}{' '}
          <Link href={`/${locale}/support`} className="text-secondary hover:underline">
            {t('contactSupport')}
          </Link>
        </p>
      </div>
    </div>
  );
}
