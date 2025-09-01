// src/app/[locale]/courses/[slug]/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import ModuleCard from '@/components/ModuleCard';
import CourseProgressBar from '@/components/CourseProgressBar';
import ModuleCardWithProgress from '@/components/ModuleCardWithProgress';
import {
  ArrowLeft,
  BookOpen,
  Clock,
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
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`,
    { cache: 'no-store' }
  );
  if (!resCourses.ok)
    throw new Error('Failed to fetch courses');
  const allCourses: Course[] = await resCourses.json();
  const courseFound =
    allCourses.find(c => c.slug === slug) ?? notFound();

  const resModules = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseFound.id}/modules`,
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

  // Ordenar módulos uma vez
  const sortedModules = courseModules.sort(
    (a, b) => a.order - b.order
  );

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Voltar */}
        <div className="p-6">
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors"
          >
            <ArrowLeft size={20} />
            {tCourse('back')}
          </Link>
        </div>

        {/* Header do curso */}
        <div className="px-6 pb-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="relative w-full lg:w-96 h-64 rounded-lg overflow-hidden shadow-xl">
              <Image
                src={courseFound.imageUrl}
                alt={courseTrans.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
              </div>
            </div>
          </div>
        </div>

        {/* Course Progress Bar */}
        <div className="px-6 pb-8">
          <CourseProgressBar 
            courseId={courseFound.id}
            totalModules={totalModules}
          />
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

          {sortedModules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedModules.map((moduleData, index) => (
                <ModuleCardWithProgress
                  key={moduleData.id}
                  module={moduleData}
                  courseSlug={slug}
                  locale={locale}
                  index={index}
                />
              ))}
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
        {sortedModules.length > 0 && (
          <div className="px-6 pb-8">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-8 max-w-2xl shadow-xl border border-gray-700 relative overflow-hidden">
              {/* Padrão de fundo decorativo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl" />

              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-secondary rounded-full" />
                  {tCourse('startCourse')}
                </h3>
                <p className="text-gray-300 mb-6 text-lg">
                  {tCourse('startCourseDescription')}
                </p>
                <Link
                  href={`/${locale}/courses/${slug}/modules/${sortedModules[0].slug}`}
                  className="group relative bg-secondary text-primary px-8 py-4 rounded-lg font-semibold transition-all duration-300 inline-flex items-center gap-3 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden"
                >
                  {/* Efeito de overlay no hover */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

                  {/* Efeito de shine/sweep */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />

                  <Play
                    size={24}
                    className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                  />
                  <span className="relative z-10 text-lg">
                    {tCourse('startFirstModule')}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </NavSidebar>
  );
}
