// /src/components/TutorDashboard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  FileText,
  CheckCircle,
  Eye,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: 'PROVA_ABERTA';
}

interface PendingAttempt {
  id: string;
  student: Student;
  assessment: Assessment;
  status: 'SUBMITTED' | 'GRADING' | 'GRADED';
  submittedAt: string;
  totalQuestions: number;
  answeredQuestions: number;
  pendingReview: number;
  reviewedQuestions: number;
  rejectedQuestions?: number;
  answers?: Answer[];
}

interface Answer {
  id: string;
  questionId: string;
  isCorrect?: boolean | null;
  teacherComment?: string;
}

interface TutorAttempt {
  id: string;
  student: Student;
  assessment: {
    id: string;
    title: string;
    type: 'PROVA_ABERTA' | 'QUIZ' | 'SIMULADO';
  };
  status: 'SUBMITTED' | 'GRADING' | 'GRADED';
  submittedAt: string;
  totalOpenQuestions?: number;
  pendingAnswers?: number;
  results?: {
    totalQuestions: number;
    correctAnswers: number;
    reviewedQuestions: number;
    percentage?: number;
  };
  grade?: number;
  createdAt?: string;
  answers?: Answer[];
}

interface TutorDashboardProps {
  locale: string;
}

export default function TutorDashboard({
  locale,
}: TutorDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [attempts, setAttempts] = useState<
    PendingAttempt[]
  >([]);
  const [quizAttempts, setQuizAttempts] = useState<TutorAttempt[]>(
    []
  );
  const [simuladoAttempts, setSimuladoAttempts] = useState<
    TutorAttempt[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'in-progress' | 'completed'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<
    'student' | 'assessment'
  >('student');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  const fetchPendingAttempts = useCallback(async () => {
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`${apiUrl}/api/v1/attempts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Response status:', response.status);
        throw new Error(
          'Falha ao carregar tentativas pendentes'
        );
      }

      const data = await response.json();
      console.log('TutorDashboard - API Response:', data);

      // Separar por tipo de avaliação
      const allAttempts = data.attempts || [];
      const openAssessmentAttempts = allAttempts.filter(
        (attempt: TutorAttempt) =>
          attempt.assessment?.type === 'PROVA_ABERTA'
      );
      const quizAttempts = allAttempts.filter(
        (attempt: TutorAttempt) =>
          attempt.assessment?.type === 'QUIZ'
      );
      const simuladoAttempts = allAttempts.filter(
        (attempt: TutorAttempt) =>
          attempt.assessment?.type === 'SIMULADO'
      );

      console.log(
        'TutorDashboard - Open assessment attempts:',
        openAssessmentAttempts.length
      );
      console.log(
        'TutorDashboard - Quiz attempts:',
        quizAttempts.length
      );
      console.log(
        'TutorDashboard - Simulado attempts:',
        simuladoAttempts.length
      );

      // Para cada tentativa, buscar os detalhes reais usando o endpoint /results
      const attemptsWithDetails = await Promise.all(
        openAssessmentAttempts.map(async (attempt: TutorAttempt) => {
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
              // Merge the results data with the attempt data
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
        })
      );

      // Mapear os dados da API para o formato esperado pelo componente
      const mappedAttempts = attemptsWithDetails.map(
        (attempt: TutorAttempt) => {
          // Use results data if available, otherwise fall back to attempt data
          const totalQuestions =
            attempt.results?.totalQuestions ||
            attempt.totalOpenQuestions ||
            0;

          // Count pending questions based on actual answer status
          let pendingReview = 0;
          let reviewedQuestions = 0;
          let rejectedQuestions = 0;

          if (
            attempt.answers &&
            Array.isArray(attempt.answers)
          ) {
            // Para o tutor:
            // - pendingReview: questões ainda não revisadas (isCorrect === null)
            // - rejectedQuestions: questões rejeitadas aguardando nova resposta do aluno (isCorrect === false)
            // - reviewedQuestions: questões aprovadas (isCorrect === true)

            pendingReview = attempt.answers.filter(
              (answer: Answer) => answer.isCorrect === null
            ).length;

            rejectedQuestions = attempt.answers.filter(
              (answer: Answer) => answer.isCorrect === false
            ).length;

            reviewedQuestions = attempt.answers.filter(
              (answer: Answer) => answer.isCorrect === true
            ).length;
          } else {
            // Fallback to original logic if no answers data
            pendingReview = attempt.pendingAnswers || 0;
            reviewedQuestions =
              attempt.results?.reviewedQuestions ||
              totalQuestions - pendingReview;
          }

          console.log('Mapping attempt:', {
            id: attempt.id,
            totalQuestions,
            pendingReview,
            rejectedQuestions,
            reviewedQuestions,
            status: attempt.status,
            student: attempt.student?.name,
          });

          return {
            id: attempt.id,
            student: {
              id: attempt.student?.id || '',
              name: attempt.student?.name || '',
              email: attempt.student?.email || '',
            },
            assessment: {
              id: attempt.assessment?.id || '',
              title: attempt.assessment?.title || '',
              type: 'PROVA_ABERTA' as const,
            },
            status: attempt.status,
            submittedAt: attempt.submittedAt,
            totalQuestions,
            answeredQuestions: totalQuestions,
            pendingReview,
            reviewedQuestions,
            rejectedQuestions,
            answers: attempt.answers, // Include answers for detailed status
          };
        }
      );

      setAttempts(mappedAttempts);

      // Processar Quiz e Simulado attempts com detalhes
      const quizAttemptsWithDetails = await Promise.all(
        quizAttempts.map(async (attempt: TutorAttempt) => {
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
              `Error fetching results for quiz attempt ${attempt.id}:`,
              error
            );
          }
          return attempt;
        })
      );

      const simuladoAttemptsWithDetails = await Promise.all(
        simuladoAttempts.map(async (attempt: TutorAttempt) => {
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
              `Error fetching results for simulado attempt ${attempt.id}:`,
              error
            );
          }
          return attempt;
        })
      );

      setQuizAttempts(quizAttemptsWithDetails);
      setSimuladoAttempts(simuladoAttemptsWithDetails);

      // Debug log para verificar os valores calculados
      console.log(
        'Quiz attempts with details:',
        quizAttemptsWithDetails
      );
      console.log(
        'Quiz errors:',
        quizAttemptsWithDetails.map(att => ({
          id: att.id,
          student: att.student?.name,
          assessment: att.assessment?.title,
          answers: att.answers?.length || 0,
          errors:
            att.answers?.filter(
              (a: Answer) => a.isCorrect === false
            ).length || 0,
        }))
      );
      console.log('Stats calculation:');
      console.log(
        'Total pending questions:',
        mappedAttempts.reduce(
          (total, attempt) => total + attempt.pendingReview,
          0
        )
      );
      console.log(
        'Total reviewed questions:',
        mappedAttempts.reduce(
          (total, attempt) =>
            total + attempt.reviewedQuestions,
          0
        )
      );
      console.log(
        'Total questions:',
        mappedAttempts.reduce(
          (total, attempt) =>
            total + attempt.totalQuestions,
          0
        )
      );
    } catch (error) {
      console.error(
        'Error fetching pending attempts:',
        error
      );
      toast({
        title: 'Erro',
        description:
          'Não foi possível carregar as tentativas pendentes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [apiUrl, toast]);

  useEffect(() => {
    fetchPendingAttempts();
  }, [fetchPendingAttempts]);

  const getStatusColor = (
    status: string,
    pendingReview: number
  ) => {
    if (status === 'SUBMITTED' && pendingReview > 0) {
      return 'text-red-400 bg-red-900/20';
    }
    if (status === 'GRADING') {
      return 'text-yellow-400 bg-yellow-900/20';
    }
    if (status === 'GRADED') {
      return 'text-green-400 bg-green-900/20';
    }
    return 'text-gray-400 bg-gray-900/20';
  };

  const getStatusText = (
    status: string,
    pendingReview: number
  ) => {
    if (status === 'SUBMITTED' && pendingReview > 0) {
      return 'Aguardando revisão';
    }
    if (status === 'GRADING') {
      return 'Em revisão';
    }
    if (status === 'GRADED') {
      return 'Revisada';
    }
    return status;
  };

  const getPriorityLevel = (submittedAt: string) => {
    const submitted = new Date(submittedAt);
    const now = new Date();
    const hoursDiff =
      (now.getTime() - submitted.getTime()) /
      (1000 * 60 * 60);

    if (hoursDiff > 48) return 'high';
    if (hoursDiff > 24) return 'medium';
    return 'low';
  };

  const filteredAttempts = attempts.filter(attempt => {
    if (!attempt || !attempt.student || !attempt.assessment)
      return false;

    const matchesSearch =
      (attempt.student.name?.toLowerCase() || '').includes(
        searchTerm.toLowerCase()
      ) ||
      (
        attempt.assessment.title?.toLowerCase() || ''
      ).includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case 'pending':
        return (
          attempt.status === 'SUBMITTED' &&
          attempt.pendingReview > 0
        );
      case 'in-progress':
        return attempt.status === 'GRADING';
      case 'completed':
        return attempt.status === 'GRADED';
      default:
        return true;
    }
  });

  // Filtrar tentativas duplicadas - manter apenas a mais recente de cada aluno+prova
  const uniqueAttempts = filteredAttempts.reduce(
    (acc, attempt) => {
      const key = `${attempt.student.id}-${attempt.assessment.id}`;
      const existing = acc[key];

      if (
        !existing ||
        new Date(attempt.submittedAt) >
          new Date(existing.submittedAt)
      ) {
        acc[key] = attempt;
      }

      return acc;
    },
    {} as Record<string, PendingAttempt>
  );

  const deduplicatedAttempts =
    Object.values(uniqueAttempts);

  console.log('Deduplication results:');
  console.log(
    'Original attempts:',
    filteredAttempts.length
  );
  console.log(
    'Deduplicated attempts:',
    deduplicatedAttempts.length
  );
  console.log(
    'Deduplicated list:',
    deduplicatedAttempts.map(a => ({
      id: a.id,
      student: a.student.name,
      assessment: a.assessment.title,
      submittedAt: a.submittedAt,
      pending: a.pendingReview,
      reviewed: a.reviewedQuestions,
    }))
  );

  const groupedAttempts = deduplicatedAttempts.reduce(
    (groups, attempt) => {
      const key =
        groupBy === 'student'
          ? attempt.student.id
          : attempt.assessment.id;
      if (!groups[key]) {
        groups[key] = {
          student: attempt.student,
          assessment: attempt.assessment,
          attempts: [],
        };
      }
      groups[key].attempts.push(attempt);
      return groups;
    },
    {} as Record<
      string,
      {
        student: Student;
        assessment: Assessment;
        attempts: PendingAttempt[];
      }
    >
  );

  const handleViewAttempt = (attemptId: string) => {
    router.push(`/${locale}/tutor/reviews/${attemptId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-300">
            Carregando tentativas pendentes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filter}
                onChange={e =>
                  setFilter(e.target.value as 'all' | 'pending' | 'completed')
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-secondary focus:outline-none"
              >
                <option value="all">Todas</option>
                <option value="pending">
                  Aguardando revisão
                </option>
                <option value="in-progress">
                  Em revisão
                </option>
                <option value="completed">Revisadas</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <BookOpen
                size={20}
                className="text-gray-400"
              />
              <select
                value={groupBy}
                onChange={e =>
                  setGroupBy(
                    e.target.value as
                      | 'student'
                      | 'assessment'
                  )
                }
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-secondary focus:outline-none"
              >
                <option value="student">
                  Agrupar por Aluno
                </option>
                <option value="assessment">
                  Agrupar por Prova
                </option>
              </select>
            </div>

            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por aluno ou prova..."
                value={searchTerm}
                onChange={e =>
                  setSearchTerm(e.target.value)
                }
                className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-secondary focus:outline-none w-64"
              />
            </div>
          </div>

          <div className="text-sm text-gray-400">
            {deduplicatedAttempts.length} tentativas
            encontradas
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Provas Abertas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye size={24} className="text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {deduplicatedAttempts
                      .filter(a => a.status === 'SUBMITTED')
                      .reduce(
                        (total, attempt) =>
                          total + attempt.pendingReview,
                        0
                      )}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Aguardando Revisão
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <User
                  size={24}
                  className="text-orange-400"
                />
                <div>
                  <p className="text-2xl font-bold text-orange-400">
                    {deduplicatedAttempts.reduce(
                      (total, attempt) =>
                        total +
                        (attempt.rejectedQuestions || 0),
                      0
                    )}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Aguardando Aluno
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle
                  size={24}
                  className="text-green-400"
                />
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {deduplicatedAttempts.reduce(
                      (total, attempt) =>
                        total + attempt.reviewedQuestions,
                      0
                    )}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Aprovadas
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText
                  size={24}
                  className="text-blue-400"
                />
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {deduplicatedAttempts.reduce(
                      (total, attempt) =>
                        total + attempt.totalQuestions,
                      0
                    )}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz e Simulado Stats */}
        <div className="mb-6 space-y-6">
          {/* Quiz Stats */}
          {quizAttempts.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <BookOpen
                    size={24}
                    className="text-green-400"
                  />
                  Estatísticas de Quiz
                </h2>
                <button
                  onClick={() => fetchPendingAttempts()}
                  className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-green-400">
                    {quizAttempts.length}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Total de Tentativas
                  </p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">
                    {
                      [
                        ...new Set(
                          quizAttempts.map(
                            (a: TutorAttempt) => a.assessment?.id
                          )
                        ),
                      ].length
                    }
                  </p>
                  <p className="text-gray-400 text-sm">
                    Quizzes Diferentes
                  </p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-400">
                    {
                      [
                        ...new Set(
                          quizAttempts.map(
                            (a: TutorAttempt) => a.student?.id
                          )
                        ),
                      ].length
                    }
                  </p>
                  <p className="text-gray-400 text-sm">
                    Alunos Únicos
                  </p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">
                    {quizAttempts.reduce(
                      (total: number, attempt: TutorAttempt) => {
                        // Para Quiz/Simulado, usar os dados de results
                        if (attempt.results) {
                          const totalQuestions =
                            attempt.results
                              .totalQuestions || 0;
                          const correctAnswers =
                            attempt.results
                              .correctAnswers || 0;
                          return (
                            total +
                            (totalQuestions -
                              correctAnswers)
                          );
                        }
                        return total;
                      },
                      0
                    )}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Total de Erros
                  </p>
                </div>
              </div>
              {/* Lista de tentativas por quiz */}
              <div className="space-y-2">
                {Object.entries(
                  quizAttempts.reduce(
                    (
                      acc: Record<string, TutorAttempt[]>,
                      attempt: TutorAttempt
                    ) => {
                      const key =
                        attempt.assessment?.title ||
                        'Quiz sem título';
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(attempt);
                      return acc;
                    },
                    {} as Record<string, TutorAttempt[]>
                  )
                ).map(([quizTitle, attempts]) => {
                  // Para Quiz/Simulado, usar os dados de results
                  const totalCorrect = attempts.reduce(
                    (sum, att) =>
                      sum +
                      (att.results?.correctAnswers || 0),
                    0
                  );
                  const totalQuestions = attempts.reduce(
                    (sum, att) =>
                      sum +
                      (att.results?.totalQuestions || 0),
                    0
                  );
                  const totalIncorrect =
                    totalQuestions - totalCorrect;

                  return (
                    <div
                      key={quizTitle}
                      className="bg-gray-700 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">
                          {quizTitle}
                        </h3>
                        <span className="text-sm text-gray-400">
                          {attempts.length} tentativas
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="text-green-400">
                          ✓ {totalCorrect} corretas
                        </span>
                        <span className="text-red-400">
                          ✗ {totalIncorrect} erradas
                        </span>
                        {totalQuestions > 0 && (
                          <span className="text-gray-400">
                            (
                            {Math.round(
                              (totalCorrect /
                                totalQuestions) *
                                100
                            )}
                            % acerto)
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Alunos:{' '}
                        {[
                          ...new Set(
                            attempts.map(
                              a => a.student?.name
                            )
                          ),
                        ].join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Simulado Stats */}
          {simuladoAttempts.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <GraduationCap
                  size={24}
                  className="text-purple-400"
                />
                Estatísticas de Simulado
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-purple-400">
                    {simuladoAttempts.length}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Total de Tentativas
                  </p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">
                    {
                      [
                        ...new Set(
                          simuladoAttempts.map(
                            (a: TutorAttempt) => a.assessment?.id
                          )
                        ),
                      ].length
                    }
                  </p>
                  <p className="text-gray-400 text-sm">
                    Simulados Diferentes
                  </p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-400">
                    {
                      [
                        ...new Set(
                          simuladoAttempts.map(
                            (a: TutorAttempt) => a.student?.id
                          )
                        ),
                      ].length
                    }
                  </p>
                  <p className="text-gray-400 text-sm">
                    Alunos Únicos
                  </p>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-red-400">
                    {simuladoAttempts.reduce(
                      (total: number, attempt: TutorAttempt) => {
                        // Para Quiz/Simulado, usar os dados de results
                        if (attempt.results) {
                          const totalQuestions =
                            attempt.results
                              .totalQuestions || 0;
                          const correctAnswers =
                            attempt.results
                              .correctAnswers || 0;
                          return (
                            total +
                            (totalQuestions -
                              correctAnswers)
                          );
                        }
                        return total;
                      },
                      0
                    )}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Total de Erros
                  </p>
                </div>
              </div>
              {/* Lista de tentativas por simulado */}
              <div className="space-y-2">
                {Object.entries(
                  simuladoAttempts.reduce(
                    (
                      acc: Record<string, TutorAttempt[]>,
                      attempt: TutorAttempt
                    ) => {
                      const key =
                        attempt.assessment?.title ||
                        'Simulado sem título';
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(attempt);
                      return acc;
                    },
                    {} as Record<string, TutorAttempt[]>
                  )
                ).map(([simuladoTitle, attempts]) => {
                  //   Para Quiz/Simulado, usar os dados de results
                  const totalCorrect = attempts.reduce(
                    (sum, att) =>
                      sum +
                      (att.results?.correctAnswers || 0),
                    0
                  );
                  const totalQuestions = attempts.reduce(
                    (sum, att) =>
                      sum +
                      (att.results?.totalQuestions || 0),
                    0
                  );
                  const totalIncorrect =
                    totalQuestions - totalCorrect;

                  return (
                    <div
                      key={simuladoTitle}
                      className="bg-gray-700 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white">
                          {simuladoTitle}
                        </h3>
                        <span className="text-sm text-gray-400">
                          {attempts.length} tentativas
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="text-green-400">
                          ✓ {totalCorrect} corretas
                        </span>
                        <span className="text-red-400">
                          ✗ {totalIncorrect} erradas
                        </span>
                        {totalQuestions > 0 && (
                          <span className="text-gray-400">
                            (
                            {Math.round(
                              (totalCorrect /
                                totalQuestions) *
                                100
                            )}
                            % acerto)
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Alunos:{' '}
                        {[
                          ...new Set(
                            attempts.map(
                              a => a.student?.name
                            )
                          ),
                        ].join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Attempts grouped by student or assessment */}
        <div className="space-y-6">
          {Object.keys(groupedAttempts).length === 0 ? (
            <div className="text-center py-12">
              <FileText
                size={48}
                className="text-gray-600 mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                Nenhuma tentativa encontrada
              </h3>
              <p className="text-gray-500">
                Não há provas{' '}
                {filter === 'all'
                  ? ''
                  : `${
                      filter === 'pending'
                        ? 'aguardando revisão'
                        : filter === 'in-progress'
                        ? 'em revisão'
                        : 'revisadas'
                    }`}{' '}
                no momento.
              </p>
            </div>
          ) : (
            Object.entries(groupedAttempts).map(
              ([
                groupId,
                {
                  student,
                  assessment,
                  attempts: groupAttempts,
                },
              ]) => (
                <div
                  key={groupId}
                  className="bg-gray-800 rounded-lg p-6"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                      {groupBy === 'student' ? (
                        <User
                          size={24}
                          className="text-primary"
                        />
                      ) : (
                        <FileText
                          size={24}
                          className="text-primary"
                        />
                      )}
                    </div>
                    <div>
                      {groupBy === 'student' ? (
                        <>
                          <h3 className="text-lg font-semibold text-white">
                            {student.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {student.email}
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-white">
                            {assessment.title}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            Prova Aberta
                          </p>
                        </>
                      )}
                    </div>
                    <div className="ml-auto">
                      <span className="text-sm text-gray-400">
                        {groupBy === 'student'
                          ? `${groupAttempts.length} prova${
                              groupAttempts.length !== 1
                                ? 's'
                                : ''
                            }`
                          : `${groupAttempts.length} aluno${
                              groupAttempts.length !== 1
                                ? 's'
                                : ''
                            }`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {groupAttempts.map(attempt => {
                      const priority = getPriorityLevel(
                        attempt.submittedAt
                      );

                      return (
                        <div
                          key={attempt.id}
                          className="space-y-3"
                        >
                          {/* Header da Prova */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText
                                size={20}
                                className="text-blue-400"
                              />
                              <div>
                                <h4 className="font-semibold text-white">
                                  {attempt.assessment.title}
                                </h4>
                                <div
                                  className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${getStatusColor(
                                    attempt.status,
                                    attempt.pendingReview
                                  )}`}
                                >
                                  <div className="w-2 h-2 rounded-full bg-current"></div>
                                  {getStatusText(
                                    attempt.status,
                                    attempt.pendingReview
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-400">
                              Enviada em{' '}
                              {new Date(
                                attempt.submittedAt
                              ).toLocaleDateString(
                                'pt-BR',
                                {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </div>
                          </div>

                          {/* Cards das Questões */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Array.from(
                              {
                                length:
                                  attempt.totalQuestions,
                              },
                              (_, questionIndex) => {
                                const questionNumber =
                                  questionIndex + 1;

                                // Determinar status baseado nos dados reais das respostas
                                let statusText =
                                  'Aguardando';
                                let statusColor =
                                  'text-gray-400';
                                let cardBgColor =
                                  'bg-gray-700 border-gray-600';
                                let numberBgColor =
                                  'bg-gray-600 text-gray-300';

                                // Se temos as respostas detalhadas, usar o status real
                                if (
                                  attempt.answers &&
                                  attempt.answers[
                                    questionIndex
                                  ]
                                ) {
                                  const answer =
                                    attempt.answers[
                                      questionIndex
                                    ];

                                  if (
                                    answer.isCorrect ===
                                    true
                                  ) {
                                    // Questão aprovada
                                    statusText = 'Aprovada';
                                    statusColor =
                                      'text-green-400';
                                    cardBgColor =
                                      'bg-green-900/10 border-green-500/30 hover:border-green-500/50';
                                    numberBgColor =
                                      'bg-green-500 text-white';
                                  } else if (
                                    answer.isCorrect ===
                                    false
                                  ) {
                                    // Questão rejeitada - aguardando nova resposta do aluno
                                    statusText =
                                      'Aguardando Aluno';
                                    statusColor =
                                      'text-orange-400';
                                    cardBgColor =
                                      'bg-orange-900/10 border-orange-500/30 hover:border-orange-500/50';
                                    numberBgColor =
                                      'bg-orange-500 text-white';
                                  } else if (
                                    answer.isCorrect ===
                                    null
                                  ) {
                                    // Questão ainda não revisada
                                    statusText =
                                      'Aguardando Revisão';
                                    statusColor =
                                      'text-blue-400';
                                    cardBgColor =
                                      'bg-blue-900/10 border-blue-500/30 hover:border-blue-500/50';
                                    numberBgColor =
                                      'bg-blue-500 text-white';
                                  }
                                } else {
                                  // Fallback para lógica antiga se não temos dados detalhados
                                  if (
                                    attempt.status ===
                                      'SUBMITTED' ||
                                    attempt.status ===
                                      'GRADING'
                                  ) {
                                    const totalReviewed =
                                      attempt.reviewedQuestions;
                                    const totalRejected =
                                      attempt.rejectedQuestions ||
                                      0;

                                    if (
                                      questionIndex <
                                      totalReviewed
                                    ) {
                                      statusText =
                                        'Aprovada';
                                      statusColor =
                                        'text-green-400';
                                      cardBgColor =
                                        'bg-green-900/10 border-green-500/30 hover:border-green-500/50';
                                      numberBgColor =
                                        'bg-green-500 text-white';
                                    } else if (
                                      questionIndex <
                                      totalReviewed +
                                        totalRejected
                                    ) {
                                      statusText =
                                        'Aguardando Aluno';
                                      statusColor =
                                        'text-orange-400';
                                      cardBgColor =
                                        'bg-orange-900/10 border-orange-500/30 hover:border-orange-500/50';
                                      numberBgColor =
                                        'bg-orange-500 text-white';
                                    } else {
                                      statusText =
                                        'Aguardando Revisão';
                                      statusColor =
                                        'text-blue-400';
                                      cardBgColor =
                                        'bg-blue-900/10 border-blue-500/30 hover:border-blue-500/50';
                                      numberBgColor =
                                        'bg-blue-500 text-white';
                                    }
                                  } else if (
                                    attempt.status ===
                                    'GRADED'
                                  ) {
                                    statusText =
                                      'Concluída';
                                    statusColor =
                                      'text-green-400';
                                    cardBgColor =
                                      'bg-green-900/10 border-green-500/30 hover:border-green-500/50';
                                    numberBgColor =
                                      'bg-green-500 text-white';
                                  }
                                }

                                return (
                                  <div
                                    key={`${attempt.id}-question-${questionNumber}`}
                                    className={`p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-600 transition-colors ${cardBgColor}`}
                                    onClick={() =>
                                      handleViewAttempt(
                                        attempt.id
                                      )
                                    }
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${numberBgColor}`}
                                        >
                                          {questionNumber}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium text-white">
                                            Questão{' '}
                                            {questionNumber}
                                          </span>
                                          <span className="text-xs text-gray-400 truncate max-w-32">
                                            {groupBy ===
                                            'student'
                                              ? attempt
                                                  .assessment
                                                  .title
                                              : attempt
                                                  .student
                                                  .name}
                                          </span>
                                        </div>
                                      </div>
                                      <ChevronRight
                                        size={14}
                                        className="text-gray-400"
                                      />
                                    </div>

                                    <div className="space-y-1 text-xs">
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-400">
                                          Status:
                                        </span>
                                        <span
                                          className={`font-semibold ${statusColor}`}
                                        >
                                          {statusText}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-400">
                                          Prioridade:
                                        </span>
                                        <span
                                          className={`font-semibold ${
                                            priority ===
                                            'high'
                                              ? 'text-red-400'
                                              : priority ===
                                                'medium'
                                              ? 'text-yellow-400'
                                              : 'text-gray-400'
                                          }`}
                                        >
                                          {priority ===
                                          'high'
                                            ? 'Alta'
                                            : priority ===
                                              'medium'
                                            ? 'Média'
                                            : 'Baixa'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
