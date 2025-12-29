'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LessonCard from '@/components/LessonCard';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Video {
  id: string;
  slug: string;
  title: string;
  providerVideoId: string;
  durationInSeconds: number;
  isSeen: boolean;
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
  video?: Video;
  // Interactive Lessons fields
  type?: 'STANDARD' | 'ENVIRONMENT_3D';
  hasAudios?: boolean;
  hasAnimations?: boolean;
  environment3dId?: string | null;
}

interface ModuleLessonsGridProps {
  lessons: Lesson[];
  moduleId: string;
  courseSlug: string;
  moduleSlug: string;
  locale: string;
  courseId: string;
  initialPage?: number;
  initialTotalPages?: number;
  initialTotal?: number;
}

export default function ModuleLessonsGrid({
  lessons: initialLessons,
  moduleId,
  courseSlug,
  moduleSlug,
  locale,
  courseId,
  initialPage = 1,
  initialTotalPages = 1,
  initialTotal = 0,
}: ModuleLessonsGridProps) {
  const t = useTranslations('Module');
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const [loadingPage, setLoadingPage] = useState(false);

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          setIsLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Fetch progress for each lesson
        const progressPromises = lessons.map(lesson =>
          fetch(`${apiUrl}/api/v1/progress/lesson/${lesson.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).then(res => res.ok ? res.json() : null)
        );

        const progressResults = await Promise.all(progressPromises);

        console.log('📊 [ModuleLessonsGrid] Progress results da API:', progressResults);

        const completed = new Set<string>();
        progressResults.forEach((progress, index) => {
          if (progress?.completed) {
            console.log(`✅ [ModuleLessonsGrid] Aula ${index + 1} (${lessons[index].id}) marcada como COMPLETA`);
            completed.add(lessons[index].id);
          }
        });

        console.log('🎯 [ModuleLessonsGrid] Total de aulas completadas:', completed.size);
        setCompletedLessons(completed);
      } catch (error) {
        console.error('Error fetching lesson completion status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletionStatus();
  }, [lessons]);

  // Listen for completion changes
  useEffect(() => {
    const handleCompletionChange = (event: CustomEvent) => {
      if (event.detail.moduleId === moduleId) {
        if (event.detail.completed) {
          setCompletedLessons(prev => new Set(prev).add(event.detail.lessonId));
        } else {
          setCompletedLessons(prev => {
            const updated = new Set(prev);
            updated.delete(event.detail.lessonId);
            return updated;
          });
        }
      }
    };

    window.addEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);

    return () => {
      window.removeEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);
    };
  }, [moduleId]);

  // Função para buscar aulas de uma página específica
  const fetchLessonsPage = useCallback(async (page: number) => {
    setLoadingPage(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons?page=${page}&limit=10&includeVideo=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }

      const data = await response.json();

      setLessons(data.lessons || []);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoadingPage(false);
    }
  }, [courseId, moduleId]);

  // Handler para mudança de página
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    fetchLessonsPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, totalPages, fetchLessonsPage]);

  const sortedLessons = [...lessons].sort(
    (a, b) => a.order - b.order || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedLessons.map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-700 rounded-lg h-48"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid de Aulas */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${loadingPage ? 'opacity-50 pointer-events-none' : ''}`}>
        {sortedLessons.map((lesson, index) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            courseSlug={courseSlug}
            moduleSlug={moduleSlug}
            courseId={courseId}
            moduleId={moduleId}
            locale={locale}
            index={index + ((currentPage - 1) * 10)}
            totalLessons={total}
            isCompleted={completedLessons.has(lesson.id)}
          />
        ))}
      </div>

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400">
            {t('pagination.showing')} {sortedLessons.length} {t('pagination.of')} {total} {t('pagination.lessons')}
          </div>

          <div className="flex items-center gap-3">
            {/* Botão Anterior */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loadingPage}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title={t('pagination.previous')}
            >
              <ChevronLeft size={20} />
            </button>

            {/* Input de Página */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">{t('pagination.page')}</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    handlePageChange(page);
                  }
                }}
                disabled={loadingPage}
                className="w-16 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-center text-white focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
              />
              <span className="text-gray-400">{t('pagination.of')} {totalPages}</span>
            </div>

            {/* Botão Próximo */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loadingPage}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title={t('pagination.next')}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}