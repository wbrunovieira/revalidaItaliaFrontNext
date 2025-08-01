// src/app/[locale]/assessments/page.tsx
'use client';

import {
  useEffect,
  useState,
  use,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import NavSidebar from '@/components/NavSidebar';
import StudentQuizResults from '@/components/StudentQuizResults';
import StudentAssessmentStatus from '@/components/StudentAssessmentStatus';
import {
  FileText,
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Play,
  ArrowRight,
  Trophy,
  BookOpen,
  PenTool,
  Eye,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON' | null;
  passingScore?: number | null;
  timeLimitInMinutes?: number | null;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  lessonId?: string | null;
  lessonTitle?: string | null;
  createdAt: string;
  updatedAt: string;
  // TODO: API needs to return these fields for navigation
  // courseSlug?: string;
  // moduleSlug?: string;
}

interface StudentAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'GRADED';
  score?: number;
  totalQuestions: number;
  answeredQuestions: number;
  startedAt: string;
  completedAt?: string;
  gradedAt?: string;
}

interface AssessmentAttemptStatus {
  hasActiveAttempt: boolean;
  canStartNewAttempt: boolean;
  attemptId?: string;
  status?:
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'GRADING'
    | 'GRADED';
  score?: number;
  submittedAt?: string;
  gradedAt?: string;
  totalQuestions: number;
  answeredQuestions: number;
  pendingReviewQuestions: number;
  rejectedQuestions: number;
  needsStudentAction: boolean;
}


