// /src/components/QuizPage.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Flag,
  AlertCircle,
  Trophy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  passingScore?: number;
  timeLimitInMinutes?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
}

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN_QUESTION' | 'OPEN';
  options: Option[];
}

interface DetailedAnswer {
  questionId: string;
  questionText: string;
  questionType?: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  correctOptionId?: string;
  correctOptionText?: string;
  isCorrect: boolean | null;
  textAnswer?: string;
  explanation?: string;
  status?: string;
}

interface DetailedResults {
  attempt?: {
    id: string;
    status: string;
    score: number;
    passed: boolean;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    startedAt: string;
    finishedAt: string;
    gradedAt?: string;
    submittedAt?: string;
  };
  assessment?: {
    id: string;
    title: string;
    type: string;
    passingScore: number;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  results?: {
    scorePercentage: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    answeredQuestions: number;
    timeSpent?: number;
  };
  summary?: {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    scorePercentage: number;
  };
  answers: DetailedAnswer[];
}

interface Attempt {
  id: string;
  userId: string;
  assessmentId: string;
  status: 'ACTIVE' | 'FINALIZED' | 'EXPIRED' | 'GRADED';
  startedAt: string;
  finishedAt?: string;
  expiresAt?: string;
  score?: number;
  passed?: boolean;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  gradedAt?: string;
  submittedAt?: string;
  detailedResults?: DetailedResults;
}

interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  answeredAt: string;
}

interface QuizPageProps {
  assessment: Assessment;
  questions: Question[];
  locale: string;
  backUrl: string;
}

type QuizPhase = 'start' | 'quiz' | 'results';

