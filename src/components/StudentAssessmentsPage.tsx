// /src/components/StudentAssessmentsPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Eye,
  Calendar,
  User,
  RefreshCw,
  ChevronRight,
  Filter,
  Search,
  BookOpen,
  GraduationCap,
  Target,
  BarChart,
  TrendingUp,
  List,
  Grid,
} from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  type: 'PROVA_ABERTA';
  moduleId?: string;
  moduleName?: string;
  lessonId?: string;
  lessonName?: string;
}

interface Answer {
  id: string;
  questionId: string;
  questionText: string;
  studentAnswer: string;
  tutorFeedback?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  score?: number;
  answeredAt: string;
  reviewedAt?: string;
}

interface StudentAttempt {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
  submittedAt?: string;
  gradedAt?: string;
  assessment: Assessment;
  totalQuestions: number;
  answeredQuestions: number;
  pendingReview: number;
  reviewedQuestions: number;
  correctAnswers?: number;
  scorePercentage?: number;
  passed?: boolean;
  answers?: Answer[];
}

interface StudentAssessmentsPageProps {
  userId: string;
  locale: string;
}

export default function StudentAssessmentsPage({ userId, locale }: StudentAssessmentsPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<StudentAttempt | null>(null);
  
  // Filtros
  const [filter, setFilter] = useState<'all' | 'pending-student' | 'pending-tutor' | 'approved' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<'assessment' | 'module' | 'status'>('assessment');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  const fetchAttempts = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`${apiUrl}/attempts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar avaliações');
      }

      const data = await response.json();
      console.log('StudentAssessmentsPage - API Response:', data);
      console.log('StudentAssessmentsPage - User ID:', userId);
      
      // Filtrar apenas PROVA_ABERTA e tentativas do usuário atual
      const userOpenAttempts = (data.attempts || []).filter((attempt: any) => 
        attempt.student?.id === userId && attempt.assessment?.type === 'PROVA_ABERTA'
      );
      
      console.log('StudentAssessmentsPage - Filtered user open attempts:', userOpenAttempts.length);
      
      // Para cada tentativa, buscar os detalhes reais usando o endpoint /results
      const attemptsWithDetails = await Promise.all(
        userOpenAttempts.map(async (attempt: any) => {
          try {
            const resultsResponse = await fetch(`${apiUrl}/attempts/${attempt.id}/results`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              credentials: 'include',
            });
            
            if (resultsResponse.ok) {
              const resultsData = await resultsResponse.json();
              return {
                ...attempt,
                results: resultsData.results,
                answers: resultsData.answers
              };
            }
          } catch (error) {
            console.error(`Error fetching results for attempt ${attempt.id}:`, error);
          }
          return attempt;
        })
      );
      
      // Mapear e enriquecer os dados
      const mappedAttempts = attemptsWithDetails.map((attempt: any) => {
        const totalQuestions = attempt.results?.totalQuestions || attempt.totalOpenQuestions || 0;
        
        // Count rejected questions that need new answers from student
        let pendingReview = 0;
        let reviewedQuestions = 0;
        
        if (attempt.answers && Array.isArray(attempt.answers)) {
          // Para o aluno:
          // - pendingReview = questões rejeitadas que precisam ser respondidas novamente
          // - reviewedQuestions = questões aprovadas pelo professor
          pendingReview = attempt.answers.filter((answer: any) => 
            answer.isCorrect === false
          ).length;
          
          reviewedQuestions = attempt.answers.filter((answer: any) => 
            answer.isCorrect === true
          ).length;
        } else {
          // Fallback
          const pendingAnswers = attempt.pendingAnswers || 0;
          pendingReview = pendingAnswers;
          reviewedQuestions = totalQuestions - pendingAnswers;
        }
        
        return {
          id: attempt.id,
          status: attempt.status,
          submittedAt: attempt.submittedAt,
          gradedAt: attempt.gradedAt,
          assessment: {
            id: attempt.assessment?.id || '',
            title: attempt.assessment?.title || 'Avaliação',
            type: 'PROVA_ABERTA' as const,
            moduleId: attempt.assessment?.moduleId,
            moduleName: attempt.assessment?.moduleName || 'Módulo',
            lessonId: attempt.assessment?.lessonId,
            lessonName: attempt.assessment?.lessonName || 'Aula',
          },
          totalQuestions,
          answeredQuestions: totalQuestions,
          pendingReview,
          reviewedQuestions,
          correctAnswers: reviewedQuestions, // Use reviewed questions as correct answers
          scorePercentage: attempt.results?.scorePercentage || ((reviewedQuestions / totalQuestions) * 100),
          passed: attempt.results?.passed || (reviewedQuestions / totalQuestions >= 0.7),
          answers: attempt.answers || [],
        };
      });

      // Deduplicar tentativas
      const uniqueAttempts = mappedAttempts.reduce((acc, attempt) => {
        const key = `${userId}-${attempt.assessment.id}`;
        const existing = acc[key];
        
        if (!existing || new Date(attempt.submittedAt) > new Date(existing.submittedAt)) {
          acc[key] = attempt;
        }
        
        return acc;
      }, {} as Record<string, StudentAttempt>);

      setAttempts(Object.values(uniqueAttempts));
    } catch (error) {
      console.error('Error fetching attempts:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar suas avaliações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [userId]);

  const getStatusInfo = (attempt: StudentAttempt) => {
    if (attempt.status === 'SUBMITTED' && attempt.reviewedQuestions > 0 && attempt.pendingReview > 0) {
      // Algumas questões foram rejeitadas - aguardando aluno
      return {
        text: 'Aguardando sua resposta',
        color: 'text-orange-400',
        bgColor: 'bg-orange-900/20 border-orange-500/30',
        icon: <User size={16} />,
        priority: 'high'
      };
    } else if (attempt.status === 'SUBMITTED' && attempt.pendingReview > 0) {
      // Primeira submissão - aguardando tutor
      return {
        text: 'Aguardando revisão',
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20 border-blue-500/30',
        icon: <Eye size={16} />,
        priority: 'medium'
      };
    } else if (attempt.status === 'GRADED' || (attempt.status === 'SUBMITTED' && attempt.pendingReview === 0)) {
      // Todas as questões aprovadas
      return {
        text: 'Concluída',
        color: 'text-green-400',
        bgColor: 'bg-green-900/20 border-green-500/30',
        icon: <CheckCircle size={16} />,
        priority: 'low'
      };
    }
    
    return {
      text: attempt.status,
      color: 'text-gray-400',
      bgColor: 'bg-gray-900/20 border-gray-500/30',
      icon: <FileText size={16} />,
      priority: 'low'
    };
  };

  const filteredAttempts = attempts.filter(attempt => {
    const matchesSearch = 
      attempt.assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.assessment.moduleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.assessment.lessonName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const status = getStatusInfo(attempt);
    
    switch (filter) {
      case 'pending-student':
        return status.text === 'Aguardando sua resposta';
      case 'pending-tutor':
        return status.text === 'Aguardando revisão';
      case 'approved':
        return status.text === 'Concluída' && attempt.passed;
      case 'completed':
        return status.text === 'Concluída';
      default:
        return true;
    }
  });

  const groupedAttempts = filteredAttempts.reduce((groups, attempt) => {
    let key: string;
    
    switch (groupBy) {
      case 'module':
        key = attempt.assessment.moduleId || 'sem-modulo';
        break;
      case 'status':
        key = getStatusInfo(attempt).text;
        break;
      default:
        key = attempt.assessment.id;
    }
    
    if (!groups[key]) {
      groups[key] = {
        name: groupBy === 'module' ? attempt.assessment.moduleName || 'Sem Módulo' :
              groupBy === 'status' ? key : attempt.assessment.title,
        attempts: []
      };
    }
    
    groups[key].attempts.push(attempt);
    return groups;
  }, {} as Record<string, { name: string; attempts: StudentAttempt[] }>);

  const handleViewDetails = (attemptId: string) => {
    router.push(`/${locale}/assessments/${attemptId}`);
  };

  const handleRetakeAssessment = (assessmentId: string) => {
    // TODO: Implementar navegação para refazer a prova
    console.log('Retake assessment:', assessmentId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(
      locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'it-IT',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-gray-300">Carregando suas avaliações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <GraduationCap size={32} className="text-secondary" />
              Minhas Avaliações
            </h1>
            <p className="text-gray-300 mt-2">
              Acompanhe o progresso de suas provas abertas
            </p>
          </div>
          <button
            onClick={() => fetchAttempts(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-3">
              <User size={24} className="text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-orange-400">
                  {attempts.filter(a => getStatusInfo(a).text === 'Aguardando sua resposta').length}
                </p>
                <p className="text-gray-300 text-sm">Aguardando Você</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-3">
              <Eye size={24} className="text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {attempts.filter(a => getStatusInfo(a).text === 'Aguardando revisão').length}
                </p>
                <p className="text-gray-300 text-sm">Em Revisão</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {attempts.filter(a => getStatusInfo(a).text === 'Concluída' && a.passed).length}
                </p>
                <p className="text-gray-300 text-sm">Aprovadas</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp size={24} className="text-secondary" />
              <div>
                <p className="text-2xl font-bold text-secondary">
                  {attempts.length > 0 
                    ? Math.round(
                        attempts.filter(a => a.passed).length / attempts.length * 100
                      )
                    : 0}%
                </p>
                <p className="text-gray-300 text-sm">Taxa de Aprovação</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-secondary" />
              <div>
                <p className="text-2xl font-bold text-secondary">
                  {attempts.length}
                </p>
                <p className="text-gray-300 text-sm">Total de Provas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-secondary focus:outline-none"
                >
                  <option value="all">Todas</option>
                  <option value="pending-student">Aguardando Minha Resposta</option>
                  <option value="pending-tutor">Aguardando Revisão</option>
                  <option value="approved">Aprovadas</option>
                  <option value="completed">Concluídas</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-gray-400" />
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-secondary focus:outline-none"
                >
                  <option value="assessment">Por Avaliação</option>
                  <option value="module">Por Módulo</option>
                  <option value="status">Por Status</option>
                </select>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por prova, módulo ou aula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:border-secondary focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-secondary text-primary' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-secondary text-primary' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredAttempts.length === 0 ? (
          <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-lg">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-300 mb-2">Nenhuma avaliação encontrada</p>
            <p className="text-sm text-gray-400">
              Tente ajustar os filtros ou faça uma nova busca
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAttempts).map(([groupKey, group]) => (
              <div key={groupKey} className="space-y-4">
                {groupBy !== 'assessment' && (
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    {groupBy === 'status' && getStatusInfo(group.attempts[0]).icon}
                    {group.name}
                    <span className="text-sm text-gray-400">
                      ({group.attempts.length})
                    </span>
                  </h2>
                )}

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.attempts.map((attempt) => {
                      const status = getStatusInfo(attempt);
                      
                      return (
                        <div
                          key={attempt.id}
                          className={`p-4 rounded-lg border-2 ${status.bgColor} hover:border-opacity-60 transition-all cursor-pointer`}
                          onClick={() => handleViewDetails(attempt.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-lg">
                                {attempt.assessment.title}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {attempt.assessment.moduleName} • {attempt.assessment.lessonName}
                              </p>
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.bgColor}`}>
                              {status.icon}
                              {status.text}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-400">Questões</p>
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-semibold text-white">
                                  {attempt.totalQuestions}
                                </p>
                                <div className="flex gap-1">
                                  {Array.from({ length: attempt.totalQuestions }, (_, i) => (
                                    <div
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${
                                        i < attempt.reviewedQuestions
                                          ? 'bg-green-400'
                                          : i < attempt.answeredQuestions
                                          ? 'bg-orange-400'
                                          : 'bg-gray-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {attempt.scorePercentage !== undefined && (
                              <div>
                                <p className="text-xs text-gray-400">Nota</p>
                                <p className={`text-lg font-semibold ${
                                  attempt.passed ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {attempt.scorePercentage}%
                                </p>
                              </div>
                            )}
                          </div>

                          {attempt.pendingReview > 0 && (
                            <div className="bg-black/20 rounded-lg p-2 mb-3">
                              <p className="text-xs text-orange-400 font-medium">
                                {attempt.pendingReview} questão(ões) pendente(s) de resposta
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(attempt.submittedAt)}
                            </div>
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.attempts.map((attempt) => {
                      const status = getStatusInfo(attempt);
                      
                      return (
                        <div
                          key={attempt.id}
                          className={`p-4 rounded-lg border-2 ${status.bgColor} hover:border-opacity-60 transition-all cursor-pointer`}
                          onClick={() => handleViewDetails(attempt.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                                <FileText size={24} className="text-secondary" />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-semibold text-white">
                                  {attempt.assessment.title}
                                </h3>
                                <p className="text-sm text-gray-400">
                                  {attempt.assessment.moduleName} • {attempt.assessment.lessonName}
                                </p>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <p className="text-xs text-gray-400">Questões</p>
                                  <p className="text-lg font-semibold text-white">
                                    {attempt.reviewedQuestions}/{attempt.totalQuestions}
                                  </p>
                                </div>
                                
                                {attempt.scorePercentage !== undefined && (
                                  <div className="text-center">
                                    <p className="text-xs text-gray-400">Nota</p>
                                    <p className={`text-lg font-semibold ${
                                      attempt.passed ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {attempt.scorePercentage}%
                                    </p>
                                  </div>
                                )}

                                <div className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm ${status.bgColor}`}>
                                  {status.icon}
                                  {status.text}
                                </div>
                              </div>
                            </div>

                            <ChevronRight size={20} className="text-gray-400 ml-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}