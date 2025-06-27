// src/app/[locale]/courses/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import Card from '@/components/Card';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Award,
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
  moduleIds?: string[];
  translations?: Translation[];
  duration?: number; // em minutos
  level?: 'beginner' | 'intermediate' | 'advanced';
  enrolledCount?: number;
}

interface Module {
  id: string;
  courseId: string;
  title: string;
  lessons?: any[];
}

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations({
    locale,
    namespace: 'Courses',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333';

  // Buscar todos os cursos
  const resCourses = await fetch(`${apiUrl}/courses`, {
    cache: 'no-store',
  });

  if (!resCourses.ok) {
    throw new Error('Failed to fetch courses');
  }

  const courses: Course[] = await resCourses.json();

  // Enriquecer cursos com informações adicionais
  const enrichedCourses = courses.map(course => {
    // Estimativas padrão caso não venham da API
    const moduleCount = course.moduleIds?.length || 3; // Padrão: 3 módulos
    const estimatedHours = moduleCount * 1.5; // 1.5 horas por módulo
    const level = course.level || 'beginner'; // Nível padrão
    const enrolledCount =
      course.enrolledCount ||
      Math.floor(Math.random() * 500) + 50; // Número fictício de inscritos

    return {
      ...course,
      moduleCount,
      estimatedHours,
      level,
      enrolledCount,
    };
  });

  // Estatísticas gerais
  const totalCourses = courses.length;
  const totalModules = enrichedCourses.reduce(
    (sum, course) => sum + course.moduleCount,
    0
  );

  // Função para obter cor do nível
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Função para obter texto do nível traduzido
  const getLevelText = (level: string) => {
    return t(`level.${level}`);
  };

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Botão Voltar */}
        <div className="p-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors"
          >
            <ArrowLeft size={20} />
            {t('back')}
          </Link>
        </div>

        {/* Cabeçalho com Estatísticas */}
        <div className="px-6 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <BookOpen size={48} className="text-white" />
            <h1 className="text-4xl lg:text-6xl font-bold text-white">
              {t('title')}
            </h1>
          </div>
          <hr className="border-t-2 border-secondary w-48 lg:w-96 mb-6" />

          <p className="text-xl text-gray-300 max-w-3xl mb-8">
            {t('description')}
          </p>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl">
            <div className="bg-secondary/20 rounded-lg p-4 border border-secondary/30">
              <div className="flex items-center gap-3">
                <GraduationCap
                  size={24}
                  className="text-secondary"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('totalCourses')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {totalCourses}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/20 rounded-lg p-4 border border-secondary/30">
              <div className="flex items-center gap-3">
                <BookOpen
                  size={24}
                  className="text-secondary"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('totalModules')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {totalModules}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros de Nível (opcional) */}
          <div className="flex gap-2 mb-4">
            <span className="text-gray-400 mr-2">
              {t('filterByLevel')}:
            </span>
            {[
              'all',
              'beginner',
              'intermediate',
              'advanced',
            ].map(level => (
              <button
                key={level}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  level === 'all'
                    ? 'bg-secondary text-white'
                    : 'bg-secondary/20 text-gray-300 hover:bg-secondary/40'
                }`}
              >
                {t(`level.${level}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de Cursos */}
        <div className="px-6 pb-8">
          {enrichedCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrichedCourses.map(course => {
                const list = course.translations ?? [];
                const translation = list.find(
                  tr => tr.locale === locale
                ) ??
                  list[0] ?? { title: '', description: '' };

                return (
                  <div
                    key={course.id}
                    className="group relative transform hover:scale-105 transition-all duration-300"
                  >
                    <Card
                      name={translation.title}
                      imageUrl={course.imageUrl}
                      href={`/${locale}/courses/${course.slug}`}
                    />

                    {/* Informações adicionais */}
                    <div className="mt-3 px-2 space-y-2">
                      {translation.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {translation.description}
                        </p>
                      )}

                      <div className="flex gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {course.moduleCount}{' '}
                          {t('modules')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {course.estimatedHours.toFixed(1)}
                          h
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {/* Badge de nível */}
                      <div
                        className={`${getLevelColor(
                          course.level
                        )} text-white text-xs px-2 py-1 rounded-full`}
                      >
                        {getLevelText(course.level)}
                      </div>

                      {/* Badge de popular */}
                      {course.enrolledCount > 300 && (
                        <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Award size={12} />
                          {t('popular')}
                        </div>
                      )}
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
                {t('noCourses')}
              </p>
            </div>
          )}
        </div>
      </div>
    </NavSidebar>
  );
}
