// src/app/[locale]/flashcards/progress/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  Clock,
  TrendingUp,
  Filter,
  Calendar,
  ChevronDown,
  Brain,
  Target,
  Award,
  BarChart3,
  Zap,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import NavSidebar from '@/components/NavSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { useAuth } from '@/stores/auth.store';

// Types
interface FlashcardInteraction {
  id: string;
  flashcardId: string;
  flashcard: {
    id: string;
    questionText: string;
    questionType: 'TEXT' | 'IMAGE';
    answerPreview: string;
    argumentId: string;
  };
  difficultyLevel: 'EASY' | 'HARD' | 'NEUTRAL';
  reviewedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface InteractionsResponse {
  interactions: FlashcardInteraction[];
  pagination: PaginationInfo;
}

interface StatsData {
  totalInteractions: number;
  easyCount: number;
  hardCount: number;
  neutralCount: number;
  studyDays: number;
  currentStreak: number;
  averagePerDay: number;
  mostActiveHour: number;
}

interface DailyActivity {
  date: string;
  count: number;
  easyCount: number;
  hardCount: number;
}

// Custom hook for fetching interactions
const useFlashcardInteractions = (filters: {
  page: number;
  limit: number;
  difficultyLevel?: 'EASY' | 'HARD' | 'NEUTRAL';
  dateFrom?: string;
  dateTo?: string;
}) => {
  const [data, setData] = useState<InteractionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        setLoading(true);
        if (!token || !isAuthenticated) {
          throw new Error('No authentication token');
        }

        const params = new URLSearchParams();
        params.append('page', filters.page.toString());
        params.append('limit', filters.limit.toString());
        
        if (filters.difficultyLevel) {
          params.append('difficultyLevel', filters.difficultyLevel);
        }
        if (filters.dateFrom) {
          params.append('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append('dateTo', filters.dateTo);
        }

        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${API_URL}/api/v1/flashcard-interactions?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch interactions');
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching interactions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, [filters.page, filters.limit, filters.difficultyLevel, filters.dateFrom, filters.dateTo, token, isAuthenticated]);

  return { data, loading, error };
};

export default function FlashcardProgressPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('FlashcardProgress');
  const locale = params.locale as string;

  // States
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | 'EASY' | 'HARD' | 'NEUTRAL'>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    let dateFrom: Date;
    const dateTo = now;

