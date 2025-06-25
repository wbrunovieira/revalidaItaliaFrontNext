// src/app/[locale]/courses/[slug]/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import Card from '@/components/Card';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Play,
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

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // Carrega apenas tCourse, descartando tDashboard
  const [, tCourse] = await Promise.all([
    getTranslations({ locale, namespace: 'Dashboard' }),
    getTranslations({ locale, namespace: 'Course' }),
  ]);

  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  // Buscar curso e módulos
  const resCourses = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/courses`,
    { cache: 'no-store' }
  );
  if (!resCourses.ok)
    throw new Error('Failed to fetch courses');
  const allCourses: Course[] = await resCourses.json();
  const courseFound =
    allCourses.find(c => c.slug === slug) ?? notFound();

  const resModules = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseFound.id}/modules`,
    { cache: 'no-store' }
  );
  if (!resModules.ok)
    throw new Error('Failed to fetch modules');
  const courseModules: ModuleData[] =
    await resModules.json();

  // Traduções do curso
  const courseTrans =
    courseFound.translations.find(
      tr => tr.locale === locale
    ) ?? courseFound.translations[0];

  // Cálculos de estatísticas
  const totalModules = courseModules.length;
  const estHours = (totalModules * 1.5).toFixed(1);

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Voltar */}
        <div className="p-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors"
          >
            <ArrowLeft size={20} />
            {tCourse('back')}
          </Link>
        </div>

        {/* Header do curso */}
        <div className="px-6 pb-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="relative w-full lg:w-96 h-64 rounded-lg overflow-hidden">
              <Image
                src={courseFound.imageUrl}
                alt={courseTrans.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                {courseTrans.title}
              </h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                {courseTrans.description}
              </p>
              <div className="flex gap-6 text-white">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} />
                  <span>
                    {totalModules} {tCourse('modules')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span>
                    {tCourse('estimated', {
                      hours: estHours,
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Play size={20} />
                  <span>{tCourse('level.beginner')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de módulos */}
        <div className="px-6 pb-8">
          <div className="flex items-center gap-4 mb-6">
            <BookOpen size={32} className="text-white" />
            <h2 className="text-3xl font-bold text-white">
              {tCourse('modulesInCourse')}
            </h2>
          </div>
          <hr className="border-t-2 border-secondary w-32 mb-8" />

          {courseModules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseModules
                .sort((a, b) => a.order - b.order)
                .map(moduleData => {
                  const modTrans =
                    moduleData.translations.find(
                      tr => tr.locale === locale
                    ) ?? moduleData.translations[0];
                  return (
                    <div
                      key={moduleData.id}
                      className="relative"
                    >
                      <div className="absolute -top-2 -left-2 bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10">
                        {moduleData.order}
                      </div>
                      <Card
                        name={modTrans.title}
                        imageUrl={
                          moduleData.imageUrl ||
                          courseFound.imageUrl
                        }
                        href={`/${locale}/courses/${slug}/modules/${moduleData.slug}`}
                      />
                      <div className="mt-2 text-center">
                        <span className="text-xs text-gray-400">
                          {tCourse('moduleOrder', {
                            order: moduleData.order,
                            total: totalModules,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-xl text-gray-400">
                {tCourse('noModules')}
              </p>
            </div>
          )}
        </div>

        {/* Iniciar curso */}
        {courseModules.length > 0 && (
          <div className="px-6 pb-8">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl">
              <h3 className="text-xl font-bold text-white mb-4">
                {tCourse('startCourse')}
              </h3>
              <p className="text-gray-300 mb-4">
                {tCourse('startCourseDescription')}
              </p>
              <Link
                href={`/${locale}/courses/${slug}/modules/${
                  courseModules.sort(
                    (a, b) => a.order - b.order
                  )[0].slug
                }`}
                className="bg-secondary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors inline-flex items-center gap-2"
              >
                <Play size={20} />{' '}
                {tCourse('startFirstModule')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </NavSidebar>
  );
}
