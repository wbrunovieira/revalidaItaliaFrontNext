// src/app/[locale]/search/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import CourseCard from '@/components/CourseCard';
import {
  ArrowLeft,
  Search,
  BookOpen,
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

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q: query } = await searchParams;

  const t = await getTranslations({
    locale,
    namespace: 'Search',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333';

  let courses: Course[] = [];
  let searchError = false;

  if (query && query.trim()) {
    try {
      // Buscar cursos com progresso
      const resCourses = await fetch(
        `${apiUrl}/api/v1/courses-progress`,
        {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (resCourses.ok) {
        const allCourses: Course[] = await resCourses.json();
        
        // Filtrar cursos baseado na query
        const searchQuery = query.toLowerCase();
        courses = allCourses.filter(course => {
          // Buscar em todas as traduções
          const matchInTranslations = course.translations?.some(trans => 
            trans.title.toLowerCase().includes(searchQuery) ||
            trans.description.toLowerCase().includes(searchQuery)
          );
          
          // Buscar no slug
          const matchInSlug = course.slug.toLowerCase().includes(searchQuery);
          
          return matchInTranslations || matchInSlug;
        });
      } else {
        searchError = true;
      }
    } catch (error) {
      console.error('Search error:', error);
      searchError = true;
    }
  }

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
            {t('backToHome')}
          </Link>
        </div>

        {/* Cabeçalho */}
        <div className="px-6 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <Search size={48} className="text-white" />
            <h1 className="text-4xl lg:text-6xl font-bold text-white">
              {t('title')}
            </h1>
          </div>
          <hr className="border-t-2 border-secondary w-48 lg:w-96 mb-6" />

          {query ? (
            <div className="mb-6">
              <p className="text-xl text-gray-300">
                {t('searchingFor')}{' '}
                <span className="font-bold text-secondary">"{query}"</span>
              </p>
              <p className="text-lg text-gray-400 mt-2">
                {t('foundResults', { count: courses.length })}
              </p>
            </div>
          ) : (
            <p className="text-xl text-gray-300">
              {t('enterSearchTerm')}
            </p>
          )}
        </div>

        {/* Resultados */}
        <div className="px-6 pb-8">
          {searchError ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <Search size={40} className="text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('searchError')}
              </h3>
              <p className="text-gray-400">
                {t('tryAgainLater')}
              </p>
            </div>
          ) : query && courses.length > 0 ? (
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
          ) : query && courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                <BookOpen size={40} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('noResults')}
              </h3>
              <p className="text-gray-400">
                {t('tryDifferentSearch')}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center animate-pulse">
                <Search size={40} className="text-gray-400" />
              </div>
              <p className="text-xl text-gray-400">
                {t('startSearching')}
              </p>
            </div>
          )}
        </div>
      </div>
    </NavSidebar>
  );
}