// /src/components/TutorFlashcardStats.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/stores/auth.store';

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


export default function TutorFlashcardStats({ }: TutorFlashcardStatsProps) {
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();
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
        return 'Excelente';
      case 'good':
        return 'Bom';
      case 'needs-attention':
        return 'Precisa Atenção';
      case 'critical':
        return 'Crítico';
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
        return 'Ativo';
      case 'moderate':
        return 'Moderado';
      case 'inactive':
        return 'Inativo';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-secondary animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Carregando estatísticas de flashcards...</p>
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
          <p className="text-gray-400 text-sm">Total de Alunos</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-green-400" />
            <span className="text-3xl font-bold text-white">
              {stats.summary.activeUsers}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Alunos Ativos</p>
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
          <p className="text-gray-400 text-sm">Taxa Média de Domínio</p>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
            <div className="font-semibold mb-1">Como é calculado:</div>
            <div>% de flashcards marcados como &quot;Já sei&quot; (fácil)</div>
            <div className="text-gray-300 mt-1">Média de todos os alunos</div>
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
          <p className="text-gray-400 text-sm">Distribuição de Performance</p>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="font-semibold mb-1">Níveis de Performance:</div>
            <div className="space-y-1">
              <div><span className="text-green-400">●</span> Excelente: ≥80% domínio</div>
              <div><span className="text-blue-400">●</span> Bom: 60-79% domínio</div>
              <div><span className="text-yellow-400">●</span> Atenção: 40-59% domínio</div>
              <div><span className="text-red-400">●</span> Crítico: &lt;40% domínio</div>
            </div>
            <div className="absolute top-full right-4 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <Filter size={20} />
            <span>Filtros</span>
            {(dateFrom || dateTo) && (
              <span className="ml-2 px-2 py-0.5 bg-secondary/30 text-secondary text-xs rounded-full">
                {dateFrom && dateTo ? '2' : '1'}
              </span>
            )}
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar aluno no sistema..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-gray-700 text-white pl-10 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary w-72"
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
              <label className="block text-sm text-gray-400 mb-2">Período Rápido</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    setDateFrom(format(today, 'yyyy-MM-dd'));
                    setDateTo(format(today, 'yyyy-MM-dd'));
                    setActivePeriod('today');
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activePeriod === '7days'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Últimos 7 dias
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activePeriod === '30days'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Últimos 30 dias
                </button>
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setActivePeriod('all');
                    setPage(1);
                    fetchStats(searchTerm, 1);
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activePeriod === 'all'
                      ? 'bg-secondary text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Todos os períodos
                </button>
              </div>
            </div>

            {/* Custom date range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
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
                <label className="block text-sm text-gray-400 mb-2">
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
              {filteredUsers.length} {filteredUsers.length === 1 ? 'aluno encontrado' : 'alunos encontrados'} para &quot;{searchTerm}&quot;
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
                : 'Não há alunos com atividade em flashcards para os filtros selecionados.'}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.userId}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                    <span className="text-secondary font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
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
                  <p className="text-xs text-gray-400">Taxa de Domínio</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">
                    {user.stats.uniqueFlashcardsReviewed}/{user.stats.totalFlashcards}
                  </p>
                  <p className="text-xs text-gray-400">Cards Revisados</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <p className="text-2xl font-bold text-white">{user.stats.studyStreak}</p>
                  </div>
                  <p className="text-xs text-gray-400">Dias de Sequência</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-green-400">{user.stats.easyCount}</p>
                  <p className="text-lg font-bold text-red-400">{user.stats.hardCount}</p>
                  <p className="text-xs text-gray-400">Fácil / Difícil</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-2xl font-bold text-white">
                    {user.recentActivity.last7Days}
                  </p>
                  <p className="text-xs text-gray-400">Últimos 7 dias</p>
                </div>
              </div>

              {/* Argument Stats */}
              {user.argumentStats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Performance por Argumento:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {user.argumentStats.slice(0, 4).map((arg) => (
                      <div key={arg.argumentId} className="flex items-center justify-between bg-gray-700/30 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-300 truncate flex-1 mr-2">
                          {arg.argumentTitle}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-400">
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
                      +{user.argumentStats.length - 4} argumentos
                    </p>
                  )}
                </div>
              )}

              {/* Last Activity */}
              {user.stats.lastActivityDate && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={14} />
                  Última atividade: {format(new Date(user.stats.lastActivityDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
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
            Anterior
          </button>

          <span className="text-gray-300">
            Página {stats.pagination.page} de {stats.pagination.totalPages}
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
            Próxima
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}