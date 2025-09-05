// src/app/[locale]/courses/page.tsx

import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import CourseCard from '@/components/CourseCard';
import CourseCardSkeleton from '@/components/CourseCardSkeleton';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Layers,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface CourseProgress {
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  moduleCount: number;
  translations?: Translation[];
  progress?: CourseProgress;
}

// interface Module {
//   id: string;
//   courseId: string;
//   title: string;
//   lessons?: any[];
// }

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

  // Buscar todos os cursos com progresso
  const resCourses = await fetch(`${apiUrl}/api/v1/courses-progress`, {
    cache: 'no-store',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!resCourses.ok) {
    throw new Error('Failed to fetch courses with progress');
  }

  const courses: Course[] = await resCourses.json();

  // Estatísticas gerais
  const totalCourses = courses.length;
  const totalModules = courses.reduce((sum, course) => sum + (course.moduleCount || 0), 0);
  const completedCourses = courses.filter(course => course.progress?.percentage === 100).length;
  const inProgressCourses = courses.filter(course => 
    course.progress && course.progress.percentage > 0 && course.progress.percentage < 100
  ).length;

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl">
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
            
            <div className="bg-[#79BED9]/20 rounded-lg p-4 border border-[#79BED9]/30">
              <div className="flex items-center gap-3">
                <Layers
                  size={24}
                  className="text-[#79BED9]"
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
            
            <div className="bg-green-600/20 rounded-lg p-4 border border-green-600/30">
              <div className="flex items-center gap-3">
                <CheckCircle
                  size={24}
                  className="text-green-400"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('completedCourses')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {completedCourses}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#8BCAD9]/20 rounded-lg p-4 border border-[#8BCAD9]/30">
              <div className="flex items-center gap-3">
                <Clock
                  size={24}
                  className="text-[#8BCAD9]"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('inProgress')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {inProgressCourses}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Cursos */}
        <div className="px-6 pb-8">
          <Suspense 
            fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <CourseCardSkeleton count={6} />
              </div>
            }
          >
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    locale={locale}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center animate-float">
                  <BookOpen
                    size={40}
                    className="text-gray-400"
                  />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {t('noCourses')}
                </h3>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </NavSidebar>
  );
}
