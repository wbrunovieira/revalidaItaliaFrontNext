'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  BookOpen,
  GraduationCap,
  Brain,
  CheckCircle,
  Activity,
  Calendar,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface CourseProgress {
  id: string;
  title: string;
  slug: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

interface UserProgress {
  overview: {
    lastActivityAt?: string;
    memberSince: string;
    daysActive: number;
  };
  coursesProgress: {
    totalCourses: number;
    coursesInProgress: number;
    completedCourses: number;
    notStartedCourses: number;
    averageProgress: number;
    totalLessons: number;
    completedLessons: number;
    lessonsCompletionRate: number;
  };
  tracksProgress: {
    totalTracks: number;
    completedTracks: number;
    tracksInProgress: number;
    mostAdvancedTrack?: {
      id: string;
      title: string;
      progress: number;
    };
  };
  flashcardsStats: {
    totalAnswered: number;
    correctAnswers: number;
    accuracy: number;
    todayCompleted: boolean;
    lastReviewDate?: string;
  };
}

// Componente de progresso circular
function CircularProgress({ 
  percentage, 
  size = 60, 
  strokeWidth = 4,
  showLabel = true 
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number;
  showLabel?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={
            percentage === 100 
              ? "text-green-400 transition-all duration-500 ease-out" 
              : percentage > 70 
              ? "text-[#8BCAD9] transition-all duration-500 ease-out"
              : percentage > 40
              ? "text-[#3887A6] transition-all duration-500 ease-out"
              : "text-white/40 transition-all duration-500 ease-out"
          }
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default function UserProgressCard() {
  const t = useTranslations('UserProgress');
  const params = useParams();

  // Validar e normalizar locale
  const rawLocale = params?.locale as string | undefined;
  const validLocales = ['pt', 'it', 'es'];
  const locale = rawLocale && validLocales.includes(rawLocale) ? rawLocale : 'pt';

  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Fetch user progress
        const progressResponse = await fetch(`${apiUrl}/api/v1/users/me/progress`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setProgress(progressData);
        }

        // Fetch courses with progress to get individual course data
        const coursesResponse = await fetch(`${apiUrl}/api/v1/courses-progress`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          // Filter only courses with progress > 0
          const activeCourses = coursesData
            .filter((course: { progress?: { percentage: number } }) => (course.progress?.percentage ?? 0) > 0)
            .map((course: { 
              id: string; 
              slug: string; 
              progress?: { percentage: number; completedLessons: number; totalLessons: number };
              translations?: Array<{ locale: string; title: string }>;
            }) => ({
              id: course.id,
              title: course.translations?.find((t: { locale: string; title: string }) => t.locale === locale)?.title || course.slug,
              slug: course.slug,
              progress: course.progress?.percentage || 0,
              completedLessons: course.progress?.completedLessons || 0,
              totalLessons: course.progress?.totalLessons || 0,
            }))
            .sort((a: CourseProgress, b: CourseProgress) => b.progress - a.progress)
            .slice(0, 4); // Show max 4 courses
          
          setEnrolledCourses(activeCourses);
        }
      } catch (error) {
        console.error('Error fetching user progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [locale]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 animate-pulse border border-gray-700/50">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-[#0C2133]/50 to-[#0C2133]/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#3887A6]/20 shadow-xl"
    >
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-[#3887A6] to-[#8BCAD9] rounded-lg">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            {t('title')}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-white/70">
            <Calendar className="w-3.5 h-3.5 text-[#8BCAD9]" />
            <span>{t('memberSince')}: <span className="text-white font-medium">{formatDate(progress.overview.memberSince)}</span></span>
          </div>
          {progress.overview.lastActivityAt && (
            <div className="flex items-center gap-1.5 text-white/70">
              <Activity className="w-3.5 h-3.5 text-[#8BCAD9]" />
              <span>{formatDate(progress.overview.lastActivityAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {/* Dias ativos */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-gradient-to-br from-[#8BCAD9]/10 to-[#8BCAD9]/5 rounded-xl p-3 sm:p-4 border border-[#8BCAD9]/20 hover:border-[#8BCAD9]/40 transition-all"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-2 bg-[#8BCAD9]/20 rounded-lg">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#8BCAD9]" />
            </div>
            <span className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider">{t('daysActive')}</span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {progress.overview.daysActive}
            </div>
          </div>
        </motion.div>

        {/* Cursos em progresso */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-gradient-to-br from-[#3887A6]/15 to-[#3887A6]/8 rounded-xl p-3 sm:p-4 border border-[#3887A6]/25 hover:border-[#3887A6]/40 transition-all"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-2 bg-[#3887A6]/20 rounded-lg">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#3887A6]" />
            </div>
            <span className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider">{t('inProgress')}</span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {progress.coursesProgress.coursesInProgress}
            </div>
          </div>
        </motion.div>

        {/* Cursos completados */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-gradient-to-br from-[#48BB78]/10 to-[#48BB78]/5 rounded-xl p-3 sm:p-4 border border-[#48BB78]/20 hover:border-[#48BB78]/40 transition-all"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-2 bg-[#48BB78]/20 rounded-lg">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#48BB78]" />
            </div>
            <span className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider">{t('completed')}</span>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {progress.coursesProgress.completedCourses}
            </div>
          </div>
        </motion.div>

        {/* Lições completadas */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-gradient-to-br from-[#0C3559]/20 to-[#0C3559]/10 rounded-xl p-3 sm:p-4 border border-[#0C3559]/30 hover:border-[#3887A6]/50 transition-all"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-2 bg-[#0C3559]/30 rounded-lg">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-[#6BB8D1]" />
            </div>
            <span className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider">{t('lessons')}</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {progress.coursesProgress.completedLessons}
              </span>
              <span className="text-sm text-white/40">
                /{progress.coursesProgress.totalLessons}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Progresso médio */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="bg-gradient-to-br from-[#3887A6]/20 to-[#8BCAD9]/10 rounded-xl p-3 sm:p-4 border border-[#3887A6]/30 hover:border-[#8BCAD9]/50 transition-all"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-2 bg-[#3887A6]/20 rounded-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#8BCAD9]" />
            </div>
            <span className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider">{t('average')}</span>
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#8BCAD9] to-[#3887A6] bg-clip-text text-transparent">
              {progress.coursesProgress.averageProgress}%
            </div>
          </div>
        </motion.div>
      </div>

      {/* Duas colunas: Cursos e Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Cursos em progresso com barras circulares */}
        {enrolledCourses.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              {t('coursesInProgress')}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {enrolledCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/${locale}/courses/${course.slug}`}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 hover:border-secondary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <CircularProgress percentage={course.progress} size={45} strokeWidth={3} />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-white truncate group-hover:text-secondary transition-colors">
                        {course.title}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">
                        {course.completedLessons}/{course.totalLessons} {t('lessonsSmall')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats combinados */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            {t('statistics')}
          </h4>
          
          <div className="space-y-3">
            {/* Trilhas */}
            {progress.tracksProgress.totalTracks > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{t('tracks')}</span>
                  <span className="text-sm text-white">
                    {progress.tracksProgress.completedTracks}/{progress.tracksProgress.totalTracks}
                  </span>
                </div>
                {progress.tracksProgress.mostAdvancedTrack && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50">
                    <p className="text-xs text-gray-500">{t('mostAdvanced')}</p>
                    <p className="text-sm text-white mt-1">
                      {progress.tracksProgress.mostAdvancedTrack.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-secondary to-blue-500"
                          style={{ width: `${progress.tracksProgress.mostAdvancedTrack.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {progress.tracksProgress.mostAdvancedTrack.progress}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Flashcards */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{t('flashcards')}</span>
                {progress.flashcardsStats.todayCompleted && (
                  <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">
                    {t('reviewedToday')}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <p className="text-xs text-gray-500">{t('answered')}</p>
                  <p className="text-lg font-bold text-white">{progress.flashcardsStats.totalAnswered}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('correct')}</p>
                  <p className="text-lg font-bold text-green-400">{progress.flashcardsStats.correctAnswers}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('accuracy')}</p>
                  <p className="text-lg font-bold text-blue-400">{progress.flashcardsStats.accuracy}%</p>
                </div>
              </div>
              {progress.flashcardsStats.lastReviewDate && (
                <p className="text-xs text-gray-500 mt-2">
                  {t('lastReview')}: {formatDate(progress.flashcardsStats.lastReviewDate)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}