// src/app/[locale]/courses/[slug]/modules/[moduleSlug]/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import ModuleProgressBar from '@/components/ModuleProgressBar';
import ModuleLessonsGrid from '@/components/ModuleLessonsGrid';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
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
  slug: string;
  moduleId: string;
  order: number;
  imageUrl?: string | null;
  videoId?: string;
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
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`,
    { cache: 'no-store' }
  );
  if (!coursesRes.ok)
    throw new Error('Failed to fetch courses');
  const courses: Course[] = await coursesRes.json();
  const courseFound =
    courses.find(c => c.slug === slug) ?? notFound();

  const modulesRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseFound.id}/modules`,
    { cache: 'no-store' }
  );
  if (!modulesRes.ok)
    throw new Error('Failed to fetch modules');
  const moduleFound: ModuleData[] = await modulesRes.json();
  const moduleData =
    moduleFound.find(m => m.slug === moduleSlug) ??
    notFound();

  const lessonsRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseFound.id}/modules/${moduleData.id}/lessons`,
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

  // Total de aulas
  const totalLessons = lessons.length;

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
            <div className="relative w-full lg:w-96 h-64 rounded-lg overflow-hidden shadow-xl border-l-[10px] border-neutral">
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
              </div>
            </div>
          </div>
        </div>

        {/* Module Progress Bar */}
        <div className="px-6 pb-8">
          <div className="max-w-4xl">
            <ModuleProgressBar 
              moduleId={moduleData.id}
              totalLessons={totalLessons}
            />
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
            <ModuleLessonsGrid
              lessons={sortedLessons}
              moduleId={moduleData.id}
              courseSlug={slug}
              moduleSlug={moduleSlug}
              locale={locale}
            />
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
                  href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${sortedLessons[0].slug || sortedLessons[0].id}`}
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
            {/* Timeline Visual */}
            <div className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                <div className="flex items-center justify-between relative">
                  {/* Linha conectora de fundo */}
                  <div className="absolute top-6 left-0 right-0 h-[2px] bg-gray-700"></div>
                  
                  {/* Módulos */}
                  {moduleFound.map((mod, idx) => {
                    const modTrans = mod.translations.find(t => t.locale === locale) || mod.translations[0];
                    const isCompleted = idx < moduleData.order - 1; // Módulos anteriores completos
                    const isCurrent = mod.id === moduleData.id;
                    
                    return (
                      <div key={mod.id} className="relative z-10 flex flex-col items-center">
                        {/* Indicador "Você está aqui" */}
                        {isCurrent && (
                          <div className="absolute -top-8 whitespace-nowrap">
                            <div className="bg-secondary text-primary text-xs px-2 py-1 rounded-full font-semibold animate-pulse">
                              ↓ {tModule('youAreHere')}
                            </div>
                          </div>
                        )}
                        
                        {/* Link do módulo */}
                        <Link
                          href={`/${locale}/courses/${slug}/modules/${mod.slug}`}
                          className="group transition-all duration-300"
                        >
                          {/* Círculo do módulo */}
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                            transition-all duration-300 border-2
                            ${isCompleted 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : isCurrent
                              ? 'bg-secondary border-secondary text-primary animate-pulse'
                              : 'bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600 hover:border-gray-500'
                            }
                            group-hover:scale-110 group-hover:shadow-lg
                          `}>
                            {mod.order}
                          </div>
                          
                          {/* Título do módulo */}
                          <div className={`
                            mt-2 text-center max-w-[100px]
                            ${isCurrent ? 'text-white font-semibold' : 'text-gray-400'}
                            group-hover:text-white
                          `}>
                            <p className="text-xs truncate">{modTrans.title}</p>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
                
                {/* Linha de progresso */}
                <div 
                  className="absolute top-6 left-0 h-[2px] bg-green-500 transition-all duration-500"
                  style={{ 
                    width: `${((moduleData.order - 1) / (moduleFound.length - 1)) * 100}%` 
                  }}
                ></div>
              </div>
              
              {/* Navegação rápida anterior/próximo */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                {moduleData.order > 1 ? (
                  <Link
                    href={`/${locale}/courses/${slug}/modules/${moduleFound[moduleData.order - 2].slug}`}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                  >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm">{tModule('previousModule')}</span>
                  </Link>
                ) : null}
                
                {moduleData.order < moduleFound.length ? (
                  <Link
                    href={`/${locale}/courses/${slug}/modules/${moduleFound[moduleData.order].slug}`}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                  >
                    <span className="text-sm">{tModule('nextModule')}</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </NavSidebar>
  );
}
