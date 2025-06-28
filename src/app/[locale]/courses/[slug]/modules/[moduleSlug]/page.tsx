// src/app/[locale]/courses/[slug]/modules/[moduleSlug]/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import {
  ArrowLeft,
  Clock,
  ChevronRight,
  PlayCircle,
  Video,
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

  // Ordenar aulas uma vez
  const sortedLessons = lessons.sort(
    (a, b) => a.order - b.order
  );

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Cabeçalho com breadcrumbs */}
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
            <Link
              href={`/${locale}`}
              className="hover:text-secondary transition-colors"
            >
              {tModule('breadcrumb.dashboard')}
            </Link>
            <ChevronRight size={16} />
            <Link
              href={`/${locale}/courses/${slug}`}
              className="hover:text-secondary transition-colors"
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
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors"
          >
            <ArrowLeft size={20} /> {tModule('back')}
          </Link>
        </div>

        {/* Detalhes do módulo */}
        <div className="px-6 pb-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="relative w-full lg:w-96 h-64 rounded-lg overflow-hidden shadow-xl">
              <Image
                src={
                  moduleData.imageUrl ||
                  courseFound.imageUrl
                }
                alt={moduleTrans.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
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
                  <Video size={20} />
                  <span>
                    {totalLessons} {tModule('videoLessons')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} />
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
            <PlayCircle size={32} className="text-white" />
            <h2 className="text-3xl font-bold text-white">
              {tModule('videoLessonsInModule')}
            </h2>
          </div>
          <hr className="border-t-2 border-secondary w-32 mb-8" />

          {sortedLessons.length > 0 ? (
            <div className="space-y-4 max-w-4xl">
              {sortedLessons.map((lesson, index) => {
                const lt =
                  lesson.translations.find(
                    tr => tr.locale === locale
                  ) ?? lesson.translations[0];
                const isCompleted = false; // Você pode implementar lógica de progresso aqui

                return (
                  <Link
                    key={lesson.id}
                    href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lesson.id}`}
                    className="block relative bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all duration-300 cursor-pointer group overflow-hidden"
                  >
                    {/* Indicador de hover lateral */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <div
                            className={`
                            w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                            ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-secondary/20 text-secondary border-2 border-secondary group-hover:bg-secondary group-hover:text-primary'
                            }
                          `}
                          >
                            {index + 1}
                          </div>
                          {/* Anel pulsante no hover */}
                          {!isCompleted && (
                            <div className="absolute inset-0 rounded-full bg-secondary animate-ping opacity-0 group-hover:opacity-30" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-secondary transition-colors flex items-center gap-2">
                            {lt.title}
                            <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              {tModule('clickToWatch')}
                            </span>
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
                      <div className="relative">
                        {/* Ícone de play grande */}
                        <div className="text-gray-400 group-hover:text-secondary transition-all duration-300 group-hover:scale-110">
                          <PlayCircle size={40} />
                        </div>
                        {/* Efeito de pulse no ícone */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-secondary/20 animate-ping opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    </div>

                    {/* Overlay gradient no hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <PlayCircle
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
        {sortedLessons.length > 0 && (
          <div className="px-6 pb-8">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-8 max-w-4xl shadow-xl border border-gray-700 relative overflow-hidden">
              {/* Padrão decorativo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 bg-secondary rounded-full" />
                  {tModule('startModule')}
                </h3>
                <p className="text-gray-300 mb-6">
                  {tModule('startModuleDescription')}
                </p>
                <Link
                  href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${sortedLessons[0].id}`}
                  className="group relative bg-secondary text-primary px-8 py-4 rounded-lg font-semibold inline-flex items-center gap-3 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 overflow-hidden"
                >
                  {/* Efeito de overlay */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

                  {/* Efeito de shine */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />

                  <PlayCircle
                    size={24}
                    className="relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                  />
                  <span className="relative z-10 text-lg">
                    {tModule('watchFirstVideo')}
                  </span>
                </Link>
              </div>
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
                <Link
                  href="#"
                  className="text-left group hover:scale-105 transition-transform"
                >
                  <p className="text-sm text-gray-400 mb-1 group-hover:text-gray-300">
                    {tModule('previousModule')}
                  </p>
                  <p className="text-white font-semibold group-hover:text-secondary transition-colors">
                    {tModule('moduleNumber', {
                      number: moduleData.order - 1,
                    })}
                  </p>
                </Link>
              )}
              <div className="flex-1" />
              {moduleData.order < moduleFound.length && (
                <Link
                  href="#"
                  className="text-right group hover:scale-105 transition-transform"
                >
                  <p className="text-sm text-gray-400 mb-1 group-hover:text-gray-300">
                    {tModule('nextModule')}
                  </p>
                  <p className="text-white font-semibold group-hover:text-secondary transition-colors">
                    {tModule('moduleNumber', {
                      number: moduleData.order + 1,
                    })}
                  </p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </NavSidebar>
  );
}
