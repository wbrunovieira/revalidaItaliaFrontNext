// /src/components/TutorAnimationStats.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import {
  Gamepad2,
  Users,
  Target,
  Activity,
  Award,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Eye,
  CheckCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { useAuth } from '@/stores/auth.store';

// Types based on API documentation
interface AnimationUserStats {
  userId: string;
  name: string;
  email: string;
  stats: {
    totalAvailable?: number;
    totalAttempted: number;
    totalCompleted: number;
    successRate: number;
    averageAttempts: number;
    lastActivityAt?: string;
  };
  recentActivity?: {
    todayCount: number;
    last7Days: number;
    last30Days: number;
  };
  performanceLevel: 'excellent' | 'good' | 'needs-attention' | 'critical';
  activityStatus: 'active' | 'moderate' | 'inactive';
}

interface AnimationUserDetail {
  userId: string;
  name: string;
  email: string;
  summary: {
    totalAvailable?: number;
    totalAttempted: number;
    totalCompleted: number;
    successRate: number;
    averageAttempts: number;
    lastActivityAt?: string;
  };
  recentActivity?: {
    today?: number;
    last7Days: number;
    last30Days: number;
  };
  performanceLevel: 'excellent' | 'good' | 'needs-attention' | 'critical';
  activityStatus: 'active' | 'moderate' | 'inactive';
  lessonBreakdown?: Array<{
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    courseTitle: string;
    totalAnimations: number;
    completedAnimations: number;
    percentComplete: number;
    averageAttempts: number;
  }>;
  animationTypeStats?: {
    CompleteSentence?: { attempted: number; completed: number; successRate: number };
    MultipleChoice?: { attempted: number; completed: number; successRate: number };
  };
}

interface StatsResponse {
  success: boolean;
  data: {
    users: AnimationUserStats[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
    summary: {
      totalUsers: number;
      activeUsers: number;
      averageSuccessRate: number;
      performanceDistribution: {
        excellent: number;
        good: number;
        needsAttention: number;
        critical: number;
      };
    };
  };
}

interface TutorAnimationStatsProps {
  locale: string;
}

export default function TutorAnimationStats({ locale }: TutorAnimationStatsProps) {
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();
  const t = useTranslations('Tutor.tutorAnimations');

  const getDateLocale = () => {
    switch(locale) {
      case 'it': return it;
      case 'es': return es;
      default: return ptBR;
    }
  };

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsResponse['data'] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activePeriod, setActivePeriod] = useState<'today' | '7days' | '30days' | 'all' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'successRate' | 'totalCompleted' | 'lastActivity'>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // User detail state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AnimationUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  const fetchStats = useCallback(async (searchQuery?: string, newPage?: number) => {
    try {
      setLoading(true);
      if (!token || !isAuthenticated) {
        throw new Error('No authentication token');
      }

      const params = new URLSearchParams();
      params.append('page', (newPage || page).toString());
      params.append('limit', '20');
      params.append('sortBy', sortBy);
      params.append('order', order);

      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);

      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      console.log('Fetching animation stats with params:', params.toString());

      const response = await fetch(
        `${apiUrl}/api/v1/animations/stats/users?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to fetch animation stats');
      }

      const data = await response.json();
      console.log('Animation stats response:', data);
      // API returns data directly, not wrapped in a 'data' property
      setStats(data);
    } catch (error) {
      console.error('Error fetching animation stats:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl, page, dateFrom, dateTo, sortBy, order, toast, token, isAuthenticated, t]);

  const fetchUserDetail = useCallback(async (userId: string) => {
    try {
      setLoadingDetail(true);
      if (!token || !isAuthenticated) {
        throw new Error('No authentication token');
      }

      const params = new URLSearchParams();
      params.append('userId', userId);
      if (dateFrom) params.append('startDate', dateFrom);
      if (dateTo) params.append('endDate', dateTo);

      const response = await fetch(
        `${apiUrl}/api/v1/animations/stats/users?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user detail');
      }

