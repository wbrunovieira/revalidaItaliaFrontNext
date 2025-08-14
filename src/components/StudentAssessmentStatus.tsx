// /src/components/StudentAssessmentStatus.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Calendar,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  type: 'PROVA_ABERTA';
}

interface Answer {
  id: string;
  questionId: string;
  isCorrect?: boolean | null;
  reviewDecision?: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'NEEDS_REVISION' | null;
}

interface StudentAttempt {
  id: string;
  student?: { id: string; name: string; email: string };
  status:
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'GRADING'
    | 'GRADED';
  submittedAt?: string;
  gradedAt?: string;
  assessment?: Assessment;
  totalQuestions: number;
  totalOpenQuestions?: number;
  pendingAnswers?: number;
  answeredQuestions: number;
  pendingReview: number;
  reviewedQuestions: number;
  partiallyAcceptedQuestions?: number;
  correctAnswers?: number;
  scorePercentage?: number;
  passed?: boolean;
}

interface AssessmentAttemptStatus {
  hasActiveAttempt: boolean;
  canStartNewAttempt: boolean;
  attemptId?: string;
  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
  score?: number;
  submittedAt?: string;
  gradedAt?: string;
  totalQuestions: number;
  answeredQuestions: number;
  pendingReviewQuestions: number;
  rejectedQuestions: number;
  needsStudentAction: boolean;
}

interface StudentAssessmentStatusProps {
  userId: string;
  locale: string;
  assessmentStatuses?: Map<string, AssessmentAttemptStatus>;
}

