'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, BookOpen, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CourseProgressBarProps {
  courseId: string;
  totalModules?: number;
}

interface ProgressData {
  type: string;
  id: string;
  userId: string;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastAccessAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export default function CourseProgressBar({ 
  courseId,
  totalModules: initialTotalModules = 0 
}: CourseProgressBarProps) {
  const t = useTranslations('Course');
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
          `${apiUrl}/api/v1/progress/course/${courseId}`,
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
        console.error('Error fetching course progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [courseId]);

  // Listen for lesson completion changes to refresh
  useEffect(() => {
    const handleCompletionChange = async () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) return;

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(
          `${apiUrl}/api/v1/progress/course/${courseId}`,
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
        console.error('Error updating course progress:', error);
      }
    };

    window.addEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);
    
    return () => {
      window.removeEventListener('lessonCompletionChanged', handleCompletionChange as EventListener);
    };
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-secondary/20 animate-pulse">
        <div className="h-4 bg-primary/40 rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-primary/40 rounded mb-4"></div>
        <div className="h-2 bg-primary/40 rounded"></div>
      </div>
    );
  }

  const totalModules = initialTotalModules || progressData?.totalModules || 0;
  const completedModules = progressData?.completedModules || 0;
  const totalLessons = progressData?.totalLessons || 0;
  const completedLessons = progressData?.completedLessons || 0;
  const progressPercentage = progressData?.progressPercentage || 0;
  const isCompleted = progressPercentage === 100;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-secondary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
          ) : (
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Target className="w-6 h-6 text-secondary" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">
              {t('courseProgress')}
            </h3>
            {progressData?.startedAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                {t('startedOn')}: {new Date(progressData.startedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {Math.round(progressPercentage)}%
          </div>
          <div className="text-xs text-gray-400">
            {t('overall')}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-secondary" />
            <span className="text-xs text-gray-400">{t('modules')}</span>
          </div>
          <div className="text-xl font-bold text-white">
            {completedModules}/{totalModules}
          </div>
          <div className="text-xs text-gray-500">
            {t('completed')}
          </div>
        </div>

        <div className="bg-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">{t('lessons')}</span>
          </div>
          <div className="text-xl font-bold text-white">
            {completedLessons}/{totalLessons}
          </div>
          <div className="text-xs text-gray-500">
            {t('completed')}
          </div>
        </div>

        <div className="bg-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">{t('remaining')}</span>
          </div>
          <div className="text-xl font-bold text-white">
            {totalLessons - completedLessons}
          </div>
          <div className="text-xs text-gray-500">
            {t('lessonsLeft')}
          </div>
        </div>

        <div className="bg-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">{t('achievement')}</span>
          </div>
          <div className="text-xl font-bold text-white">
            {completedModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0}%
          </div>
          <div className="text-xs text-gray-500">
            {t('modulesComplete')}
          </div>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">
            {t('overallProgress')}
          </span>
          <span className="text-white font-medium">
            {completedLessons} {t('of')} {totalLessons} {t('lessonsCompleted')}
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-4"
          indicatorClassName={
            isCompleted 
              ? "bg-gradient-to-r from-yellow-500 to-yellow-400" 
              : progressPercentage > 75
              ? "bg-gradient-to-r from-green-600 to-green-500"
              : progressPercentage > 50
              ? "bg-gradient-to-r from-blue-600 to-blue-500"
              : progressPercentage > 25
              ? "bg-gradient-to-r from-purple-600 to-purple-500"
              : "bg-gradient-to-r from-gray-600 to-gray-500"
          }
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Completion Status or Motivation */}
      {isCompleted ? (
        <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-400/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <p className="font-semibold text-yellow-400">
                {t('courseCompleted')}
              </p>
              {progressData?.completedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  {t('completedOn')}: {new Date(progressData.completedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : progressPercentage > 0 && (
        <div className="p-4 bg-gradient-to-r from-secondary/10 to-blue-500/10 border border-secondary/20 rounded-lg">
          <p className="text-sm text-secondary">
            {progressPercentage >= 75 
              ? t('almostThere')
              : progressPercentage >= 50
              ? t('halfwayThere')
              : progressPercentage >= 25
              ? t('goodStart')
              : t('keepGoing')
            }
          </p>
        </div>
      )}
    </div>
  );
}