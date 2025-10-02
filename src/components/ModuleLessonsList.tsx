'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  imageUrl?: string;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface ModuleLessonsListProps {
  lessons: Lesson[];
  currentLessonId: string;
  moduleId: string;
  courseSlug: string;
  moduleSlug: string;
  locale: string;
  courseId: string;
  initialPage?: number;
  initialTotalPages?: number;
  initialTotal?: number;
}

export default function ModuleLessonsList({
  lessons: initialLessons,
  currentLessonId,
  moduleId,
  courseSlug,
  moduleSlug,
  locale,
  courseId,
  initialPage = 1,
  initialTotalPages = 1,
  initialTotal = 0,
}: ModuleLessonsListProps) {
  const t = useTranslations('Lesson');
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const [loadingPage, setLoadingPage] = useState(false);

  // Fetch completion status for all lessons
  useEffect(() => {
    const fetchCompletionStatus = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(
          `${apiUrl}/api/v1/progress/module/${moduleId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const completed = new Set<string>();
          
          data.lessons?.forEach((lesson: { lessonId: string; completed?: boolean }) => {
            if (lesson.completed) {
              completed.add(lesson.lessonId);
            }
          });
          
          setCompletedLessons(completed);
        }
      } catch (error) {
        console.error('Error fetching lesson completion status:', error);
      }
    };

    fetchCompletionStatus();
  }, [moduleId]);

  // Listen for completion changes
  useEffect(() => {
    const handleCompletionChange = (event: CustomEvent) => {
      if (event.detail.completed) {
        setCompletedLessons(prev => new Set(prev).add(event.detail.lessonId));
      } else {
        setCompletedLessons(prev => {
          const updated = new Set(prev);
          updated.delete(event.detail.lessonId);
          return updated;
        });
      }
    };

    window.addEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);

    return () => {
      window.removeEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);
    };
  }, []);

  // Função para buscar aulas de uma página específica
  const fetchLessonsPage = useCallback(async (page: number) => {
    setLoadingPage(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons?page=${page}&limit=10`
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
  }, [currentPage, totalPages, fetchLessonsPage]);

  // Sort lessons by creation date
  const sortedLessons = [...lessons].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="mt-12">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <svg
                className="w-5 h-5 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            {t('moduleLessons')}
          </h4>
          <span className="text-xs text-gray-500">
            {completedLessons.size}/{total} {t('completed').toLowerCase()}
          </span>
        </div>
        <div className="h-0.5 w-16 bg-gradient-to-r from-secondary to-transparent rounded-full ml-11"></div>
      </div>

      <div className={`bg-primary/20 rounded-lg p-2 max-h-80 overflow-y-auto border border-secondary/20 ${loadingPage ? 'opacity-50 pointer-events-none' : ''}`}>
        <ul className="space-y-1">
          {sortedLessons.map((lesson, index) => {
            const isCurrentLesson = lesson.id === currentLessonId;
            const isCompleted = completedLessons.has(lesson.id);
            const lessonTranslation = lesson.translations.find(t => t.locale === locale);
            
            return (
              <li key={lesson.id}>
                <Link
                  href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lesson.id}`}
                  className={`
                    group flex items-center gap-3 p-2 rounded-lg text-sm transition-all duration-200
                    ${
                      isCurrentLesson
                        ? 'bg-accent-light text-white shadow-sm'
                        : isCompleted
                        ? 'text-green-400 hover:bg-primary/40 hover:text-green-300'
                        : 'text-gray-400 hover:bg-primary/40 hover:text-white'
                    }
                  `}
                >
                  <div
                    className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${
                      isCurrentLesson
                        ? 'bg-white/20'
                        : isCompleted
                        ? 'bg-green-500/20'
                        : 'bg-primary/50 group-hover:bg-secondary/30'
                    }
                  `}
                  >
                    {isCompleted ? (
                      <CheckCircle size={14} className="text-green-400" />
                    ) : (
                      index + 1 + ((currentPage - 1) * 10)
                    )}
                  </div>
                  <span className="flex-1 truncate">
                    {lessonTranslation?.title}
                  </span>
                  {isCurrentLesson && (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  )}
                  {isCompleted && !isCurrentLesson && (
                    <CheckCircle size={16} className="text-green-400 opacity-60" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between bg-primary/10 rounded-lg p-2 border border-secondary/20">
          <div className="text-xs text-gray-400">
            {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Anterior */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loadingPage}
              className="p-1 text-gray-400 hover:text-white hover:bg-primary/40 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title={t('pagination.previous')}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Input de Página */}
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
              className="w-12 px-2 py-1 bg-primary/30 border border-secondary/20 rounded text-center text-white text-xs focus:outline-none focus:ring-1 focus:ring-secondary disabled:opacity-50"
            />

            {/* Botão Próximo */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loadingPage}
              className="p-1 text-gray-400 hover:text-white hover:bg-primary/40 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title={t('pagination.next')}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-3">
          <div className="h-2 bg-primary/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
              style={{
                width: `${(completedLessons.size / total) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {Math.round((completedLessons.size / total) * 100)}% {t('completed').toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
}