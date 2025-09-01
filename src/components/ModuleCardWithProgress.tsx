'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, CheckCircle, Lock, PlayCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface ModuleData {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

interface ModuleCardWithProgressProps {
  module: ModuleData;
  courseSlug: string;
  locale: string;
  index: number;
}

interface ModuleProgress {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  completed?: boolean;
}

export default function ModuleCardWithProgress({
  module,
  courseSlug,
  locale,
  index,
}: ModuleCardWithProgressProps) {
  const t = useTranslations('Course');
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
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
        const response = await fetch(
          `${apiUrl}/api/v1/progress/module/${module.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProgress({
            totalLessons: data.totalLessons || 0,
            completedLessons: data.completedLessons || 0,
            progressPercentage: data.progressPercentage || 0,
            completed: data.progressPercentage === 100,
          });
        }
      } catch (error) {
        console.error('Error fetching module progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [module.id]);

  const translation = module.translations.find(t => t.locale === locale) || module.translations[0];
  const isCompleted = progress?.completed || false;
  const progressPercentage = progress?.progressPercentage || 0;

  return (
    <Link
      href={`/${locale}/courses/${courseSlug}/modules/${module.slug}`}
      className="group relative block"
    >
      <div className="relative bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-700 hover:border-secondary">
        {/* Completion Badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3 z-10 bg-green-500 rounded-full p-2 shadow-lg">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Module Number Badge */}
        <div className="absolute top-3 left-3 z-10 bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-bold">
          {t('moduleNumber', { number: index + 1 })}
        </div>

        {/* Image Section */}
        <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800">
          {module.imageUrl ? (
            <Image
              src={module.imageUrl}
              alt={translation.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-gray-600" />
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60" />
        </div>

        {/* Content Section */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-secondary transition-colors">
            {translation.title}
          </h3>
          
          <p className="text-sm text-gray-400 mb-4 line-clamp-2">
            {translation.description}
          </p>

          {/* Progress Section */}
          {!isLoading && progress && (
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    {t('progress')}
                  </span>
                  <span className="text-white font-medium">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2"
                  indicatorClassName={
                    isCompleted 
                      ? "bg-gradient-to-r from-green-500 to-green-400" 
                      : "bg-gradient-to-r from-secondary to-blue-500"
                  }
                />
              </div>

              {/* Lessons Count */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <PlayCircle className="w-4 h-4" />
                  <span>{progress.totalLessons} {t('lessons')}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isCompleted ? (
                    <span className="text-green-400 font-medium">
                      {t('completed')}
                    </span>
                  ) : progress.completedLessons > 0 ? (
                    <span className="text-secondary">
                      {progress.completedLessons}/{progress.totalLessons} {t('done')}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      {t('notStarted')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              <div className="h-2 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-secondary text-sm font-medium group-hover:text-white transition-colors">
                {isCompleted 
                  ? t('reviewModule')
                  : progress?.completedLessons && progress.completedLessons > 0
                  ? t('continueModule')
                  : t('startModule')
                }
              </span>
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/30 transition-colors">
                <svg
                  className="w-4 h-4 text-secondary group-hover:translate-x-0.5 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}