export default function StudentAssessmentStatus({
  userId,
  locale,
  assessmentStatuses,
}: StudentAssessmentStatusProps) {
  const t = useTranslations('Profile');
  const { toast } = useToast();

  const [attempts, setAttempts] = useState<
    StudentAttempt[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  const fetchAttempts = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      try {
        const token = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1];

        // Usar o endpoint que existe e filtrar para o usuário atual
        const response = await fetch(
          `${apiUrl}/api/v1/attempts`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Falha ao carregar tentativas');
        }

        const data = await response.json();
        console.log(
          'StudentAssessmentStatus - API Response:',
          data
        );
        console.log(
          'StudentAssessmentStatus - User ID:',
          userId
        );

        // Filtrar apenas PROVA_ABERTA e tentativas do usuário atual
        // Excluir tentativas IN_PROGRESS pois não foram finalizadas
        const userOpenAttempts = (
          data.attempts || []
        ).filter(
          (attempt: StudentAttempt) =>
            attempt.student?.id === userId &&
            attempt.assessment?.type === 'PROVA_ABERTA' &&
            attempt.status !== 'IN_PROGRESS' // Apenas tentativas finalizadas
        );

        console.log(
          'StudentAssessmentStatus - Filtered user open attempts:',
          userOpenAttempts.length
        );

        // Para cada tentativa, buscar os detalhes reais usando o endpoint /results
        const attemptsWithDetails = await Promise.all(
          userOpenAttempts.map(
            async (attempt: StudentAttempt) => {
              try {
                const resultsResponse = await fetch(
                  `${apiUrl}/api/v1/attempts/${attempt.id}/results`,
                  {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: token
                        ? `Bearer ${token}`
                        : '',
                    },
                    credentials: 'include',
                  }
                );

                if (resultsResponse.ok) {
                  const resultsData =
                    await resultsResponse.json();
                  console.log(
                    `Detalhes para ${attempt.assessment?.title}:`,
                    {
                      attemptId: attempt.id,
                      answers: resultsData.answers?.map((a: Answer) => ({
                        id: a.id,
                        isCorrect: a.isCorrect,
                        reviewDecision: a.reviewDecision
                      }))
                    }
                  );
                  return {
                    ...attempt,
                    results: resultsData.results,
                    answers: resultsData.answers,
                  };
                }
              } catch (error) {
                console.error(
                  `Error fetching results for attempt ${attempt.id}:`,
                  error
                );
              }
              return attempt;
            }
          )
        );

        const mappedAttempts = attemptsWithDetails.map(
          (
            attempt: StudentAttempt & {
              results?: {
                totalQuestions: number;
                correctAnswers: number;
                reviewedQuestions: number;
              };
              answers?: Answer[];
            }
          ) => {
            const totalQuestions =
              attempt.results?.totalQuestions ||
              attempt.totalOpenQuestions ||
              0;

            // Count rejected questions that need new answers from student
            let pendingReview = 0;
            let reviewedQuestions = 0;
            let partiallyAccepted = 0;

            // Primeiro, tentar usar dados da nova API se disponível
            const newApiData = assessmentStatuses?.get(attempt.assessment?.id || '');
            if (newApiData) {
              pendingReview = newApiData.pendingReviewQuestions;
              reviewedQuestions = newApiData.totalQuestions - newApiData.pendingReviewQuestions - newApiData.rejectedQuestions;
              
              console.log(
                `Usando dados da nova API para ${attempt.assessment?.title}:`,
                {
                  pendingReview: newApiData.pendingReviewQuestions,
                  rejected: newApiData.rejectedQuestions,
                  reviewed: reviewedQuestions,
                  total: newApiData.totalQuestions
                }
              );
            } else if (
              attempt.answers &&
              Array.isArray(attempt.answers)
            ) {
              // Para o aluno:
              // - pendingReview = questões que precisam de ação do aluno (rejeitadas ou parcialmente aceitas)
              // - reviewedQuestions = questões totalmente aprovadas pelo professor
              
              // Contar baseado em reviewDecision quando disponível, senão usar isCorrect
              // pendingReview = questões que requerem ação do aluno (NEEDS_REVISION)
              pendingReview = attempt.answers.filter(
                (answer: Answer) => {
                  if (answer.reviewDecision) {
                    // NEEDS_REVISION = rejeitada, precisa refazer
                    return answer.reviewDecision === 'NEEDS_REVISION';
                  }
                  // Fallback para isCorrect
                  return answer.isCorrect === false;
                }
              ).length;

              // Contar questões aprovadas e parcialmente aceitas separadamente
              const fullyApproved = attempt.answers.filter(
                (answer: Answer) => {
                  if (answer.reviewDecision) {
                    return answer.reviewDecision === 'ACCEPTED';
                  }
                  return answer.isCorrect === true;
                }
              ).length;
              
              partiallyAccepted = attempt.answers.filter(
                (answer: Answer) => {
                  return answer.reviewDecision === 'PARTIALLY_ACCEPTED';
                }
              ).length;

              // reviewedQuestions = total de questões já revisadas (aprovadas + parcialmente aceitas)
              reviewedQuestions = fullyApproved + partiallyAccepted;
              
              // Se não há questões pendentes nem aprovadas, mas há respostas,
              // provavelmente estão aguardando revisão
              const questionsAwaitingReview = attempt.answers.filter(
                (answer: Answer) => 
                  answer.reviewDecision === null && 
                  answer.isCorrect === null
              ).length;
              
              console.log(
                `Análise detalhada para ${attempt.assessment?.title}:`,
                {
                  totalAnswers: attempt.answers.length,
                  pendingReview,
                  reviewedQuestions,
                  fullyApproved,
                  partiallyAccepted,
                  awaitingReview: questionsAwaitingReview
                }
              );
            } else {
              // Fallback
              const pendingAnswers =
                attempt.pendingAnswers || 0;
              pendingReview = pendingAnswers;

              reviewedQuestions =
                totalQuestions - pendingAnswers;
            }

            console.log(
              `Contagens para ${attempt.assessment?.title}:`,
              {
                totalQuestions,
                pendingReview,
                reviewedQuestions,
                status: attempt.status
              }
            );

            // Calcular scorePercentage se não vier da API
            let calculatedScore = attempt.scorePercentage;
            if (calculatedScore === undefined && totalQuestions > 0) {
              // Se todas as questões foram aprovadas (sem pendentes e sem rejeitadas)
              if (pendingReview === 0 && reviewedQuestions === totalQuestions) {
                calculatedScore = 100;
              } else if (reviewedQuestions === 0) {
                calculatedScore = 0;
              } else {
                // Calcular baseado nas questões totalmente aprovadas
                const fullyApproved = reviewedQuestions - partiallyAccepted;
                calculatedScore = Math.round((fullyApproved / totalQuestions) * 100);
              }
            }
            
            // Detectar quando há respostas aceitas aguardando confirmação do aluno
            // Se status é SUBMITTED e scorePercentage = 100%, o professor aceitou mas o aluno não confirmou
            if (attempt.status === 'SUBMITTED' && calculatedScore === 100) {
              // Marcar como aceita aguardando confirmação do aluno
              partiallyAccepted = reviewedQuestions || 1;
            }

            return {
              id: attempt.id,
              status: attempt.status,
              submittedAt: attempt.submittedAt,
              gradedAt: attempt.gradedAt,
              assessment: {
                id: attempt.assessment?.id || '',
                title:
                  attempt.assessment?.title || 'Avaliação',
                type: 'PROVA_ABERTA' as const,
              },
              totalQuestions,
              answeredQuestions: totalQuestions,
              pendingReview,
              reviewedQuestions,
              partiallyAcceptedQuestions: partiallyAccepted,
              correctAnswers: attempt.correctAnswers,
              scorePercentage: calculatedScore,
              passed: attempt.passed || calculatedScore === 100,
            };
          }
        );

        // Deduplicar tentativas (manter apenas a mais recente de cada prova)
        const uniqueAttempts = mappedAttempts.reduce(
          (acc, attempt) => {
            const key = `${userId}-${attempt.assessment?.id || attempt.id}`;
            const existing = acc[key];

            if (
              !existing ||
              (attempt.submittedAt && existing.submittedAt && 
                new Date(attempt.submittedAt) > new Date(existing.submittedAt))
            ) {
              acc[key] = attempt;
            }

            return acc;
          },
          {} as Record<string, StudentAttempt>
        );

        setAttempts(Object.values(uniqueAttempts));
      } catch (error) {
        console.error('Error fetching attempts:', error);
        toast({
          title: 'Erro',
          description:
            'Não foi possível carregar suas avaliações.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        if (showRefreshing) setRefreshing(false);
      }
    },
    [apiUrl, toast, userId, assessmentStatuses]
  );

  useEffect(() => {
    fetchAttempts();
  }, [userId, fetchAttempts]);

  const getStatusColor = (
    status: string,
    pendingReview: number,
    scorePercentage?: number,
    partiallyAccepted?: number
  ) => {
    // Se tem respostas aceitas aguardando confirmação (amarelo para indicar ação necessária)
    if (partiallyAccepted && partiallyAccepted > 0 && scorePercentage === 100) {
      return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
    }
    
    switch (status) {
      case 'IN_PROGRESS':
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'SUBMITTED':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'GRADING':
        return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'GRADED':
        // Verde apenas se scorePercentage for 100%
        if (scorePercentage === 100) {
          return 'text-green-400 bg-green-900/20 border-green-500/30';
        }
        // Vermelho se reprovada (score < 100)
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };


  const getStatusText = (
    status: string,
    pendingReview: number,
    reviewedQuestions: number = 0,
    totalQuestions: number = 0,
    scorePercentage?: number,
    partiallyAccepted?: number
  ) => {
    // Se tem respostas aceitas aguardando confirmação (100% mas ainda SUBMITTED)
    if (partiallyAccepted && partiallyAccepted > 0 && scorePercentage === 100) {
      return 'Confirmar resposta';
    }
    
    switch (status) {
      case 'IN_PROGRESS':
        return 'Em andamento';
      case 'SUBMITTED':
        return 'Aguardando professor';
      case 'GRADING':
        return 'Professor corrigindo';
      case 'GRADED':
        // Finalizada apenas se aprovada (100%)
        if (scorePercentage === 100) {
          return 'Aprovada';
        }
        // Se não é 100%, precisa de revisão do aluno
        return 'Aguardando sua revisão';
      default:
        return status;
    }
  };

  const getStatusIcon = (
    status: string,
    pendingReview: number
  ) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Clock size={16} />;
      case 'SUBMITTED':
        if (pendingReview > 0) {
          return <AlertCircle size={16} />;
        }
        return <CheckCircle size={16} />;
      case 'GRADING':
        return <Eye size={16} />;
      case 'GRADED':
        return <CheckCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(
      locale === 'pt'
        ? 'pt-BR'
        : locale === 'es'
        ? 'es-ES'
        : 'it-IT',
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
      <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText
              size={24}
              className="text-secondary"
            />
            Minhas Avaliações Abertas
          </h2>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-400">
            {t('assessments.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileText size={24} className="text-secondary" />
          {t('assessments.title')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              (window.location.href = `/${locale}/assessments/open-exams`)
            }
            className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors"
          >
            <Eye size={16} />
            Ver Todas
          </button>
          <button
            onClick={() => fetchAttempts(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            {t('assessments.refresh')}
          </button>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-12">
          <FileText
            size={48}
            className="mx-auto mb-4 text-gray-500"
          />
          <p className="text-gray-400 mb-2">
            {t('assessments.noAssessments')}
          </p>
          <p className="text-sm text-gray-500">
            {t('assessments.noAssessmentsDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map(attempt => (
            <div
              key={attempt.id}
              className={`p-4 rounded-lg border-2 ${getStatusColor(
                attempt.status,
                attempt.pendingReview,
                attempt.scorePercentage,
                attempt.partiallyAcceptedQuestions
              )} transition-all hover:border-opacity-60`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">
                      {attempt.assessment?.title || 'Avaliação'}
                    </h3>
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(
                        attempt.status,
                        attempt.pendingReview,
                        attempt.scorePercentage,
                        attempt.partiallyAcceptedQuestions
                      )}`}
                    >
                      {getStatusIcon(
                        attempt.status,
                        attempt.pendingReview
                      )}
                      {getStatusText(
                        attempt.status,
                        attempt.pendingReview,
                        attempt.reviewedQuestions,
                        attempt.totalQuestions,
                        attempt.scorePercentage,
                        attempt.partiallyAcceptedQuestions
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">
                        {t('assessments.questions')}
                      </p>
                      <p className="text-white font-medium">
                        {attempt.totalQuestions}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">
                        {t('assessments.pending')}
                      </p>
                      <p
                        className={`font-medium ${
                          attempt.scorePercentage === 100 ? 'text-green-400' :
                          attempt.status === 'GRADED' && attempt.scorePercentage === 0 ? 'text-red-400' :
                          attempt.status === 'SUBMITTED' ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}
                      >
                        {attempt.scorePercentage === 100 ? 0 :
                         attempt.status === 'GRADED' && attempt.scorePercentage === 0 ? attempt.totalQuestions :
                         attempt.status === 'SUBMITTED' && !attempt.partiallyAcceptedQuestions ? attempt.totalQuestions :
                         attempt.pendingReview}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">
                        {t('assessments.approved')}
                      </p>
                      <p className={`font-medium ${
                        attempt.scorePercentage === 100 ? 'text-green-400' : 
                        attempt.scorePercentage === 0 ? 'text-red-400' : 
                        'text-yellow-400'
                      }`}>
                        {attempt.scorePercentage === 100 ? attempt.totalQuestions : 
                         attempt.scorePercentage === 0 ? 0 :
                         attempt.reviewedQuestions - (attempt.partiallyAcceptedQuestions || 0)}
                      </p>
                    </div>
                    {attempt.partiallyAcceptedQuestions ? (
                      <div>
                        <p className="text-gray-400">
                          Parcialmente Aceitas
                        </p>
                        <p className="text-orange-400 font-medium">
                          {attempt.partiallyAcceptedQuestions}
                        </p>
                      </div>
                    ) : null}
                    {attempt.scorePercentage !==
                      undefined && (
                      <div>
                        <p className="text-gray-400">
                          {t('assessments.score')}
                        </p>
                        <p
                          className={`font-medium ${
                            attempt.passed
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {attempt.scorePercentage}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <ChevronRight
                  size={20}
                  className="text-gray-400 mt-1"
                />
              </div>

              {/* Mensagem de ação necessária */}
              {attempt.status === 'GRADED' && attempt.scorePercentage !== undefined && attempt.scorePercentage < 100 && (
                <div className="mt-3 p-2 bg-orange-900/30 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-orange-400" />
                    <span className="text-orange-400 text-sm font-medium">
                      Ação necessária: Você precisa enviar nova resposta para as questões rejeitadas
                    </span>
                  </div>
                </div>
              )}

              {((attempt.status === 'GRADING' || attempt.status === 'SUBMITTED') && 
                attempt.partiallyAcceptedQuestions && 
                attempt.partiallyAcceptedQuestions > 0 && 
                attempt.scorePercentage === 100) && (
                <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">
                      Resposta aceita! Entre na prova para ler o feedback do professor e confirmar o recebimento.
                    </span>
                  </div>
                </div>
              )}

              {attempt.status === 'SUBMITTED' && !attempt.partiallyAcceptedQuestions && attempt.scorePercentage !== 100 && (
                <div className="mt-3 p-2 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-400" />
                    <span className="text-blue-400 text-sm">
                      O professor está revisando suas respostas
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {attempt.submittedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>
                        Enviada: {formatDate(attempt.submittedAt)}
                      </span>
                    </div>
                  )}
                  {attempt.gradedAt && attempt.scorePercentage === 100 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      <span>
                        Finalizada: {formatDate(attempt.gradedAt)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {attempt.status === 'GRADED' && attempt.scorePercentage !== undefined && attempt.scorePercentage < 100 && (
                    <button
                      onClick={() =>
                        (window.location.href = `/${locale}/assessments/open-exams/${attempt.id}`)
                      }
                      className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors animate-pulse"
                    >
                      Enviar Nova Resposta
                    </button>
                  )}
                  <button
                    onClick={() =>
                      (window.location.href = `/${locale}/assessments/open-exams/${attempt.id}`)
                    }
                    className="px-3 py-1 bg-secondary text-primary text-sm rounded-lg hover:bg-secondary/90 transition-colors"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
