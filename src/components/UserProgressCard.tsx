'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  TrendingUp,
  Target,
  Award,
  Flame,
  BookOpen,
  Clock,
  Calendar,
  ChevronRight,
  Zap,
  Trophy,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface UserProgress {
  overview: {
    totalLearningTime: number;
    currentStreak: number;
    longestStreak: number;
    lastActivityAt: string;
    memberSince: string;
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
  currentFocus?: {
    continueLearning?: {
      lessonId: string;
      lessonTitle: string;
      courseTitle: string;
      moduleTitle: string;
      videoProgress: number;
      estimatedTimeToComplete: number;
    };
  };
  weeklyActivity: {
    targetMinutes: number;
    completedMinutes: number;
    daysActive: boolean[];
    lessonsCompleted: number;
    weeklyGoalProgress: number;
  };
  achievements: {
    totalPoints: number;
    level: number;
    pointsToNextLevel: number;
    recentBadges: Array<{
      id: string;
      title: string;
      earnedAt: string;
    }>;
  };
  flashcardsStats: {
    totalAnswered: number;
    correctAnswers: number;
    accuracy: number;
    streakDays: number;
    todayCompleted: boolean;
    cardsToReview: number;
  };
}

export default function UserProgressCard() {
  const t = useTranslations('UserProgress');
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'pt';
  const [progress, setProgress] = useState<UserProgress | null>(null);
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
        const response = await fetch(`${apiUrl}/api/v1/users/me/progress`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProgress(data);
        }
      } catch (error) {
        console.error('Error fetching user progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getDayName = (index: number) => {
    const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
    return days[index];
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-primary via-secondary to-accent p-6 relative overflow-hidden">
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-white/20 blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/20 blur-xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              {t('title')}
            </h2>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <Trophy className="w-4 h-4 text-yellow-300" />
              <span className="text-white font-bold">
                {t('level')} {progress.achievements.level}
              </span>
            </div>
          </div>
          <p className="text-white/80 text-sm">{t('subtitle')}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Estatísticas principais em grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak atual */}
          <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 rounded-lg p-4 border border-orange-600/30">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-xs text-gray-400">{t('currentStreak')}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {progress.overview.currentStreak}
              </span>
              <span className="text-xs text-gray-400">{t('days')}</span>
            </div>
            {progress.overview.longestStreak > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {t('best')}: {progress.overview.longestStreak}
              </div>
            )}
          </div>

          {/* Progresso médio */}
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg p-4 border border-blue-600/30">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-gray-400">{t('averageProgress')}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {progress.coursesProgress.averageProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress.coursesProgress.averageProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Tempo total de estudo */}
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-600/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-gray-400">{t('totalTime')}</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatTime(progress.overview.totalLearningTime)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t('thisWeek')}: {formatTime(progress.weeklyActivity.completedMinutes)}
            </div>
          </div>

          {/* Lições completadas */}
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-lg p-4 border border-green-600/30">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-green-400" />
              <span className="text-xs text-gray-400">{t('completedLessons')}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {progress.coursesProgress.completedLessons}
              </span>
              <span className="text-xs text-gray-400">
                / {progress.coursesProgress.totalLessons}
              </span>
            </div>
            <div className="text-xs text-green-400 mt-1">
              {progress.coursesProgress.lessonsCompletionRate}% {t('complete')}
            </div>
          </div>
        </div>

        {/* Atividade semanal */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium text-white">{t('weeklyActivity')}</span>
            </div>
            <span className="text-xs text-gray-400">
              {progress.weeklyActivity.lessonsCompleted} {t('lessonsThisWeek')}
            </span>
          </div>
          
          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-2">
            {progress.weeklyActivity.daysActive.map((active, index) => (
              <div
                key={index}
                className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                  active
                    ? 'bg-gradient-to-b from-green-600 to-green-700 shadow-lg'
                    : 'bg-gray-700/50'
                }`}
              >
                <span className={`text-xs font-medium ${active ? 'text-white' : 'text-gray-500'}`}>
                  {getDayName(index)}
                </span>
                {active && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Meta semanal */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">{t('weeklyGoal')}</span>
              <span className="text-white">
                {progress.weeklyActivity.completedMinutes}/{progress.weeklyActivity.targetMinutes} min
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  progress.weeklyActivity.weeklyGoalProgress >= 100
                    ? 'bg-gradient-to-r from-green-500 to-green-400'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                }`}
                style={{ width: `${Math.min(progress.weeklyActivity.weeklyGoalProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Continue Learning */}
        {progress.currentFocus?.continueLearning && (
          <div className="bg-gradient-to-r from-secondary/20 to-accent/20 rounded-lg p-4 border border-secondary/30">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-white">{t('continueWhere')}</span>
                </div>
                <h4 className="text-white font-semibold">
                  {progress.currentFocus.continueLearning.lessonTitle}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  {progress.currentFocus.continueLearning.courseTitle} • {progress.currentFocus.continueLearning.moduleTitle}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-secondary to-accent h-1.5 rounded-full"
                      style={{ width: `${progress.currentFocus.continueLearning.videoProgress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {progress.currentFocus.continueLearning.estimatedTimeToComplete} min
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  // Navigate to lesson - you'll need to get the proper route
                  console.log('Continue lesson:', progress.currentFocus?.continueLearning?.lessonId);
                }}
                className="p-3 bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-colors group"
              >
                <ChevronRight className="w-5 h-5 text-secondary group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Achievements */}
        {progress.achievements.recentBadges.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium text-white">{t('recentAchievements')}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {progress.achievements.recentBadges.slice(0, 3).map((badge) => (
                <div
                  key={badge.id}
                  className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 px-3 py-1 rounded-full border border-yellow-600/30"
                >
                  <span className="text-xs text-yellow-300">{badge.title}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-400">
              {t('totalPoints')}: {progress.achievements.totalPoints} • {t('nextLevel')}: {progress.achievements.pointsToNextLevel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}