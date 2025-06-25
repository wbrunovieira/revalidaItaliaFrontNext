// src/app/[locale]/courses/[slug]/modules/[moduleSlug]/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import {
  ArrowLeft,
  Clock,
  Play,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface Translation {
  locale: string;
  title: string;
  description: string;
}
interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}
interface ModuleData {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}
interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}
interface LessonsResponse {
  lessons: Lesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{
    locale: string;
    slug: string;
    moduleSlug: string;
  }>;
}) {
  const { locale, slug, moduleSlug } = await params;

  // Carrega apenas tModule, não tCourse
  const [, tModule] = await Promise.all([
    getTranslations({ locale, namespace: 'Course' }),
    getTranslations({ locale, namespace: 'Module' }),
  ]);

  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  // Buscar cursos e módulo
  const coursesRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/courses`,
    { cache: 'no-store' }
  );
  if (!coursesRes.ok)
    throw new Error('Failed to fetch courses');
  const courses: Course[] = await coursesRes.json();
  const courseFound =
    courses.find(c => c.slug === slug) ?? notFound();

  const modulesRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseFound.id}/modules`,
    { cache: 'no-store' }
  );
  if (!modulesRes.ok)
    throw new Error('Failed to fetch modules');
  const moduleFound: ModuleData[] = await modulesRes.json();
  const moduleData =
    moduleFound.find(m => m.slug === moduleSlug) ??
    notFound();

  const lessonsRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseFound.id}/modules/${moduleData.id}/lessons`,
    { cache: 'no-store' }
  );
  if (!lessonsRes.ok)
    throw new Error('Failed to fetch lessons');
  const { lessons }: LessonsResponse =
    await lessonsRes.json();

  // Traduções
  const courseTrans =
    courseFound.translations.find(
      tr => tr.locale === locale
    ) ?? courseFound.translations[0];
  const moduleTrans =
    moduleData.translations.find(
      tr => tr.locale === locale
    ) ?? moduleData.translations[0];

  // Estimativas
  const totalLessons = lessons.length;
  const estMinutes = totalLessons * 15;
  const estHours = (estMinutes / 60).toFixed(1);

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Cabeçalho com breadcrumbs */}
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
            <Link
              href={`/${locale}`}
              className="hover:text-secondary"
            >
              {tModule('breadcrumb.dashboard')}
            </Link>
            <ChevronRight size={16} />
            <Link
              href={`/${locale}/courses/${slug}`}
              className="hover:text-secondary"
            >
              {courseTrans.title}
            </Link>
            <ChevronRight size={16} />
            <span className="text-secondary">
              {moduleTrans.title}
            </span>
          </div>
          <Link
            href={`/${locale}/courses/${slug}`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary"
          >
            <ArrowLeft size={20} /> {tModule('back')}
          </Link>
        </div>

        {/* Detalhes do módulo */}
        <div className="px-6 pb-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="relative w-full lg:w-96 h-64 rounded-lg overflow-hidden">
              <Image
                src={
                  moduleData.imageUrl ||
                  courseFound.imageUrl
                }
                alt={moduleTrans.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center bg-secondary text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4">
                {tModule('moduleNumber', {
                  number: moduleData.order,
                })}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                {moduleTrans.title}
              </h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                {moduleTrans.description}
              </p>
              <div className="flex gap-6 text-white">
                <div className="flex items-center gap-2">
                  <Play size={20} />{' '}
                  <span>
                    {totalLessons} {tModule('lessons')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} />{' '}
                  <span>
                    {tModule('estimated', {
                      hours: estHours,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de aulas */}
        <div className="px-6 pb-8">
          <div className="flex items-center gap-4 mb-6">
            <Play size={32} className="text-white" />
            <h2 className="text-3xl font-bold text-white">
              {tModule('lessonsInModule')}
            </h2>
          </div>
          <hr className="border-t-2 border-secondary w-32 mb-8" />

          {lessons.length > 0 ? (
            <div className="space-y-4 max-w-4xl">
              {lessons
                .sort((a, b) => a.order - b.order)
                .map(lesson => {
                  const lt =
                    lesson.translations.find(
                      tr => tr.locale === locale
                    ) ?? lesson.translations[0];
                  return (
                    <Link
                      key={lesson.id}
                      href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lesson.id}`}
                      className="block bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="bg-secondary text-primary w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                            {lesson.order}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white group-hover:text-secondary transition-colors">
                              {lt.title}
                            </h3>
                            <p className="text-gray-400 text-sm mt-1">
                              {lt.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} /> ~15 min
                              </span>
                              <span>
                                {tModule('lessonOrder', {
                                  order: lesson.order,
                                  total: totalLessons,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-400 group-hover:text-secondary transition-colors">
                          <Play size={24} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-xl text-gray-400">
                {tModule('noLessons')}
              </p>
            </div>
          )}
        </div>

        {/* Iniciar primeira aula */}
        {lessons.length > 0 && (
          <div className="px-6 pb-8">
            <div className="bg-gray-800 rounded-lg p-6 max-w-4xl">
              <h3 className="text-lg font-bold text-white mb-4">
                {tModule('startModule')}
              </h3>
              <p className="text-gray-300 mb-4">
                {tModule('startModuleDescription')}
              </p>
              <Link
                href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${
                  lessons.sort(
                    (a, b) => a.order - b.order
                  )[0].id
                }`}
                className="bg-secondary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors inline-flex items-center gap-2"
              >
                <Play size={20} />{' '}
                {tModule('startFirstLesson')}
              </Link>
            </div>
          </div>
        )}

        {/* Navegação entre módulos */}
        <div className="px-6 pb-8">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {tModule('moduleNavigation')}
            </h3>
            <div className="flex justify-between items-center">
              {moduleData.order > 1 && (
                <div className="text-left">
                  <p className="text-sm text-gray-400 mb-1">
                    {tModule('previousModule')}
                  </p>
                  <p className="text-white font-semibold">
                    {tModule('moduleNumber', {
                      number: moduleData.order - 1,
                    })}
                  </p>
                </div>
              )}
              <div className="flex-1" />
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">
                  {tModule('nextModule')}
                </p>
                <p className="text-white font-semibold">
                  {tModule('moduleNumber', {
                    number: moduleData.order + 1,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavSidebar>
  );
}