      const data = await response.json();
      console.log('User detail response:', data);
      // API returns data directly, not wrapped in a 'data' property
      setUserDetail(data);
    } catch (error) {
      console.error('Error fetching user detail:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchUserDetail'),
        variant: 'destructive',
      });
    } finally {
      setLoadingDetail(false);
    }
  }, [apiUrl, token, isAuthenticated, dateFrom, dateTo, toast, t]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true);

    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      setPage(1);
      fetchStats(value, 1).finally(() => setIsSearching(false));
    }, 500);

    setSearchDebounceTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  const handleViewUser = (userId: string) => {
    console.log('handleViewUser called with userId:', userId);
    setSelectedUserId(userId);
    fetchUserDetail(userId);
  };

  const handleBackToList = () => {
    setSelectedUserId(null);
    setUserDetail(null);
  };

  const filteredUsers = stats?.users || [];

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'text-green-400 bg-green-900/20';
      case 'good':
        return 'text-blue-400 bg-blue-900/20';
      case 'needs-attention':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'critical':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getPerformanceText = (level: string) => {
    switch (level) {
      case 'excellent':
        return t('performanceLevel.excellent');
      case 'good':
        return t('performanceLevel.good');
      case 'needs-attention':
        return t('performanceLevel.needsAttention');
      case 'critical':
        return t('performanceLevel.critical');
      default:
        return level;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'moderate':
        return 'text-yellow-400';
      case 'inactive':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getActivityText = (status: string) => {
    switch (status) {
      case 'active':
        return t('activityStatus.active');
      case 'moderate':
        return t('activityStatus.moderate');
      case 'inactive':
        return t('activityStatus.inactive');
      default:
        return status;
    }
  };

  // Render loading state for user detail
  if (selectedUserId && loadingDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
            {t('detail.back')}
          </button>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
            <p className="text-gray-300">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Render user detail view
  if (selectedUserId && userDetail) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-2 text-gray-400">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{t('stats.totalStudents')}</span>
          </button>
          <span>/</span>
          <span className="text-white">{t('detail.studentDetail')}</span>
        </div>

        {/* Student Profile Card */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-secondary/50">
              <span className="text-secondary font-bold text-2xl sm:text-3xl">
                {userDetail.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{userDetail.name}</h2>
              <p className="text-gray-400">{userDetail.email}</p>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(userDetail.performanceLevel)}`}>
                  {getPerformanceText(userDetail.performanceLevel)}
                </span>
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-700 ${getActivityColor(userDetail.activityStatus)}`}>
                  <Activity size={12} />
                  {getActivityText(userDetail.activityStatus)}
                </span>
                {userDetail.summary.lastActivityAt && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
                    <Calendar size={12} />
                    {format(new Date(userDetail.summary.lastActivityAt), "dd/MM/yyyy", { locale: getDateLocale() })}
                  </span>
                )}
              </div>
            </div>

            {/* Back to list button - desktop */}
            <button
              onClick={handleBackToList}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              {t('detail.back')}
            </button>
          </div>
        </div>

        {/* User summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{userDetail.summary.successRate.toFixed(1)}%</p>
                <p className="text-gray-400 text-sm">{t('stats.successRate')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {userDetail.summary.totalCompleted}{userDetail.summary.totalAvailable ? `/${userDetail.summary.totalAvailable}` : ''}
                </p>
                <p className="text-gray-400 text-sm">{t('stats.completed')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{userDetail.summary.averageAttempts.toFixed(1)}</p>
                <p className="text-gray-400 text-sm">{t('stats.avgAttempts')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{userDetail.recentActivity?.last7Days ?? '-'}</p>
                <p className="text-gray-400 text-sm">{t('stats.last7Days')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Animation type stats */}
        {userDetail.animationTypeStats && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{t('detail.exerciseTypes')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userDetail.animationTypeStats.CompleteSentence && (
                <div className="bg-gray-700/50 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    <span className="text-white font-medium">{t('types.completeSentence')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold text-white">{userDetail.animationTypeStats.CompleteSentence.completed}</p>
                      <p className="text-xs text-gray-400">{t('stats.completed')}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{userDetail.animationTypeStats.CompleteSentence.attempted}</p>
                      <p className="text-xs text-gray-400">{t('stats.attempted')}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-400">{userDetail.animationTypeStats.CompleteSentence.successRate}%</p>
                      <p className="text-xs text-gray-400">{t('stats.successRate')}</p>
                    </div>
                  </div>
                </div>
              )}
              {userDetail.animationTypeStats.MultipleChoice && (
                <div className="bg-gray-700/50 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                    <span className="text-white font-medium">{t('types.multipleChoice')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold text-white">{userDetail.animationTypeStats.MultipleChoice.completed}</p>
                      <p className="text-xs text-gray-400">{t('stats.completed')}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{userDetail.animationTypeStats.MultipleChoice.attempted}</p>
                      <p className="text-xs text-gray-400">{t('stats.attempted')}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-400">{userDetail.animationTypeStats.MultipleChoice.successRate}%</p>
                      <p className="text-xs text-gray-400">{t('stats.successRate')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lesson breakdown list */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('detail.animationProgress')}</h3>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-secondary animate-spin" />
            </div>
          ) : userDetail.lessonBreakdown?.length ? (
            <div className="space-y-3">
              {userDetail.lessonBreakdown.map((lesson) => (
                <div
                  key={lesson.lessonId}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    lesson.percentComplete === 100
                      ? 'bg-green-900/10 border-green-500/30'
                      : 'bg-gray-700/50 border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      lesson.percentComplete === 100 ? 'bg-green-500' : 'bg-gray-600'
                    }`}>
                      {lesson.percentComplete === 100 ? (
                        <CheckCircle size={20} className="text-white" />
                      ) : (
                        <span className="text-white font-medium text-sm">{lesson.percentComplete}%</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{lesson.lessonTitle}</p>
                      <p className="text-sm text-gray-400">
                        {lesson.courseTitle} &gt; {lesson.moduleTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-xs bg-secondary/30 text-secondary">
                          {lesson.completedAnimations}/{lesson.totalAnimations} {t('stats.completed').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {t('stats.avgAttempts')}: <span className="text-white font-medium">{lesson.averageAttempts.toFixed(1)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gamepad2 size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">{t('detail.noProgress')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
          <p className="text-gray-300">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <Gamepad2 size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          {t('error.noData')}
        </h3>
        <p className="text-gray-500">
          {t('error.tryAgain')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-3xl font-bold text-white">
              {stats.summary.totalUsers}
            </span>
          </div>
          <p className="text-gray-400 text-sm">{t('stats.totalStudents')}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-green-400" />
            <span className="text-3xl font-bold text-white">
              {stats.summary.activeUsers}
            </span>
          </div>
          <p className="text-gray-400 text-sm">{t('stats.activeStudents')}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.summary.totalUsers > 0
              ? `${Math.round((stats.summary.activeUsers / stats.summary.totalUsers) * 100)}% ${t('stats.ofTotal')}`
              : '0%'}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-yellow-400" />
            <span className="text-3xl font-bold text-white">
              {stats.summary.averageSuccessRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-gray-400 text-sm">{t('stats.averageSuccessRate')}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-purple-400" />
            <div className="text-right">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-400">
                  {stats.summary.performanceDistribution.excellent}
                </span>
                <span className="text-blue-400">
                  {stats.summary.performanceDistribution.good}
                </span>
                <span className="text-yellow-400">
                  {stats.summary.performanceDistribution.needsAttention}
                </span>
                <span className="text-red-400">
                  {stats.summary.performanceDistribution.critical}
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm">{t('stats.performanceDistribution')}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <Filter size={20} />
            <span>{t('filters.title')}</span>
            {(dateFrom || dateTo) && (
              <span className="ml-2 px-2 py-0.5 bg-secondary/30 text-secondary text-xs rounded-full">
                {dateFrom && dateTo ? '2' : '1'}
              </span>
            )}
          </button>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-gray-700 text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary w-full sm:w-72"
              />
              {isSearching && (
                <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
              )}
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setPage(1);
                    setIsSearching(false);
                    fetchStats('', 1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-700">
            {/* Quick date filters */}
            <div>
              <label className="block text-xs sm:text-sm text-gray-400 mb-2">{t('filters.quickPeriod')}</label>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    setDateFrom(format(today, 'yyyy-MM-dd'));
                    setDateTo(format(today, 'yyyy-MM-dd'));
                    setActivePeriod('today');
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    activePeriod === 'today'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t('filters.today')}
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const sixDaysAgo = subDays(today, 6);
                    setDateFrom(format(sixDaysAgo, 'yyyy-MM-dd'));
                    setDateTo(format(today, 'yyyy-MM-dd'));
                    setActivePeriod('7days');
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    activePeriod === '7days'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t('filters.last7Days')}
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const twentyNineDaysAgo = subDays(today, 29);
                    setDateFrom(format(twentyNineDaysAgo, 'yyyy-MM-dd'));
                    setDateTo(format(today, 'yyyy-MM-dd'));
                    setActivePeriod('30days');
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    activePeriod === '30days'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t('filters.last30Days')}
                </button>
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setActivePeriod('all');
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                    activePeriod === 'all'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {t('filters.allPeriods')}
                </button>
              </div>
            </div>

            {/* Sort options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2">{t('filters.sortBy')}</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as typeof sortBy);
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="name">{t('filters.sortOptions.name')}</option>
                  <option value="successRate">{t('filters.sortOptions.successRate')}</option>
                  <option value="totalCompleted">{t('filters.sortOptions.totalCompleted')}</option>
                  <option value="lastActivity">{t('filters.sortOptions.lastActivity')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2">{t('filters.order')}</label>
                <select
                  value={order}
                  onChange={(e) => {
                    setOrder(e.target.value as typeof order);
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="asc">{t('filters.orderOptions.asc')}</option>
                  <option value="desc">{t('filters.orderOptions.desc')}</option>
                </select>
              </div>
            </div>

            {/* Custom date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2">
                  {t('filters.startDate')}
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setActivePeriod('custom');
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2">
                  {t('filters.endDate')}
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setActivePeriod('custom');
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {searchTerm && filteredUsers.length > 0 && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
            <Search size={16} className="text-green-400" />
            <p className="text-sm text-green-300">
              {filteredUsers.length === 1
                ? t('search.foundSingle', { count: filteredUsers.length, term: searchTerm })
                : t('search.foundMultiple', { count: filteredUsers.length, term: searchTerm })}
            </p>
          </div>
        )}
        {filteredUsers.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <Gamepad2 size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              {searchTerm ? t('search.noResults') : t('search.noStudents')}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? t('search.noResultsDescription', { term: searchTerm })
                : t('search.noStudentsDescription')}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.userId}
              className="bg-gray-800 rounded-lg p-4 sm:p-6 hover:bg-gray-750 transition-colors relative"
            >
              <div className="flex flex-col gap-3 mb-4">
                {/* Header - Name and Email */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-secondary font-bold text-base sm:text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-white truncate">{user.name}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* View button - desktop */}
                  <button
                    onClick={() => handleViewUser(user.userId)}
                    className="hidden sm:block p-2 bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-colors"
                    title={t('actions.viewDetails')}
                  >
                    <Eye size={18} className="text-secondary" />
                  </button>
                </div>

                {/* Status badges - mobile version */}
                <div className="flex items-center justify-between sm:hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`px-2 py-1 rounded-full text-[11px] font-medium ${getPerformanceColor(user.performanceLevel)}`}>
                      {getPerformanceText(user.performanceLevel)}
                    </div>
                    <div className={`flex items-center gap-1 text-xs ${getActivityColor(user.activityStatus)}`}>
                      <Activity size={14} />
                      {getActivityText(user.activityStatus)}
                    </div>
                  </div>

                  {/* View button - mobile */}
                  <button
                    onClick={() => handleViewUser(user.userId)}
                    className="p-1.5 bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-colors"
                    title={t('actions.viewDetails')}
                  >
                    <Eye size={16} className="text-secondary" />
                  </button>
                </div>

                {/* Status badges - desktop version */}
                <div className="hidden sm:flex sm:absolute sm:top-6 sm:right-6 items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(user.performanceLevel)}`}>
                    {getPerformanceText(user.performanceLevel)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${getActivityColor(user.activityStatus)}`}>
                    <Activity size={16} />
                    {getActivityText(user.activityStatus)}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">
                    {user.stats.successRate.toFixed(1)}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.successRate')}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">
                    {user.stats.totalCompleted}{user.stats.totalAvailable ? `/${user.stats.totalAvailable}` : ''}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.completed')}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">
                    {user.stats.totalAttempted}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.attempted')}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">
                    {user.stats.averageAttempts.toFixed(1)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.avgAttempts')}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">
                    {user.recentActivity?.last7Days ?? '-'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.last7Days')}</p>
                </div>
              </div>

              {/* Last Activity */}
              {user.stats.lastActivityAt && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={14} />
                  {t('stats.lastActivity')}: {format(new Date(user.stats.lastActivityAt), "PPP 'às' HH:mm", { locale: getDateLocale() })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {stats.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => {
              const newPage = Math.max(1, page - 1);
              setPage(newPage);
              fetchStats(searchTerm, newPage);
            }}
            disabled={!stats.pagination.hasPrevious}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            {t('pagination.previous')}
          </button>

          <span className="text-gray-300">
            {t('pagination.pageOf', { current: stats.pagination.page, total: stats.pagination.totalPages })}
          </span>

          <button
            onClick={() => {
              const newPage = page + 1;
              setPage(newPage);
              fetchStats(searchTerm, newPage);
            }}
            disabled={!stats.pagination.hasNext}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('pagination.next')}
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
