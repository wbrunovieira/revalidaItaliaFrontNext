// /src/components/TutorFlashcardStats.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import {
  Brain,
  Users,
  Target,
  Zap,
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
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { useAuth } from '@/stores/auth.store';
import FlashcardStatsModal from './FlashcardStatsModal';

// Types based on API documentation
interface FlashcardUserStats {
  userId: string;
  name: string;
  email: string;
  stats: {
    totalFlashcards: number;
    uniqueFlashcardsReviewed: number;
    totalInteractions: number;
    easyCount: number;
    hardCount: number;
    neutralCount: number;
    overallMasteryRate: number;
    totalResets: number;
    studyStreak: number;
    lastActivityDate: string | null;
  };
  recentActivity: {
    todayCount: number;
    last7Days: number;
    last30Days: number;
  };
  performanceLevel: 'excellent' | 'good' | 'needs-attention' | 'critical';
  activityStatus: 'active' | 'moderate' | 'inactive';
  argumentStats: Array<{
    argumentId: string;
    argumentTitle: string;
    totalFlashcards: number;
    reviewedFlashcards: number;
    masteryRate: number;
    easyCount: number;
    hardCount: number;
    neutralCount: number;
  }>;
}

interface StatsResponse {
  success: boolean;
  data: {
    users: FlashcardUserStats[];
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
      averageMasteryRate: number;
      performanceDistribution: {
        excellent: number;
        good: number;
        needsAttention: number;
        critical: number;
      };
    };
  };
}

interface TutorFlashcardStatsProps {
  locale: string;
}