    switch (selectedPeriod) {
      case 'week':
        dateFrom = subDays(now, 7);
        break;
      case 'month':
        dateFrom = subDays(now, 30);
        break;
      default:
        dateFrom = new Date(2024, 0, 1); // Beginning of year
    }

    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };
  }, [selectedPeriod]);

  // Fetch interactions
  const { data, loading, error } = useFlashcardInteractions({
    page,
    limit: 20,
    difficultyLevel: selectedDifficulty === 'ALL' ? undefined : selectedDifficulty,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  });

  // Calculate statistics
  useEffect(() => {
    if (!data) return;

    const interactions = data.interactions;
    const easyCount = interactions.filter(i => i.difficultyLevel === 'EASY').length;
    const hardCount = interactions.filter(i => i.difficultyLevel === 'HARD').length;
    const neutralCount = interactions.filter(i => i.difficultyLevel === 'NEUTRAL').length;

    // Calculate study days and streak
    const uniqueDays = new Set(
      interactions.map(i => format(new Date(i.reviewedAt), 'yyyy-MM-dd'))
    );
    const studyDays = uniqueDays.size;

    // Calculate average per day based on study days
    const averagePerDay = studyDays > 0 ? Math.round(data.pagination.total / studyDays) : 0;

    // Find most active hour
    const hourCounts = interactions.reduce((acc, interaction) => {
      const hour = new Date(interaction.reviewedAt).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostActiveHour = Object.entries(hourCounts).reduce((max, [hour, count]) => 
      count > (hourCounts[max] || 0) ? parseInt(hour) : max
    , 0);

    // Calculate current streak (simplified)
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      if (uniqueDays.has(checkDate)) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    setStats({
      totalInteractions: data.pagination.total,
      easyCount,
      hardCount,
      neutralCount,
      studyDays,
      currentStreak,
      averagePerDay,
      mostActiveHour,
    });

    // Calculate daily activity for calendar
    const activityMap = interactions.reduce((acc, interaction) => {
      const date = format(new Date(interaction.reviewedAt), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { count: 0, easyCount: 0, hardCount: 0 };
      }
      acc[date].count++;
      if (interaction.difficultyLevel === 'EASY') acc[date].easyCount++;
      if (interaction.difficultyLevel === 'HARD') acc[date].hardCount++;
      return acc;
    }, {} as Record<string, { count: number; easyCount: number; hardCount: number }>);

    const dailyData = Object.entries(activityMap).map(([date, data]) => ({
      date,
      ...data,
    }));

    setDailyActivity(dailyData);
  }, [data, dateRange]);

  // Get locale for date-fns
  const dateLocale = locale === 'pt' ? ptBR : locale === 'it' ? it : es;

  if (loading) {
    return (
      <NavSidebar>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary flex items-center justify-center">
          <div className="text-center">
            <Brain className="w-12 h-12 text-secondary animate-pulse mx-auto mb-4" />
            <p className="text-gray-400">{t('loading')}</p>
          </div>
        </div>
      </NavSidebar>
    );
  }

  if (error) {
    return (
      <NavSidebar>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-400">{t('error')}</p>
          </div>
        </div>
      </NavSidebar>
    );
  }

  return (
    <NavSidebar>
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
            <p className="text-gray-400">{t('subtitle')}</p>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-dark/50 rounded-lg text-gray-300 hover:bg-primary-dark/70 transition-colors"
            >
              <Filter size={20} />
              {t('filters')}
              <ChevronDown
                size={16}
                className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* Period Filter */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">{t('period')}</label>
                    <div className="flex gap-2">
                      {(['week', 'month', 'all'] as const).map(period => (
                        <button
                          key={period}
                          onClick={() => setSelectedPeriod(period)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            selectedPeriod === period
                              ? 'bg-secondary text-primary'
                              : 'bg-primary-dark/50 text-gray-300 hover:bg-primary-dark/70'
                          }`}
                        >
                          {t(`periods.${period}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">{t('difficulty')}</label>
                    <div className="flex gap-2">
                      {(['ALL', 'EASY', 'HARD', 'NEUTRAL'] as const).map(diff => (
                        <button
                          key={diff}
                          onClick={() => setSelectedDifficulty(diff)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            selectedDifficulty === diff
                              ? 'bg-secondary text-primary'
                              : 'bg-primary-dark/50 text-gray-300 hover:bg-primary-dark/70'
                          }`}
                        >
                          {t(`difficulties.${diff.toLowerCase()}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Interactions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary-dark/50 backdrop-blur-lg rounded-xl p-6 border border-secondary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <Brain className="w-8 h-8 text-secondary" />
                  <span className="text-2xl font-bold text-white">{stats.totalInteractions}</span>
                </div>
                <p className="text-gray-400 text-sm">{t('stats.totalInteractions')}</p>
              </motion.div>

              {/* Success Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-primary-dark/50 backdrop-blur-lg rounded-xl p-6 border border-secondary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold text-white">
                    {stats.totalInteractions > 0 
                      ? Math.round((stats.easyCount / stats.totalInteractions) * 100)
                      : 0}%
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{t('stats.successRate')}</p>
              </motion.div>

              {/* Current Streak */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-primary-dark/50 backdrop-blur-lg rounded-xl p-6 border border-secondary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-8 h-8 text-yellow-500" />
                  <span className="text-2xl font-bold text-white">{stats.currentStreak}</span>
                </div>
                <p className="text-gray-400 text-sm">{t('stats.currentStreak')}</p>
              </motion.div>

              {/* Study Days */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-primary-dark/50 backdrop-blur-lg rounded-xl p-6 border border-secondary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <CalendarDays className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold text-white">{stats.studyDays}</span>
                </div>
                <p className="text-gray-400 text-sm">{t('stats.studyDays')}</p>
              </motion.div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Progress Chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Difficulty Distribution */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary-dark/50 backdrop-blur-lg rounded-xl p-6 border border-secondary/20"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-secondary" />
                  {t('charts.difficultyDistribution')}
                </h2>
                
                {stats && (
                  <div className="space-y-4">
                    {/* Easy */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-green-400">{t('difficulties.easy')}</span>
                        <span className="text-gray-400">{stats.easyCount}</span>
                      </div>
                      <div className="w-full bg-primary-dark rounded-full h-4 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${stats.totalInteractions > 0 ? (stats.easyCount / stats.totalInteractions) * 100 : 0}%` 
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-green-500"
                        />
                      </div>
                    </div>

                    {/* Hard */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-red-400">{t('difficulties.hard')}</span>
                        <span className="text-gray-400">{stats.hardCount}</span>
                      </div>
                      <div className="w-full bg-primary-dark rounded-full h-4 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${stats.totalInteractions > 0 ? (stats.hardCount / stats.totalInteractions) * 100 : 0}%` 
                          }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          className="h-full bg-red-500"
                        />
                      </div>
                    </div>

                    {/* Neutral */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-yellow-400">{t('difficulties.neutral')}</span>
                        <span className="text-gray-400">{stats.neutralCount}</span>
                      </div>
                      <div className="w-full bg-primary-dark rounded-full h-4 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${stats.totalInteractions > 0 ? (stats.neutralCount / stats.totalInteractions) * 100 : 0}%` 
                          }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                          className="h-full bg-yellow-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-primary-dark/50 backdrop-blur-lg rounded-xl p-6 border border-secondary/20"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary" />
                  {t('recentActivity.title')}
                </h2>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data?.interactions.slice(0, 10).map((interaction, index) => (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-primary-dark/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-white text-sm truncate">{interaction.flashcard.questionText}</p>
                        <p className="text-gray-500 text-xs">
                          {format(new Date(interaction.reviewedAt), 'dd/MM HH:mm', { locale: dateLocale })}
                        </p>
                      </div>
                      <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                        interaction.difficultyLevel === 'EASY'
                          ? 'bg-green-500/20 text-green-400'
                          : interaction.difficultyLevel === 'HARD'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {t(`difficulties.${interaction.difficultyLevel.toLowerCase()}`)}
                      </div>
                    </motion.div>
                  ))}

                  {data?.interactions.length === 0 && (
                    <p className="text-gray-500 text-center py-8">{t('recentActivity.empty')}</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Calendar and Insights */}
            <div className="space-y-6">
              {/* Study Calendar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-primary-dark/50 backdrop-blur-lg rounded-xl p-6 border border-secondary/20"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" />
                  {t('calendar.title')}
                </h2>

                <div className="grid grid-cols-7 gap-1">
                  {/* Week days header */}
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                    <div key={index} className="text-center text-xs text-gray-500 py-2">
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {eachDayOfInterval({
                    start: startOfWeek(subDays(new Date(), 28)),
                    end: endOfWeek(new Date())
                  }).map((date, index) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const activity = dailyActivity.find(a => a.date === dateStr);
                    const hasActivity = activity && activity.count > 0;
                    const intensity = activity 
                      ? Math.min(1, activity.count / 10) 
                      : 0;

                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded flex items-center justify-center text-xs ${
                          isToday(date)
                            ? 'ring-2 ring-secondary'
                            : ''
                        }`}
                        style={{
                          backgroundColor: hasActivity
                            ? `rgba(56, 135, 166, ${intensity})`
                            : 'rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <span className={hasActivity ? 'text-white' : 'text-gray-600'}>
                          {format(date, 'd')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Study Insights */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-primary-dark/50 backdrop-blur-lg rounded-xl p-6 border border-secondary/20"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-secondary" />
                  {t('insights.title')}
                </h2>

                <div className="space-y-4">
                  {stats && (
                    <>
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-white text-sm">{t('insights.mostActiveHour')}</p>
                          <p className="text-gray-400 text-xs">
                            {stats.mostActiveHour}:00 - {stats.mostActiveHour + 1}:00
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white text-sm">{t('insights.averagePerDay')}</p>
                          <p className="text-gray-400 text-xs">
                            {stats.averagePerDay} {t('insights.flashcards')}
                          </p>
                        </div>
                      </div>

                      {stats.currentStreak >= 3 && (
                        <div className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
                          <div>
                            <p className="text-white text-sm">{t('insights.greatStreak')}</p>
                            <p className="text-gray-400 text-xs">
                              {t('insights.keepItUp')}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* Study Recommendations */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-secondary/20 to-accent-light/20 backdrop-blur-lg rounded-xl p-6 border border-secondary/30"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  {t('recommendations.title')}
                </h2>

                <div className="space-y-3">
                  {stats && stats.hardCount > 5 && (
                    <button
                      onClick={() => router.push(`/${locale}/flashcards/review?difficulty=HARD`)}
                      className="w-full text-left p-3 bg-primary-dark/50 rounded-lg hover:bg-primary-dark/70 transition-colors"
                    >
                      <p className="text-white text-sm">{t('recommendations.reviewHard')}</p>
                      <p className="text-gray-400 text-xs">
                        {stats.hardCount} {t('recommendations.difficultCards')}
                      </p>
                    </button>
                  )}

                  <button
                    onClick={() => router.push(`/${locale}/flashcards/study`)}
                    className="w-full text-left p-3 bg-primary-dark/50 rounded-lg hover:bg-primary-dark/70 transition-colors"
                  >
                    <p className="text-white text-sm">{t('recommendations.continueStudying')}</p>
                    <p className="text-gray-400 text-xs">{t('recommendations.maintainStreak')}</p>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!data.pagination.hasPrev}
                className="px-4 py-2 bg-primary-dark/50 rounded-lg text-gray-300 hover:bg-primary-dark/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('pagination.previous')}
              </button>
              
              <span className="px-4 py-2 text-gray-300">
                {t('pagination.page', { current: page, total: data.pagination.totalPages })}
              </span>
              
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data.pagination.hasNext}
                className="px-4 py-2 bg-primary-dark/50 rounded-lg text-gray-300 hover:bg-primary-dark/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('pagination.next')}
              </button>
            </div>
          )}
        </div>
      </div>
    </NavSidebar>
  );
}