'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

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
}

export default function ModuleLessonsList({
  lessons,
  currentLessonId,
  moduleId,
  courseSlug,
  moduleSlug,
  locale,
}: ModuleLessonsListProps) {
  const t = useTranslations('Lesson');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

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
          
          data.lessons?.forEach((lesson: any) => {
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
            {completedLessons.size}/{sortedLessons.length} {t('completed').toLowerCase()}
          </span>
        </div>
        <div className="h-0.5 w-16 bg-gradient-to-r from-secondary to-transparent rounded-full ml-11"></div>
      </div>
      
      <div className="bg-primary/20 rounded-lg p-2 max-h-80 overflow-y-auto border border-secondary/20">
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
                      index + 1
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
      
      {/* Progress bar */}
      {sortedLessons.length > 0 && (
        <div className="mt-3">
          <div className="h-2 bg-primary/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
              style={{
                width: `${(completedLessons.size / sortedLessons.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {Math.round((completedLessons.size / sortedLessons.length) * 100)}% {t('completed').toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
}