export default function TutorFlashcardStats({ locale }: TutorFlashcardStatsProps) {
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();
  const t = useTranslations('Tutor.tutorFlashcards');
  
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
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  const fetchStats = useCallback(async (searchQuery?: string, newPage?: number) => {
    try {
      setLoading(true);
      if (!token || !isAuthenticated) {
        throw new Error('No authentication token');
        return;
      }

      const params = new URLSearchParams();
      params.append('page', (newPage || page).toString());
      params.append('limit', '20');
      
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      // Add search parameter if provided
      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      console.log('Fetching flashcard stats with params:', params.toString());
      console.log('URL:', `${apiUrl}/api/v1/flashcards/stats/users?${params}`);

      const response = await fetch(
        `${apiUrl}/api/v1/flashcards/stats/users?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to fetch flashcard stats');
      }

      const data: StatsResponse = await response.json();
      console.log('Flashcard stats response:', data);
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching flashcard stats:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas de flashcards.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl, page, dateFrom, dateTo, toast, token, isAuthenticated]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handle search with debounce for backend search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(true);
    
    // Clear previous timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }
    
    // Set new timer for debounced search
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page on new search
      fetchStats(value, 1).finally(() => setIsSearching(false));
    }, 500); // 500ms debounce
    
    setSearchDebounceTimer(timer);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  // Users are now filtered on the backend
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
        <Brain size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Erro ao carregar dados
        </h3>
        <p className="text-gray-500">
          Não foi possível carregar as estatísticas. Tente novamente.
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
              ? `${Math.round((stats.summary.activeUsers / stats.summary.totalUsers) * 100)}% do total`
              : '0%'}
          </p>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-semibold mb-1">Critério de Atividade:</div>
            <div>Alunos que estudaram nos últimos 7 dias</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-yellow-400" />
            <span className="text-3xl font-bold text-white">
              {stats.summary.averageMasteryRate.toFixed(1)}%
            </span>
          </div>
          <p className="text-gray-400 text-sm">{t('stats.averageMastery')}</p>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
            <div className="font-semibold mb-1">Como é calculado:</div>
            <div>% de flashcards marcados como &quot;Já sei&quot; (fácil)</div>
            <div className="text-gray-300 mt-1">{t('stats.averageAllStudents')}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
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
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="font-semibold mb-1">{t('stats.performanceLevels')}</div>
            <div className="space-y-1">
              <div><span className="text-green-400">●</span> {t('legend.excellent')}</div>
              <div><span className="text-blue-400">●</span> {t('legend.good')}</div>
              <div><span className="text-yellow-400">●</span> {t('legend.attention')}</div>
              <div><span className="text-red-400">●</span> {t('legend.critical')}</div>
            </div>
            <div className="absolute top-full right-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
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
                  Hoje
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const sixDaysAgo = subDays(today, 6); // 6 dias atrás + hoje = 7 dias
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
                    const twentyNineDaysAgo = subDays(today, 29); // 29 dias atrás + hoje = 30 dias
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

            {/* Custom date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-2">
                  Data Inicial
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
                  Data Final
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
            <Brain size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum aluno encontrado'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `Nenhum aluno encontrado com &quot;${searchTerm}&quot; no nome ou email.`
                : t('search.noStudentsActivity')}
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

                  {/* View button - only visible on desktop */}
                  <button
                    onClick={() => {
                      setSelectedUser({ id: user.userId, name: user.name });
                      setShowStatsModal(true);
                    }}
                    className="hidden sm:block p-2 bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-colors"
                    title="Ver detalhes"
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

                  {/* View button - mobile version */}
                  <button
                    onClick={() => {
                      setSelectedUser({ id: user.userId, name: user.name });
                      setShowStatsModal(true);
                    }}
                    className="p-1.5 bg-secondary/20 hover:bg-secondary/30 rounded-lg transition-colors"
                    title="Ver detalhes"
                  >
                    <Eye size={16} className="text-secondary" />
                  </button>
                </div>

                {/* Status badges - desktop version (absolute positioned) */}
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
                    {user.stats.overallMasteryRate.toFixed(1)}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.masteryRate')}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">
                    {user.stats.uniqueFlashcardsReviewed}/{user.stats.totalFlashcards}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.cardsReviewed')}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <p className="text-2xl font-bold text-white">{user.stats.studyStreak}</p>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.studyStreak')}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-green-400">{user.stats.easyCount}</p>
                  <p className="text-lg font-bold text-red-400">{user.stats.hardCount}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.easyHard')}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">
                    {user.recentActivity.last7Days}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400">{t('stats.last7Days')}</p>
                </div>
              </div>

              {/* Argument Stats */}
              {user.argumentStats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs sm:text-sm text-gray-400 mb-2">{t('stats.performanceByArgument')}</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {user.argumentStats.slice(0, 4).map((arg) => (
                      <div key={arg.argumentId} className="flex items-center justify-between bg-gray-700/30 rounded-lg px-2 sm:px-3 py-2">
                        <span className="text-xs sm:text-sm text-gray-300 truncate flex-1 mr-2">
                          {arg.argumentTitle}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="text-[10px] sm:text-xs text-gray-400">
                            {arg.reviewedFlashcards}/{arg.totalFlashcards}
                          </div>
                          <div className={`text-xs font-medium px-2 py-1 rounded ${
                            arg.masteryRate >= 80 ? 'bg-green-900/30 text-green-400' :
                            arg.masteryRate >= 60 ? 'bg-blue-900/30 text-blue-400' :
                            arg.masteryRate >= 40 ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-red-900/30 text-red-400'
                          }`}>
                            {arg.masteryRate.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {user.argumentStats.length > 4 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {t('stats.moreArguments', { count: user.argumentStats.length - 4 })}
                    </p>
                  )}
                </div>
              )}

              {/* Last Activity */}
              {user.stats.lastActivityDate && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={14} />
                  {t('stats.lastActivity')}: {format(new Date(user.stats.lastActivityDate), "PPP 'às' HH:mm", { locale: getDateLocale() })}
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

      {/* Flashcard Stats Modal */}
      {selectedUser && (
        <FlashcardStatsModal
          isOpen={showStatsModal}
          onClose={() => {
            setShowStatsModal(false);
            setSelectedUser(null);
          }}
          userId={selectedUser.id}
          userName={selectedUser.name}
          locale={locale}
        />
      )}
    </div>
  );
}