export default function QuizPage({
  assessment,
  questions,
  locale,
  backUrl,
}: QuizPageProps) {
  const t = useTranslations('Assessment');
  const router = useRouter();
  const { toast } = useToast();

  const [phase, setPhase] = useState<QuizPhase>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(
    null
  );
  const [answers, setAnswers] = useState<
    Map<string, AttemptAnswer>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  // Função helper para validar integridade dos dados do quiz
  const validateQuizResults = (
    results: DetailedResults,
    questions: Question[]
  ) => {
    const errors: string[] = [];

    results.answers?.forEach(answer => {
      const question = questions.find(
        q => q.id === answer.questionId
      );

      if (!question) {
        errors.push(
          `Questão ${answer.questionId} não encontrada`
        );
        return;
      }

      // Validar selectedOptionId
      if (answer.selectedOptionId) {
        const selectedExists = question.options.some(
          opt => opt.id === answer.selectedOptionId
        );
        if (!selectedExists) {
          errors.push(
            `selectedOptionId ${answer.selectedOptionId} não existe na questão ${answer.questionId}`
          );
        }
      }

      // Validar correctOptionId
      if (answer.correctOptionId) {
        const correctExists = question.options.some(
          opt => opt.id === answer.correctOptionId
        );
        if (!correctExists) {
          errors.push(
            `correctOptionId ${answer.correctOptionId} não existe na questão ${answer.questionId}`
          );
        }
      }
    });

    if (errors.length > 0) {
      console.error(
        'Erros de validação encontrados:',
        errors
      );
    }

    return errors.length === 0;
  };

  const fetchDetailedResults = async (
    attemptId: string
  ) => {
    try {
      // Get token for authentication
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const resultsResponse = await fetch(
        `${apiUrl}/attempts/${attemptId}/results`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          credentials: 'include',
        }
      );

      if (!resultsResponse.ok) {
        const errorData = await resultsResponse.json();
        console.error(
          'Results endpoint failed:',
          errorData
        );

        // Tratamento específico de erros conforme o guia
        switch (errorData.error) {
          case 'ATTEMPT_NOT_FOUND':
            throw new Error('Attempt não encontrado');
          case 'ATTEMPT_NOT_FINALIZED':
            throw new Error(
              'Attempt ainda não foi finalizado'
            );
          case 'INSUFFICIENT_PERMISSIONS':
            throw new Error(
              'Usuário não tem permissão para ver este attempt'
            );
          default:
            throw new Error(
              errorData.message ||
                `Results endpoint failed: ${resultsResponse.status}`
            );
        }
      }

      const resultsData = await resultsResponse.json();

      // Validar integridade dos dados
      validateQuizResults(resultsData, questions);

      // Store the detailed results according to the API specification
      setAttempt(prev =>
        prev
          ? {
              ...prev,
              detailedResults: resultsData,
            }
          : null
      );

      return resultsData;
    } catch (error) {
      console.error(
        '❌ Failed to fetch detailed results:',
        error
      );
      throw error;
    }
  };

  const startQuiz = async () => {
    setLoading(true);
    try {
      // Get user ID from token (similar to Avatar.tsx approach)
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Você precisa fazer login para iniciar o quiz');
      }

      // Decode token to get userId (basic JWT decode)
      let payload;
      try {
        payload = JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        throw new Error('Token de autenticação inválido');
      }
      
      const userId = payload.sub || payload.id;

      if (!userId) {
        throw new Error('User ID not found in token');
      }

      console.log('Starting quiz with:', { userId, assessmentId: assessment.id });

      const response = await fetch(
        `${apiUrl}/attempts/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            userId,
            assessmentId: assessment.id,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
        
        let errorMessage = 'Failed to start quiz';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Se não conseguir fazer parse do JSON, usar mensagem padrão
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { attempt, isNew, answeredQuestions } = data;

      // Salvar a tentativa no state
      setAttempt(attempt);

      if (!isNew) {
        // Tentativa existente - continuar de onde parou
        // TODO: Buscar respostas já dadas quando o endpoint estiver disponível
        // Por enquanto, apenas continuar sem carregar respostas anteriores

        toast({
          title: t('continuingQuiz'),
          description: t('foundActiveAttempt'),
        });
      }

      setPhase('quiz');
      toast({
        title: t('quizStarted'),
        description: t('quizStartedDescription'),
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast({
        title: t('error.title'),
        description:
          error instanceof Error
            ? error.message
            : t('error.startQuiz'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (
    questionId: string,
    selectedOptionId?: string,
    textAnswer?: string
  ) => {
    if (!attempt) return;

    try {
      // Get token for authentication
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(
        `${apiUrl}/attempts/${attempt.id}/answers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          credentials: 'include',
          body: JSON.stringify({
            questionId,
            selectedOptionId,
            textAnswer,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save answer error:', errorText);
        throw new Error(
          `Failed to save answer: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      setAnswers(prev =>
        new Map(prev).set(questionId, data.attemptAnswer)
      );
    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: t('error.title'),
        description: t('error.saveAnswer'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmitQuiz = async () => {
    if (!attempt) return;

    // Check if all questions are answered (this might be required by the backend)
    if (answers.size === 0) {
      toast({
        title: t('error.title'),
        description:
          'Você precisa responder pelo menos uma questão antes de finalizar.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get token for authentication
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      // PASSO 4: Finalizar o Quiz
      const submitResponse = await fetch(
        `${apiUrl}/attempts/${attempt.id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          credentials: 'include',
          // Sem body - apenas envia POST vazio
        }
      );

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Submit error response:', errorText);
        throw new Error(
          `Failed to submit quiz: ${submitResponse.status} - ${errorText}`
        );
      }

      const submitData = await submitResponse.json();
      // Retorna: { attemptId, status, score, gradedAt }
      // Usar o attemptId do submitData se existir, senão usar o attempt.id existente
      const finalAttemptId =
        submitData.attemptId || submitData.id || attempt.id;

      setAttempt(prev =>
        prev
          ? {
              ...prev,
              id: finalAttemptId,
              status: submitData.status,
              score: submitData.score,
              gradedAt: submitData.gradedAt,
            }
          : null
      );

      // PASSO 5: Buscar resultados detalhados (obrigatório para mostrar explicações)
      try {
        await fetchDetailedResults(finalAttemptId);
      } catch (error) {
        console.warn(
          '⚠️ Failed to fetch detailed results, using fallback:',
          error
        );
        // Fallback: usar apenas os dados básicos do submit
        setAttempt(prev =>
          prev
            ? {
                ...prev,
                detailedResults: {
                  attempt: submitData.attempt,
                  summary: submitData.summary,
                  assessment: {
                    id: assessment.id,
                    title: assessment.title,
                    type: assessment.type,
                    passingScore:
                      assessment.passingScore || 0,
                  },
                  answers: [],
                },
              }
            : null
        );
      }

      setPhase('results');

      toast({
        title: t('quizSubmitted'),
        description: t('quizSubmittedDescription'),
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: t('error.title'),
        description: t('error.submitQuiz'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion
    ? answers.get(currentQuestion.id)
    : null;
  const answeredCount = answers.size;
  const progressPercentage =
    (answeredCount / questions.length) * 100;

  if (phase === 'start') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">
                {t('quizInstructions')}
              </h2>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  • {questions.length} {t('questions')}
                </p>
                {assessment.passingScore && (
                  <p>
                    • {t('passingScore')}:{' '}
                    {assessment.passingScore}%
                  </p>
                )}
                <p>• {t('canChangeAnswers')}</p>
              </div>
            </div>

            <button
              onClick={startQuiz}
              disabled={loading || questions.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-primary px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  {t('starting')}
                </>
              ) : (
                <>
                  <Play size={20} />
                  {t('startQuiz')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    return (
      <div className="flex-1 flex flex-col">
        {/* Progress Bar */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">
              {t('question')} {currentQuestionIndex + 1}{' '}
              {t('of')} {questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-secondary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-6">
          {currentQuestion && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white leading-relaxed">
                  {currentQuestion.text}
                </h2>

                {currentQuestion.type ===
                  'MULTIPLE_CHOICE' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map(
                      (option, index) => (
                        <button
                          key={option.id}
                          onClick={() =>
                            saveAnswer(
                              currentQuestion.id,
                              option.id
                            )
                          }
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            currentAnswer?.selectedOptionId ===
                            option.id
                              ? 'border-secondary bg-secondary/10'
                              : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                currentAnswer?.selectedOptionId ===
                                option.id
                                  ? 'border-secondary bg-secondary'
                                  : 'border-gray-500'
                              }`}
                            >
                              {currentAnswer?.selectedOptionId ===
                                option.id && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </div>
                            <span className="text-gray-300 flex-1">
                              {String.fromCharCode(
                                65 + index
                              )}
                              . {option.text}
                            </span>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <button
              onClick={() =>
                setCurrentQuestionIndex(
                  Math.max(0, currentQuestionIndex - 1)
                )
              }
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              {t('previous')}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                {answeredCount}/{questions.length}{' '}
                {t('answered')}
              </span>

              <button
                onClick={handleSubmitQuiz}
                disabled={submitting || answeredCount === 0}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <Flag size={16} />
                    {t('submitQuiz')}
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() =>
                setCurrentQuestionIndex(
                  Math.min(
                    questions.length - 1,
                    currentQuestionIndex + 1
                  )
                )
              }
              disabled={
                currentQuestionIndex ===
                questions.length - 1
              }
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('next')}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const detailedResults = attempt?.detailedResults;
    
    // Função helper para extrair estatísticas de forma mais limpa
    const getResultStats = () => {
      const results = detailedResults?.results;
      const score = results?.scorePercentage || attempt?.score || 0;
      const totalQuestions = results?.totalQuestions || questions.length;
      const correctAnswers = results?.correctAnswers || 0;
      
      return {
        score,
        passed: results?.passed ?? (score >= (assessment.passingScore || 70)),
        correct: correctAnswers,
        total: totalQuestions,
        wrong: totalQuestions - correctAnswers
      };
    };
    
    const stats = getResultStats();

    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Results Summary */}
          <div
            className={`p-6 rounded-lg ${
              stats.passed
                ? 'bg-green-900/20 border border-green-500/30'
                : 'bg-red-900/20 border border-red-500/30'
            }`}
          >
            <div className="flex items-center justify-center mb-4">
              {stats.passed ? (
                <Trophy
                  size={48}
                  className="text-green-400"
                />
              ) : (
                <XCircle
                  size={48}
                  className="text-red-400"
                />
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {stats.passed
                ? t('congratulations')
                : t('tryAgain')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-secondary">
                  {stats.score}%
                </p>
                <p className="text-gray-400 text-sm">
                  {t('finalScore')}
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-green-400">
                  {stats.correct}
                </p>
                <p className="text-gray-400 text-sm">
                  {t('correct')}
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-red-400">
                  {stats.wrong}
                </p>
                <p className="text-gray-400 text-sm">
                  {t('incorrect')}
                </p>
              </div>
            </div>

            {assessment.passingScore && (
              <p className="text-center text-gray-400 mt-4">
                {t('passingScore')}:{' '}
                {assessment.passingScore}%
              </p>
            )}
          </div>

          {/* Detailed Answers */}
          {detailedResults?.answers ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                {t('detailedResults')}
              </h3>

              {detailedResults.answers.map(
                (answer, index) => {
                  // Encontrar a questão original para obter os textos das opções
                  const originalQuestion = questions.find(
                    q => q.id === answer.questionId
                  );

                  // Validar se correctOptionId existe nas opções da questão
                  if (
                    originalQuestion &&
                    answer.correctOptionId
                  ) {
                    const correctExists =
                      originalQuestion.options.some(
                        opt =>
                          opt.id === answer.correctOptionId
                      );
                    if (!correctExists) {
                      console.error(
                        `Erro: correctOptionId ${answer.correctOptionId} não encontrado nas opções da questão ${answer.questionId}`
                      );
                      console.log(
                        'Opções disponíveis:',
                        originalQuestion.options.map(o => ({
                          id: o.id,
                          text: o.text,
                        }))
                      );
                    }
                  }

                  // Determinar se a resposta está correta
                  const isCorrect =
                    answer.selectedOptionId ===
                    answer.correctOptionId;

                  // Função para extrair o ID da string "Option UUID"
                  const extractOptionId = (
                    optionText: string
                  ) => {
                    const match = optionText?.match(
                      /^Option ([a-f0-9-]{36})$/i
                    );
                    return match ? match[1] : null;
                  };

                  // Obter os textos reais das opções
                  let displaySelectedText =
                    answer.selectedOptionText;
                  let displayCorrectText =
                    answer.correctOptionText;

                  if (originalQuestion) {
                    // Buscar as opções reais usando os IDs
                    const selectedOption =
                      originalQuestion.options.find(
                        opt =>
                          opt.id === answer.selectedOptionId
                      );
                    const correctOption =
                      originalQuestion.options.find(
                        opt =>
                          opt.id === answer.correctOptionId
                      );

                    // Usar o texto da opção se encontrado, senão usar fallback
                    displaySelectedText =
                      selectedOption?.text ||
                      'Opção não encontrada';
                    displayCorrectText =
                      correctOption?.text ||
                      'Opção correta não encontrada';

                    // Se o backend ainda estiver enviando "Option UUID", tentar extrair
                    if (
                      answer.selectedOptionText?.startsWith(
                        'Option '
                      ) &&
                      selectedOption
                    ) {
                      displaySelectedText =
                        selectedOption.text;
                    }
                    if (
                      answer.correctOptionText?.startsWith(
                        'Option '
                      ) &&
                      correctOption
                    ) {
                      displayCorrectText =
                        correctOption.text;
                    }
                  }

                  return (
                    <div
                      key={answer.questionId}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
                          ? 'bg-green-900/10 border-green-500/30'
                          : 'bg-red-900/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect ? (
                          <CheckCircle
                            size={20}
                            className="text-green-400 mt-1 flex-shrink-0"
                          />
                        ) : (
                          <XCircle
                            size={20}
                            className="text-red-400 mt-1 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-2">
                            {t('question')} {index + 1}:{' '}
                            {answer.questionText}
                          </h4>

                          {displaySelectedText && (
                            <div className="mb-2">
                              <span className="text-gray-400 text-sm">
                                {t('yourAnswer')}:{' '}
                              </span>
                              <span
                                className={
                                  isCorrect
                                    ? 'text-green-400'
                                    : 'text-red-400'
                                }
                              >
                                {displaySelectedText}
                              </span>
                            </div>
                          )}

                          {displayCorrectText &&
                            !isCorrect && (
                              <div className="mb-2">
                                <span className="text-gray-400 text-sm">
                                  {t('correctAnswer')}:{' '}
                                </span>
                                <span className="text-green-400">
                                  {displayCorrectText}
                                </span>
                              </div>
                            )}

                          {answer.textAnswer && (
                            <div className="mb-2">
                              <span className="text-gray-400 text-sm">
                                {t('yourAnswer')}:{' '}
                              </span>
                              <span className="text-gray-300">
                                {answer.textAnswer}
                              </span>
                            </div>
                          )}

                          {/* 🎯 EXPLICAÇÃO - A parte mais importante! */}
                          {answer.explanation && (
                            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle
                                  size={16}
                                  className="text-blue-400"
                                />
                                <span className="text-blue-400 text-sm font-medium">
                                  {t('explanation')}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm leading-relaxed">
                                {answer.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            // Fallback: Show basic question review when detailed results are not available
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                {t('reviewAnswers')}
              </h3>

              {questions.map((question, index) => {
                const userAnswer = answers.get(question.id);
                return (
                  <div
                    key={question.id}
                    className="p-4 rounded-lg border-2 bg-gray-800/50 border-gray-700"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-primary text-sm font-bold mt-1">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-2">
                          {question.text}
                        </h4>

                        {userAnswer?.selectedOptionId && (
                          <div className="mb-2">
                            <span className="text-gray-400 text-sm">
                              {t('yourAnswer')}:{' '}
                            </span>
                            <span className="text-gray-300">
                              {question.options.find(
                                opt =>
                                  opt.id ===
                                  userAnswer.selectedOptionId
                              )?.text || 'N/A'}
                            </span>
                          </div>
                        )}

                        {userAnswer?.textAnswer && (
                          <div className="mb-2">
                            <span className="text-gray-400 text-sm">
                              {t('yourAnswer')}:{' '}
                            </span>
                            <span className="text-gray-300">
                              {userAnswer.textAnswer}
                            </span>
                          </div>
                        )}

                        {!userAnswer && (
                          <div className="mb-2">
                            <span className="text-gray-400 text-sm">
                              {t('notAnswered')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(backUrl)}
              className="flex items-center justify-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
              {t('backToLesson')}
            </button>

            <button
              onClick={() => {
                setPhase('start');
                setCurrentQuestionIndex(0);
                setAttempt(null);
                setAnswers(new Map());
              }}
              className="flex items-center justify-center gap-2 bg-secondary text-primary px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors"
            >
              <RotateCcw size={20} />
              {t('tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
