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
  correctAnswers?: number;
  scorePercentage?: number;
  passed?: boolean;
}

interface StudentAssessmentStatusProps {
  userId: string;
  locale: string;
}

export default function StudentAssessmentStatus({
  userId,
  locale,
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
        const userOpenAttempts = (
          data.attempts || []
        ).filter(
          (attempt: StudentAttempt) =>
            attempt.student?.id === userId &&
            attempt.assessment?.type === 'PROVA_ABERTA'
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

            if (
              attempt.answers &&
              Array.isArray(attempt.answers)
            ) {
              // Para o aluno:
              // - pendingReview = questões rejeitadas que precisam ser respondidas novamente
              // - reviewedQuestions = questões aprovadas pelo professor
              pendingReview = attempt.answers.filter(
                (answer: Answer) =>
                  answer.isCorrect === false
              ).length;

              reviewedQuestions = attempt.answers.filter(
                (answer: Answer) =>
                  answer.isCorrect === true
              ).length;
            } else {
              // Fallback
              const pendingAnswers =
                attempt.pendingAnswers || 0;
              pendingReview = pendingAnswers;

              reviewedQuestions =
                totalQuestions - pendingAnswers;
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
              correctAnswers: attempt.correctAnswers,
              scorePercentage: attempt.scorePercentage,
              passed: attempt.passed,
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
    [apiUrl, toast, userId]
  );

  useEffect(() => {
    fetchAttempts();
  }, [userId, fetchAttempts]);

  const getStatusColor = (
    status: string,
    pendingReview: number
  ) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'SUBMITTED':
        if (pendingReview > 0) {
          return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
        }
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case 'GRADING':
        return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'GRADED':
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const canRetake = (attempt: StudentAttempt): boolean => {
    // Permitir retomar se houver questões rejeitadas
    return attempt.pendingReview > 0;
  };

  const getStatusText = (
    status: string,
    pendingReview: number
  ) => {
    switch (status) {
      case 'IN_PROGRESS':
        return t('assessments.status.inProgress');
      case 'SUBMITTED':
        if (pendingReview > 0) {
          return t('assessments.status.submitted');
        }
        return t('assessments.status.submittedComplete');
      case 'GRADING':
        return t('assessments.status.grading');
      case 'GRADED':
        return t('assessments.status.graded');
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
                attempt.pendingReview
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
                        attempt.pendingReview
                      )}`}
                    >
                      {getStatusIcon(
                        attempt.status,
                        attempt.pendingReview
                      )}
                      {getStatusText(
                        attempt.status,
                        attempt.pendingReview
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
                          attempt.pendingReview > 0
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}
                      >
                        {attempt.pendingReview}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">
                        {t('assessments.approved')}
                      </p>
                      <p className="text-green-400 font-medium">
                        {attempt.reviewedQuestions}
                      </p>
                    </div>
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

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {attempt.submittedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>
                        {t('assessments.submitted')}:{' '}
                        {formatDate(attempt.submittedAt)}
                      </span>
                    </div>
                  )}
                  {attempt.gradedAt && (
                    <div className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      <span>
                        {t('assessments.graded')}:{' '}
                        {formatDate(attempt.gradedAt)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canRetake(attempt) && (
                    <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors">
                      {t('assessments.actions.retake')}
                    </button>
                  )}
                  {attempt.pendingReview > 0 &&
                    attempt.reviewedQuestions > 0 && (
                      <button
                        onClick={() =>
                          (window.location.href = `/${locale}/assessments/open-exams/${attempt.id}`)
                        }
                        className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors animate-pulse"
                      >
                        Responder Pendentes
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
