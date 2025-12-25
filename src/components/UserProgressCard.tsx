'use client';

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
  Gamepad2,
  Loader2,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import {
  useUserProgress,
  useCoursesProgress,
  getActiveCourses,
  type UserProgress,
} from '@/hooks/queries/useUserProgress';

// ============ Circular Progress Component ============

function CircularProgress({
  percentage,
  size = 60,
  strokeWidth = 4,
  showLabel = true,
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-700"
        />
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
              ? 'text-green-400 transition-all duration-500 ease-out'
              : percentage > 70
              ? 'text-[#8BCAD9] transition-all duration-500 ease-out'
              : percentage > 40
              ? 'text-[#3887A6] transition-all duration-500 ease-out'
              : 'text-white/40 transition-all duration-500 ease-out'
          }
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

// ============ Skeleton Components ============

function StatCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-gray-700/20 to-gray-700/10 rounded-xl p-3 sm:p-4 border border-gray-700/30 animate-pulse">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="w-9 h-9 bg-gray-700 rounded-lg" />
        <div className="w-16 h-3 bg-gray-700 rounded" />
        <div className="w-10 h-8 bg-gray-700 rounded" />
      </div>
    </div>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
      {[1, 2, 3, 4, 5].map(i => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

function StatsDetailSkeleton() {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-3" />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="h-3 bg-gray-700 rounded w-12 mb-1" />
          <div className="h-6 bg-gray-700 rounded w-8" />
        </div>
        <div>
          <div className="h-3 bg-gray-700 rounded w-12 mb-1" />
          <div className="h-6 bg-gray-700 rounded w-8" />
        </div>
        <div>
          <div className="h-3 bg-gray-700 rounded w-12 mb-1" />
          <div className="h-6 bg-gray-700 rounded w-8" />
        </div>
      </div>
    </div>
  );
}

// ============ Stat Card Component ============

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  suffix?: string;
  colorClass: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`bg-gradient-to-br ${colorClass} rounded-xl p-3 sm:p-4 border hover:border-opacity-60 transition-all`}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="p-2 bg-white/10 rounded-lg">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-current" />
        </div>
        <span className="text-[10px] sm:text-xs text-white/60 uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-2xl sm:text-3xl font-bold text-white">{value}</span>
          {suffix && <span className="text-sm text-white/40">{suffix}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ============ Stats Section Component ============

function StatsSection({
  progress,
  t,
  formatDate,
}: {
  progress: UserProgress;
  t: ReturnType<typeof useTranslations>;
  formatDate: (date?: string) => string;
}) {
  return (
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
              <p className="text-sm text-white mt-1">{progress.tracksProgress.mostAdvancedTrack.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-secondary to-blue-500"
                    style={{ width: `${progress.tracksProgress.mostAdvancedTrack.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{progress.tracksProgress.mostAdvancedTrack.progress}%</span>
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
            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">{t('reviewedToday')}</span>
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

      {/* Animations/Exercises */}
      {progress.animationsStats && progress.animationsStats.totalAvailable > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5" />
              {t('exercises')}
            </span>
            {progress.animationsStats.todayActivity && (
              <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">{t('activeToday')}</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div>
              <p className="text-xs text-gray-500">{t('exercisesCompleted')}</p>
              <p className="text-lg font-bold text-white">
                {progress.animationsStats.totalCompleted}
                <span className="text-sm text-gray-500 font-normal">/{progress.animationsStats.totalAvailable}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('successRate')}</p>
              <p className="text-lg font-bold text-green-400">{progress.animationsStats.successRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('avgAttempts')}</p>
              <p className="text-lg font-bold text-secondary">{progress.animationsStats.averageAttempts.toFixed(1)}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">{t('exercisesProgress')}</span>
              <span className="text-secondary">
                {Math.round((progress.animationsStats.totalCompleted / progress.animationsStats.totalAvailable) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary to-accent transition-all duration-500"
                style={{
                  width: `${(progress.animationsStats.totalCompleted / progress.animationsStats.totalAvailable) * 100}%`,
                }}
              />
            </div>
          </div>
          {progress.animationsStats.lastActivityAt && (
            <p className="text-xs text-gray-500 mt-2">
              {t('lastActivity')}: {formatDate(progress.animationsStats.lastActivityAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Main Component ============

export default function UserProgressCard() {
  const t = useTranslations('UserProgress');
  const params = useParams();

  // Validate and normalize locale
  const rawLocale = params?.locale as string | undefined;
  const validLocales = ['pt', 'it', 'es'];
  const locale = rawLocale && validLocales.includes(rawLocale) ? rawLocale : 'pt';

  // Fetch data with TanStack Query - courses loads faster, progress is slower
  const {
    data: coursesData,
    isLoading: coursesLoading,
    isError: coursesError,
  } = useCoursesProgress();

  const {
    data: progress,
    isLoading: progressLoading,
    isFetching: progressFetching,
    isError: progressError,
  } = useUserProgress();

  // Get active courses (courses with progress > 0)
  const enrolledCourses = getActiveCourses(coursesData, locale, 4);

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale);
  };

  // If both fail, don't show the card
  if (progressError && coursesError) {
    return null;
  }

  // Show minimal loading only if we have NO data at all
  if (progressLoading && coursesLoading && !progress && !coursesData) {
    return (
      <div className="bg-gradient-to-br from-[#0C2133]/50 to-[#0C2133]/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#3887A6]/20 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-r from-[#3887A6] to-[#8BCAD9] rounded-lg">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">{t('title')}</h3>
          <Loader2 className="w-4 h-4 text-[#8BCAD9] animate-spin ml-2" />
        </div>
        <StatsGridSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-[#0C2133]/50 to-[#0C2133]/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#3887A6]/20 shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-[#3887A6] to-[#8BCAD9] rounded-lg">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">{t('title')}</h3>
          {progressFetching && <Loader2 className="w-4 h-4 text-[#8BCAD9] animate-spin" />}
        </div>
        {progress && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 text-white/70">
              <Calendar className="w-3.5 h-3.5 text-[#8BCAD9]" />
              <span>
                {t('memberSince')}:{' '}
                <span className="text-white font-medium">{formatDate(progress.overview.memberSince)}</span>
              </span>
            </div>
            {progress.overview.lastActivityAt && (
              <div className="flex items-center gap-1.5 text-white/70">
                <Activity className="w-3.5 h-3.5 text-[#8BCAD9]" />
                <span>{formatDate(progress.overview.lastActivityAt)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Statistics Grid - shows skeleton if progress is loading */}
      {progress ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <StatCard
            icon={Activity}
            label={t('daysActive')}
            value={progress.overview.daysActive}
            colorClass="from-[#8BCAD9]/10 to-[#8BCAD9]/5 border-[#8BCAD9]/20 text-[#8BCAD9]"
          />
          <StatCard
            icon={BookOpen}
            label={t('inProgress')}
            value={progress.coursesProgress.coursesInProgress}
            colorClass="from-[#3887A6]/15 to-[#3887A6]/8 border-[#3887A6]/25 text-[#3887A6]"
          />
          <StatCard
            icon={CheckCircle}
            label={t('completed')}
            value={progress.coursesProgress.completedCourses}
            colorClass="from-[#48BB78]/10 to-[#48BB78]/5 border-[#48BB78]/20 text-[#48BB78]"
          />
          <StatCard
            icon={GraduationCap}
            label={t('lessons')}
            value={progress.coursesProgress.completedLessons}
            suffix={`/${progress.coursesProgress.totalLessons}`}
            colorClass="from-[#0C3559]/20 to-[#0C3559]/10 border-[#0C3559]/30 text-[#6BB8D1]"
          />
          <StatCard
            icon={Target}
            label={t('average')}
            value={`${progress.coursesProgress.averageProgress}%`}
            colorClass="from-[#3887A6]/20 to-[#8BCAD9]/10 border-[#3887A6]/30 text-[#8BCAD9]"
          />
        </div>
      ) : (
        <StatsGridSkeleton />
      )}

      {/* Two Columns: Courses and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Courses in Progress - loads faster */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            {t('coursesInProgress')}
            {coursesLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {coursesLoading ? (
              // Show skeleton while courses are loading
              <>
                <CourseCardSkeleton />
                <CourseCardSkeleton />
              </>
            ) : enrolledCourses.length > 0 ? (
              // Show courses when loaded
              enrolledCourses.map(course => (
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
              ))
            ) : (
              // No courses yet
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30 text-center">
                <p className="text-sm text-gray-500">{t('noCoursesStarted') || 'Nenhum curso iniciado ainda'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats - loads slower */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            {t('statistics')}
            {progressLoading && <Loader2 className="w-3 h-3 animate-spin" />}
          </h4>

          {progress ? (
            <StatsSection progress={progress} t={t} formatDate={formatDate} />
          ) : (
            // Show skeleton while progress is loading
            <div className="space-y-3">
              <StatsDetailSkeleton />
              <StatsDetailSkeleton />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
