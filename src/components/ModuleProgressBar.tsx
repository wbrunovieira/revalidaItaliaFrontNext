'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, Clock, BookOpen, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ModuleProgressBarProps {
  moduleId: string;
  totalLessons?: number;
}

interface ProgressData {
  type: string;
  id: string;
  userId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastAccessAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export default function ModuleProgressBar({ 
  moduleId,
  totalLessons: initialTotalLessons = 0 
}: ModuleProgressBarProps) {
  const t = useTranslations('Module');
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
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
          `${apiUrl}/api/v1/progress/module/${moduleId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProgressData(data);
        }
      } catch (error) {
        console.error('Error fetching module progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [moduleId]);

  // Listen for lesson completion changes
  useEffect(() => {
    const handleCompletionChange = async (event: CustomEvent) => {
      if (event.detail.moduleId === moduleId) {
        // Re-fetch progress when a lesson is completed/uncompleted
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) return;

        try {
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
            setProgressData(data);
          }
        } catch (error) {
          console.error('Error updating module progress:', error);
        }
      }
    };

    window.addEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);
    
    return () => {
      window.removeEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);
    };
  }, [moduleId]);

  if (isLoading) {
    return (
      <div className="bg-primary/20 rounded-lg p-6 border border-secondary/20 animate-pulse">
        <div className="h-4 bg-primary/40 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-primary/40 rounded mb-4"></div>
        <div className="h-2 bg-primary/40 rounded"></div>
      </div>
    );
  }

  const totalLessons = progressData?.totalLessons || initialTotalLessons;
  const completedLessons = progressData?.completedLessons || 0;
  const progressPercentage = progressData?.progressPercentage || 0;
  const isCompleted = progressPercentage === 100;

  return (
    <div className="bg-primary/20 rounded-lg p-6 border border-secondary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <Trophy className="w-6 h-6 text-yellow-400" />
          ) : (
            <BookOpen className="w-6 h-6 text-secondary" />
          )}
          <h3 className="text-lg font-semibold text-white">
            {t('progress')}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          {progressData?.lastAccessAt ? (
            <span>
              {t('lastAccess')}: {new Date(progressData.lastAccessAt).toLocaleDateString()}
            </span>
          ) : (
            <span>{t('notStarted')}</span>
          )}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {completedLessons}
          </div>
          <div className="text-xs text-gray-400">
            {t('completedLessons')}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {totalLessons - completedLessons}
          </div>
          <div className="text-xs text-gray-400">
            {t('remainingLessons')}
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {Math.round(progressPercentage)}%
          </div>
          <div className="text-xs text-gray-400">
            {t('completed')}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            {t('overallProgress')}
          </span>
          <span className="text-white font-medium">
            {completedLessons} / {totalLessons} {t('lessons')}
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-3"
          indicatorClassName={isCompleted ? "bg-gradient-to-r from-yellow-500 to-yellow-400" : "bg-gradient-to-r from-green-600 to-green-500"}
        />
      </div>

      {/* Completion Status */}
      {isCompleted && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">
              {t('moduleCompleted')}
            </span>
          </div>
          {progressData?.completedAt && (
            <p className="text-xs text-gray-400 mt-1 ml-7">
              {t('completedOn')}: {new Date(progressData.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Motivation Message */}
      {!isCompleted && completedLessons > 0 && (
        <div className="mt-4 p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
          <p className="text-sm text-secondary">
            {completedLessons === 1 
              ? t('motivationSingular')
              : t('motivationPlural', { count: totalLessons - completedLessons })
            }
          </p>
        </div>
      )}
    </div>
  );
}