export default function AssessmentsPage({
  params,
}: PageProps) {
  const router = useRouter();
  const { locale } = use(params);
  const t = useTranslations('Assessments');
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<
    Assessment[]
  >([]);
  const [filteredAssessments, setFilteredAssessments] =
    useState<Assessment[]>([]);
  const [selectedType, setSelectedType] =
    useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    quiz: 0,
    simulado: 0,
    provaAberta: 0,
  });
  const [activeTab, setActiveTab] = useState<
    'available' | 'results' | 'openExams'
  >('available');
  const [attemptIds, setAttemptIds] = useState<string[]>(
    []
  );
  const [userId, setUserId] = useState<string>('');
  const [assessmentStatuses, setAssessmentStatuses] =
    useState<Map<string, AssessmentAttemptStatus>>(
      new Map()
    );
  const [checkingStatuses, setCheckingStatuses] =
    useState(false);

  const calculateStats = useCallback(
    (assessments: Assessment[]) => {
      const quiz = assessments.filter(
        a => a.type === 'QUIZ'
      ).length;
      const simulado = assessments.filter(
        a => a.type === 'SIMULADO'
      ).length;
      const provaAberta = assessments.filter(
        a => a.type === 'PROVA_ABERTA'
      ).length;

      setStats({
        total: assessments.length,
        quiz,
        simulado,
        provaAberta,
      });
    },
    []
  );

  // Check status of all assessments using the new API
  const checkAssessmentStatuses = useCallback(
    async (assessments: Assessment[], token: string, currentUserId: string) => {
      if (!token || assessments.length === 0 || !currentUserId) return;

      console.log(
        '🔍 Iniciando verificação de status para',
        assessments.length,
        'assessments'
      );
      setCheckingStatuses(true);
      try {
        const statusMap = new Map<
          string,
          AssessmentAttemptStatus
        >();

        // Check status for each assessment
        await Promise.all(
          assessments.map(async assessment => {
            try {
              console.log(
                `📋 Verificando assessment ${assessment.id} - ${assessment.title} (${assessment.type})`
              );
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments/${assessment.id}/attempt-status`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (response.ok) {
                const statusData: AssessmentAttemptStatus =
                  await response.json();
                console.log(
                  `✅ Status completo para ${assessment.title}:`,
                  statusData
                );
                
                // Se está GRADED, buscar TODAS as tentativas para pegar a melhor nota
                if (statusData.status === 'GRADED') {
                  console.log(
                    `🎯 Assessment GRADED - ${assessment.title} (type: ${assessment.type})`
                  );
                  
                  try {
                    // Para QUIZ/SIMULADO, buscar todas as tentativas e pegar a melhor nota
                    if (assessment.type === 'QUIZ' || assessment.type === 'SIMULADO') {
                      console.log(
                        `🔍 Buscando TODAS as tentativas para ${assessment.title} (${assessment.type}) para encontrar a melhor nota`
                      );
                      
                      // Buscar todas as tentativas do usuário
                      const attemptsResponse = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts?identityId=${currentUserId}`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                        }
                      );
                      
                      if (attemptsResponse.ok) {
                        const attemptsData = await attemptsResponse.json();
                        
                        // Filtrar tentativas GRADED deste assessment
                        const gradedAttempts = attemptsData.attempts?.filter(
                          (attempt: StudentAttempt) => 
                            attempt.assessmentId === assessment.id && 
                            attempt.status === 'GRADED'
                        ) || [];
                        
                        console.log(
                          `📊 Encontradas ${gradedAttempts.length} tentativas GRADED para ${assessment.title}`
                        );
                        
                        // Buscar os resultados de cada tentativa e encontrar a melhor nota
                        let bestScore = 0;
                        let bestAttemptId = statusData.attemptId;
                        
                        for (const attempt of gradedAttempts) {
                          try {
                            const resultsResponse = await fetch(
                              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/${attempt.id}/results`,
                              {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                              }
                            );
                            
                            if (resultsResponse.ok) {
                              const resultsData = await resultsResponse.json();
                              const score = resultsData.results?.scorePercentage || 0;
                              
                              console.log(
                                `  - Attempt ${attempt.id}: score = ${score}%`
                              );
                              
                              if (score > bestScore) {
                                bestScore = score;
                                bestAttemptId = attempt.id;
                              }
                            }
                          } catch (error) {
                            console.error(`Error fetching results for attempt ${attempt.id}:`, error);
                          }
                        }
                        
                        statusData.score = bestScore;
                        statusData.attemptId = bestAttemptId;
                        
                        console.log(
                          `✅ Melhor nota para ${assessment.title}: ${bestScore}% (attemptId: ${bestAttemptId})`
                        );
                      }
                    } else if (statusData.attemptId) {
                      // Para PROVA_ABERTA, usar apenas a tentativa retornada
                      console.log(
                        `🔍 Buscando resultado da única tentativa para ${assessment.title} - attemptId: ${statusData.attemptId}`
                      );
                      
                      const resultsResponse = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/${statusData.attemptId}/results`,
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                        }
                      );
                      
                      if (resultsResponse.ok) {
                        const resultsData = await resultsResponse.json();
                        
                        if (resultsData.results?.scorePercentage !== undefined) {
                          statusData.score = resultsData.results.scorePercentage;
                          console.log(
                            `✅ Score para PROVA_ABERTA: ${statusData.score}%`
                          );
                        }
                      }
                    }
                    
                    // Debug da comparação final
                    if (assessment.passingScore !== null && assessment.passingScore !== undefined && statusData.score !== undefined) {
                      console.log(
                        `🔍 Comparação final de aprovação para ${assessment.title}: score=${statusData.score} >= passingScore=${assessment.passingScore} ? ${statusData.score >= assessment.passingScore}`
                      );
                    }
                  } catch (error) {
                    console.error(
                      `Error fetching results for assessment ${assessment.id}:`,
                      error
                    );
                  }
                }
                
                console.log(
                  `📊 Score: ${statusData.score}, PassingScore: ${assessment.passingScore}, Status: ${statusData.status}`
                );
                statusMap.set(assessment.id, statusData);
              } else {
                console.error(
                  `❌ Error fetching status for assessment ${assessment.id}:`,
                  response.status
                );
                const errorText = await response.text();
                console.error('Error response:', errorText);
              }
            } catch (error) {
              console.error(
                `❌ Error checking status for assessment ${assessment.id}:`,
                error
              );
            }
          })
        );

        console.log(
          '📊 Status map final:',
          statusMap.size,
          'assessments com status'
        );
        setAssessmentStatuses(statusMap);
      } catch (error) {
        console.error(
          '❌ Error checking assessment statuses:',
          error
        );
      } finally {
        setCheckingStatuses(false);
      }
    },
    []
  );

  const fetchAssessments = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments?page=1&limit=100`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas assessments que têm lessonId
        const assessmentsWithLesson = (data.assessments || []).filter(
          (assessment: Assessment) => assessment.lessonId !== null && assessment.lessonId !== undefined
        );
        setAssessments(assessmentsWithLesson);
        setFilteredAssessments(assessmentsWithLesson);
        calculateStats(assessmentsWithLesson);

        // Check status of all assessments
        const token = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1];

        if (token && data.assessments?.length > 0 && userId) {
          await checkAssessmentStatuses(
            data.assessments,
            token,
            userId
          );
        }
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  }, [calculateStats, checkAssessmentStatuses, userId]);

  // Function to decode JWT token
  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const jsonPayload = Buffer.from(
        base64,
        'base64'
      ).toString('utf-8');
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };

  // Fetch user attempts
  const fetchUserAttempts = useCallback(
    async (userId: string, token: string) => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          'http://localhost:3333';

        // Fetch all attempts for the user
        const response = await fetch(
          `${apiUrl}/api/v1/attempts?identityId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Filter only finalized attempts (SUBMITTED or GRADED)
          const finalizedAttempts =
            data.attempts?.filter(
              (attempt: { status: string; id: string }) =>
                attempt.status === 'SUBMITTED' ||
                attempt.status === 'GRADED'
            ) || [];

          // Extract only the IDs
          const ids = finalizedAttempts.map(
            (attempt: { id: string }) => attempt.id
          );
          setAttemptIds(ids);
        }
      } catch (error) {
        console.error(
          'Error fetching user attempts:',
          error
        );
      }
    },
    []
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          router.push(`/${locale}/login`);
          return;
        }

        // Decode token to get user ID
        const decodedToken = decodeJWT(token);
        const userIdFromToken = decodedToken?.sub;

        if (userIdFromToken) {
          setUserId(userIdFromToken);
          // Fetch both assessments and user attempts
          await Promise.all([
            fetchAssessments(),
            fetchUserAttempts(userIdFromToken, token),
          ]);
        } else {
          await fetchAssessments();
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push(`/${locale}/login`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [locale, router, fetchAssessments, fetchUserAttempts]);

  useEffect(() => {
    let filtered = assessments;

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(
        a => a.type === selectedType
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        a =>
          a.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          a.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAssessments(filtered);
  }, [selectedType, searchTerm, assessments]);

  const getAssessmentIcon = (type: string) => {
    switch (type) {
      case 'QUIZ':
        return (
          <Image
            src="/icons/quiz.svg"
            alt="Quiz"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        );
      case 'SIMULADO':
        return (
          <Image
            src="/icons/rating.svg"
            alt="Simulado"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        );
      case 'PROVA_ABERTA':
        return (
          <Image
            src="/icons/examination.svg"
            alt="Prova Aberta"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        );
      default:
        return <ClipboardList size={24} />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      QUIZ: {
        bg: 'bg-primary',
        text: 'text-accent-light',
        border: 'border-blue-500/30',
      },
      SIMULADO: {
        bg: 'bg-secondary/20',
        text: 'text-accent-light',
        border: 'border-secondary/30',
      },
      PROVA_ABERTA: {
        bg: 'bg-accent',
        text: 'text-primary',
        border: 'border-primary/40',
      },
    };

    const config =
      typeConfig[type as keyof typeof typeConfig] ||
      typeConfig['QUIZ'];

    return (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${config.bg} ${config.text} border ${config.border}`}
      >
        {t(`types.${type.toLowerCase()}`)}
      </span>
    );
  };

  const handleStartAssessment = (
    assessment: Assessment
  ) => {
    // Check if it's an open exam with status
    if (assessment.type === 'PROVA_ABERTA') {
      const status = assessmentStatuses.get(assessment.id);
      if (status && status.attemptId) {
        // If already has a status, redirect to appropriate page
        if (status.status === 'GRADED') {
          router.push(
            `/${locale}/assessments/open-exams/${status.attemptId}`
          );
        } else if (status.status === 'IN_PROGRESS') {
          // For IN_PROGRESS, redirect to the lesson page to continue
          if (assessment.lessonId) {
            router.push(
              `/${locale}/lessons/${assessment.lessonId}/assessments/${assessment.id}`
            );
          }
        } else {
          router.push(`/${locale}/assessments/open-exams`);
        }
        return;
      }
    }

    if (assessment.lessonId) {
      // Use the simplified URL pattern
      router.push(
        `/${locale}/lessons/${assessment.lessonId}/assessments/${assessment.id}`
      );
    } else {
      // For assessments without lessonId
      console.log('Assessment without lesson:', assessment);
      alert(
        'Esta avaliação não está vinculada a uma aula.'
      );
    }
  };

  if (loading) {
    return (
      <NavSidebar>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
              <p className="text-gray-300">
                {t('loading')}
              </p>
            </div>
          </div>
        </div>
      </NavSidebar>
    );
  }

  return (
    <NavSidebar>
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-300">{t('subtitle')}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-primary-dark/30 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'available'
                  ? 'bg-secondary text-primary'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen size={18} />
                {t('tabs.available')}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'results'
                  ? 'bg-secondary text-primary'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <Trophy size={18} />
                {t('tabs.results')}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('openExams')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'openExams'
                  ? 'bg-secondary text-primary'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                <PenTool size={18} />
                {t('tabs.openExams')}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'available' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-4 border border-secondary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">
                        {t('stats.total')}
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {stats.total}
                      </p>
                    </div>
                    <FileText
                      size={24}
                      className="text-secondary"
                    />
                  </div>
                </div>

                <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-4 border border-secondary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">
                        {t('types.quiz')}
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {stats.quiz}
                      </p>
                    </div>
                    <Image
                      src="/icons/quiz.svg"
                      alt="Quiz"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                  </div>
                </div>

                <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-4 border border-secondary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">
                        {t('types.simulado')}
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {stats.simulado}
                      </p>
                    </div>
                    <Image
                      src="/icons/rating.svg"
                      alt="Simulado"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                  </div>
                </div>

                <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-4 border border-secondary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">
                        {t('types.prova_aberta')}
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {stats.provaAberta}
                      </p>
                    </div>
                    <Image
                      src="/icons/examination.svg"
                      alt="Prova Aberta"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={e =>
                      setSearchTerm(e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2 bg-primary-dark/50 border border-secondary/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary/50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter
                    size={20}
                    className="text-gray-400"
                  />
                  <select
                    value={selectedType}
                    onChange={e =>
                      setSelectedType(e.target.value)
                    }
                    className="px-4 py-2 bg-primary-dark/50 border border-secondary/20 rounded-lg text-white focus:outline-none focus:border-secondary/50"
                  >
                    <option value="ALL">
                      {t('filter.all')}
                    </option>
                    <option value="QUIZ">
                      {t('filter.quiz')}
                    </option>
                    <option value="SIMULADO">
                      {t('filter.simulado')}
                    </option>
                    <option value="PROVA_ABERTA">
                      {t('filter.provaAberta')}
                    </option>
                  </select>
                </div>
              </div>

              {/* Assessments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssessments.map(assessment => {
                  console.log(
                    `\n📋 Processando assessment: ${assessment.title} (${assessment.type})`
                  );
                  return (
                    <div
                      key={assessment.id}
                      className="group bg-primary-dark/50 backdrop-blur-sm rounded-xl p-6 border border-secondary/20 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20 flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getAssessmentIcon(
                            assessment.type
                          )}
                          {getTypeBadge(assessment.type)}
                        </div>
                        {assessment.quizPosition && (
                          <span className="text-xs text-gray-400">
                            {assessment.quizPosition ===
                            'BEFORE_LESSON'
                              ? 'Antes da aula'
                              : 'Após a aula'}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-secondary transition-colors">
                        {assessment.title}
                      </h3>

                      {assessment.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {assessment.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-4">
                          {assessment.timeLimitInMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {
                                assessment.timeLimitInMinutes
                              }{' '}
                              min
                            </span>
                          )}
                          {assessment.passingScore && (
                            <span className="flex items-center gap-1">
                              <CheckCircle size={14} />
                              {assessment.passingScore}%
                            </span>
                          )}
                        </div>
                      </div>

                      {assessment.lessonTitle && (
                        <div className="mb-4 pt-4 border-t border-secondary/20">
                          <p className="text-xs text-gray-400">
                            Aula: <span className="text-white font-medium">{assessment.lessonTitle}</span>
                          </p>
                        </div>
                      )}

                      <div className="mt-auto">
                        {checkingStatuses ? (
                          <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>
                              Verificando status...
                            </span>
                          </div>
                        ) : (
                          (() => {
                            const status =
                              assessmentStatuses.get(
                                assessment.id
                              );
                            const debugInfo = {
                              assessmentTitle: assessment.title,
                              hasStatus: !!status,
                              status: status?.status,
                              canStartNewAttempt:
                                status?.canStartNewAttempt,
                              hasActiveAttempt:
                                status?.hasActiveAttempt,
                              attemptId:
                                status?.attemptId,
                              score: status?.score,
                              passingScore: assessment.passingScore,
                              shouldShowBadge: status?.score !== undefined && assessment.passingScore !== null && assessment.passingScore !== undefined,
                              passed: status?.score !== undefined && assessment.passingScore !== null && assessment.passingScore !== undefined && status.score >= assessment.passingScore,
                              type: assessment.type,
                            };
                            
                            console.log(
                              `🎯 Renderizando card para ${assessment.title}:`,
                              debugInfo
                            );
                            
                            // Log especial para badge
                            if (status?.status === 'GRADED') {
                              console.log(`🏅 Assessment GRADED - Badge info para ${assessment.title}:`, {
                                score: status?.score,
                                scoreType: typeof status?.score,
                                passingScore: assessment.passingScore,
                                passingScoreType: typeof assessment.passingScore,
                                shouldShowBadge: debugInfo.shouldShowBadge,
                                willRenderBadge: status?.score !== undefined && assessment.passingScore !== null && assessment.passingScore !== undefined,
                                comparison: status?.score !== undefined && assessment.passingScore !== null && assessment.passingScore !== undefined 
                                  ? `${status.score} >= ${assessment.passingScore} = ${status.score >= assessment.passingScore}`
                                  : 'Cannot compare - missing values',
                                passed: status?.score !== undefined && assessment.passingScore !== null && assessment.passingScore !== undefined 
                                  ? status.score >= assessment.passingScore 
                                  : false
                              });
                            }

                            // Se não há status ou pode iniciar nova tentativa (mas não está GRADED)
                            if (!status) {
                              return (
                                <button
                                  onClick={() =>
                                    handleStartAssessment(
                                      assessment
                                    )
                                  }
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-all duration-300 font-medium group/btn"
                                >
                                  <Play
                                    size={16}
                                    className="group-hover/btn:scale-110 transition-transform"
                                  />
                                  {t('startAssessment')}
                                  <ArrowRight
                                    size={16}
                                    className="group-hover/btn:translate-x-1 transition-transform"
                                  />
                                </button>
                              );
                            }

                            // Para QUIZ/SIMULADO: pode iniciar nova tentativa mesmo se já tem GRADED
                            if (
                              assessment.type !==
                                'PROVA_ABERTA' &&
                              status.canStartNewAttempt &&
                              !status.hasActiveAttempt &&
                              status.status !== 'GRADED' // Não mostrar este botão se já foi concluído
                            ) {
                              return (
                                <button
                                  onClick={() =>
                                    handleStartAssessment(
                                      assessment
                                    )
                                  }
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-all duration-300 font-medium group/btn"
                                >
                                  <Play
                                    size={16}
                                    className="group-hover/btn:scale-110 transition-transform"
                                  />
                                  {t('startAssessment')}
                                  <ArrowRight
                                    size={16}
                                    className="group-hover/btn:translate-x-1 transition-transform"
                                  />
                                </button>
                              );
                            }

                            // Para PROVA_ABERTA: se ainda não foi iniciada
                            if (
                              assessment.type ===
                                'PROVA_ABERTA' &&
                              status.canStartNewAttempt &&
                              !status.hasActiveAttempt &&
                              !status.status
                            ) {
                              return (
                                <button
                                  onClick={() =>
                                    handleStartAssessment(
                                      assessment
                                    )
                                  }
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-all duration-300 font-medium group/btn"
                                >
                                  <Play
                                    size={16}
                                    className="group-hover/btn:scale-110 transition-transform"
                                  />
                                  {t('startAssessment')}
                                  <ArrowRight
                                    size={16}
                                    className="group-hover/btn:translate-x-1 transition-transform"
                                  />
                                </button>
                              );
                            }

                            // Renderizar status e ações baseado no estado
                            return (
                              <>
                                {/* Status Badge com informações detalhadas */}
                                <div className="mb-3 p-3 rounded-lg bg-gray-800 space-y-2">
                                  {/* Status principal */}
                                  <div className="flex items-center justify-between">
                                    {(() => {
                                      if (
                                        status.status ===
                                        'IN_PROGRESS'
                                      ) {
                                        return (
                                          <div className="flex items-center gap-2 text-yellow-400">
                                            <PenTool
                                              size={16}
                                            />
                                            <span className="text-sm font-medium">
                                              Em andamento
                                            </span>
                                          </div>
                                        );
                                      } else if (
                                        status.status ===
                                        'SUBMITTED'
                                      ) {
                                        return (
                                          <div className="flex items-center gap-2 text-blue-400">
                                            <Clock
                                              size={16}
                                            />
                                            <span className="text-sm font-medium">
                                              Enviada para
                                              correção
                                            </span>
                                          </div>
                                        );
                                      } else if (
                                        status.status ===
                                        'GRADING'
                                      ) {
                                        return (
                                          <div className="flex items-center gap-2 text-yellow-400">
                                            <FileCheck
                                              size={16}
                                            />
                                            <span className="text-sm font-medium">
                                              Em correção
                                            </span>
                                          </div>
                                        );
                                      } else if (
                                        status.status ===
                                        'GRADED'
                                      ) {
                                        return (
                                          <div className="flex items-center gap-2 text-green-400">
                                            <CheckCircle
                                              size={16}
                                            />
                                            <span className="text-sm font-medium">
                                              Corrigida
                                            </span>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}

                                    {/* Score se disponível */}
                                    {status.score !==
                                      undefined && (
                                      <span className="text-sm font-bold text-white">
                                        {status.score}%
                                      </span>
                                    )}
                                  </div>

                                  {/* Badge de aprovação */}
                                  {status.score !== undefined && assessment.passingScore !== null && assessment.passingScore !== undefined && (
                                    <div className="flex items-center gap-2 mt-2">
                                      {status.score >= assessment.passingScore ? (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-green-900/30 border border-green-500/30 rounded-full">
                                          <CheckCircle size={12} className="text-green-400" />
                                          <span className="text-xs text-green-400 font-medium">Aprovado</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-red-900/30 border border-red-500/30 rounded-full">
                                          <XCircle size={12} className="text-red-400" />
                                          <span className="text-xs text-red-400 font-medium">Reprovado</span>
                                        </div>
                                      )}
                                      <span className="text-xs text-gray-400">
                                        Nota mínima: {assessment.passingScore}%
                                      </span>
                                    </div>
                                  )}

                                  {/* Progresso de questões */}
                                  {status.totalQuestions >
                                    0 && (
                                    <div className="text-xs text-gray-400">
                                      <div className="flex items-center justify-between mb-1">
                                        <span>
                                          Progresso:
                                        </span>
                                        <span>
                                          {
                                            status.answeredQuestions
                                          }
                                          /
                                          {
                                            status.totalQuestions
                                          }{' '}
                                          questões
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                                        <div
                                          className="bg-secondary rounded-full h-1.5 transition-all duration-300"
                                          style={{
                                            width: `${
                                              (status.answeredQuestions /
                                                status.totalQuestions) *
                                              100
                                            }%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Informações adicionais para PROVA_ABERTA */}
                                  {assessment.type ===
                                    'PROVA_ABERTA' &&
                                    status.status ===
                                      'GRADING' && (
                                      <div className="text-xs text-gray-400 space-y-1 pt-1 border-t border-gray-700">
                                        {status.pendingReviewQuestions >
                                          0 && (
                                          <div className="flex items-center justify-between">
                                            <span>
                                              Aguardando
                                              revisão:
                                            </span>
                                            <span className="text-yellow-400">
                                              {
                                                status.pendingReviewQuestions
                                              }
                                            </span>
                                          </div>
                                        )}
                                        {status.rejectedQuestions >
                                          0 && (
                                          <div className="flex items-center justify-between">
                                            <span>
                                              Necessita
                                              revisão:
                                            </span>
                                            <span className="text-red-400">
                                              {
                                                status.rejectedQuestions
                                              }
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                  {/* Alerta de ação necessária */}
                                  {status.needsStudentAction && (
                                    <div className="flex items-center gap-2 text-orange-400 text-xs pt-2 border-t border-gray-700">
                                      <AlertCircle
                                        size={14}
                                      />
                                      <span className="font-medium">
                                        Ação necessária
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Action Button */}
                                <button
                                  onClick={() => {
                                    console.log(
                                      `🔘 Botão clicado para ${assessment.title}:`,
                                      {
                                        status:
                                          status.status,
                                        attemptId:
                                          status.attemptId,
                                        lessonId:
                                          assessment.lessonId,
                                      }
                                    );

                                    if (
                                      status.status ===
                                        'GRADED' &&
                                      status.attemptId
                                    ) {
                                      if (assessment.type === 'PROVA_ABERTA') {
                                        console.log(
                                          '➡️ Redirecionando para ver resultado da prova aberta'
                                        );
                                        router.push(
                                          `/${locale}/assessments/open-exams/${status.attemptId}`
                                        );
                                      } else {
                                        // Para QUIZ/SIMULADO: refazer
                                        console.log(
                                          '➡️ Iniciando nova tentativa de QUIZ/SIMULADO'
                                        );
                                        handleStartAssessment(assessment);
                                      }
                                    } else if (
                                      status.status ===
                                        'IN_PROGRESS' &&
                                      assessment.type ===
                                        'PROVA_ABERTA'
                                    ) {
                                      console.log(
                                        '➡️ Redirecionando para acompanhar prova aberta'
                                      );
                                      router.push(
                                        `/${locale}/assessments/open-exams`
                                      );
                                    } else if (
                                      status.status ===
                                        'IN_PROGRESS' &&
                                      assessment.lessonId
                                    ) {
                                      console.log(
                                        '➡️ Redirecionando para continuar avaliação em andamento'
                                      );
                                      router.push(
                                        `/${locale}/lessons/${assessment.lessonId}/assessments/${assessment.id}`
                                      );
                                    } else if (
                                      status.attemptId
                                    ) {
                                      console.log(
                                        '➡️ Redirecionando para lista de open exams'
                                      );
                                      router.push(
                                        `/${locale}/assessments/open-exams`
                                      );
                                    } else {
                                      console.log(
                                        '➡️ Iniciando assessment'
                                      );
                                      handleStartAssessment(
                                        assessment
                                      );
                                    }
                                  }}
                                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
                                    status.needsStudentAction
                                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                                      : status.status ===
                                        'GRADED'
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : status.status ===
                                        'IN_PROGRESS'
                                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {(() => {
                                    if (
                                      status.status ===
                                      'GRADED'
                                    ) {
                                      return (
                                        <>
                                          <CheckCircle
                                            size={16}
                                          />
                                          {assessment.type ===
                                          'PROVA_ABERTA'
                                            ? 'Ver Resultado'
                                            : 'Refazer Quiz'}
                                        </>
                                      );
                                    } else if (
                                      status.status ===
                                        'IN_PROGRESS' &&
                                      assessment.type ===
                                        'PROVA_ABERTA'
                                    ) {
                                      return (
                                        <>
                                          <Eye size={16} />
                                          Acompanhar Prova
                                        </>
                                      );
                                    } else if (
                                      status.status ===
                                      'IN_PROGRESS'
                                    ) {
                                      return (
                                        <>
                                          <PenTool
                                            size={16}
                                          />
                                          Continuar
                                          Avaliação
                                        </>
                                      );
                                    } else if (
                                      status.needsStudentAction
                                    ) {
                                      return (
                                        <>
                                          <AlertCircle
                                            size={16}
                                          />
                                          Revisar Respostas
                                        </>
                                      );
                                    } else {
                                      return (
                                        <>
                                          <Eye size={16} />
                                          Acompanhar Status
                                        </>
                                      );
                                    }
                                  })()}
                                  <ArrowRight size={16} />
                                </button>
                              </>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredAssessments.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList
                    size={48}
                    className="mx-auto mb-4 text-gray-400"
                  />
                  <p className="text-gray-300">
                    {t('noAssessments')}
                  </p>
                </div>
              )}
            </>
          ) : activeTab === 'results' ? (
            /* Results Tab */
            <div className="bg-gradient-to-br from-white/[0.02] to-transparent rounded-xl p-6 backdrop-blur-sm">
              <StudentQuizResults
                attemptIds={attemptIds}
                locale={locale}
              />
            </div>
          ) : (
            /* Open Exams Tab */

            <div className="bg-gradient-to-br from-white/[0.02] to-transparent rounded-xl p-6 backdrop-blur-sm">
              <StudentAssessmentStatus
                userId={userId}
                locale={locale}
                assessmentStatuses={assessmentStatuses}
              />
            </div>
          )}
        </div>
      </div>
    </NavSidebar>
  );
}
