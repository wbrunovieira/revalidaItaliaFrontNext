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
  Clock,
  Timer,
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
  type: 'MULTIPLE_CHOICE' | 'OPEN_QUESTION';
  options: Option[];
  argumentId?: string;
  argumentName?: string;
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

interface SimuladoPageProps {
  assessment: Assessment;
  questions: Question[];
  locale: string;
  backUrl: string;
}

type SimuladoPhase = 'start' | 'simulado' | 'results';

interface ArgumentGroup {
  id: string;
  name: string;
  questions: Question[];
}

export default function SimuladoPage({ assessment, questions, locale, backUrl }: SimuladoPageProps) {
  const t = useTranslations('Assessment');
  const router = useRouter();
  const { toast } = useToast();

  const [phase, setPhase] = useState<SimuladoPhase>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Map<string, AttemptAnswer>>(new Map());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  // Agrupar questões por argumento
  const argumentGroups: ArgumentGroup[] = questions.reduce((groups: ArgumentGroup[], question) => {
    const argumentId = question.argumentId || 'no-argument';
    const argumentName = question.argumentName || 'Sem argumento';
    
    let group = groups.find(g => g.id === argumentId);
    if (!group) {
      group = { id: argumentId, name: argumentName, questions: [] };
      groups.push(group);
    }
    
    group.questions.push(question);
    return groups;
  }, []);

  // Função helper para validar integridade dos dados do simulado
  const validateSimuladoResults = (results: DetailedResults, questions: Question[]) => {
    const errors: string[] = [];

    results.answers?.forEach((answer) => {
      const question = questions.find(q => q.id === answer.questionId);

      if (!question) {
        errors.push(`Questão ${answer.questionId} não encontrada`);
        return;
      }

      // Validar selectedOptionId
      if (answer.selectedOptionId) {
        const selectedExists = question.options.some(
          opt => opt.id === answer.selectedOptionId
        );
        if (!selectedExists) {
          errors.push(`selectedOptionId ${answer.selectedOptionId} não existe na questão ${answer.questionId}`);
        }
      }

      // Validar correctOptionId
      if (answer.correctOptionId) {
        const correctExists = question.options.some(
          opt => opt.id === answer.correctOptionId
        );
        if (!correctExists) {
          errors.push(`correctOptionId ${answer.correctOptionId} não existe na questão ${answer.questionId}`);
        }
      }
    });

    if (errors.length > 0) {
      console.error('Erros de validação encontrados:', errors);
    }

    return errors.length === 0;
  };

  // Função para formatar tempo
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Função para inicializar timer
  const startTimer = (durationInMinutes: number) => {
    const totalSeconds = durationInMinutes * 60;
    setTimeLeft(totalSeconds);
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          // Tempo esgotado - submeter automaticamente
          handleSubmitSimulado();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  };

  // Limpar timer
  const clearTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // Cleanup do timer quando o componente for desmontado
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  const fetchDetailedResults = async (attemptId: string) => {
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];
      
      const resultsResponse = await fetch(`${apiUrl}/attempts/${attemptId}/results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!resultsResponse.ok) {
        const errorData = await resultsResponse.json();
        console.error('Results endpoint failed:', errorData);
        
        switch (errorData.error) {
          case 'ATTEMPT_NOT_FOUND':
            throw new Error('Attempt não encontrado');
          case 'ATTEMPT_NOT_FINALIZED':
            throw new Error('Attempt ainda não foi finalizado');
          case 'INSUFFICIENT_PERMISSIONS':
            throw new Error('Usuário não tem permissão para ver este attempt');
          default:
            throw new Error(errorData.message || `Results endpoint failed: ${resultsResponse.status}`);
        }
      }

      const resultsData = await resultsResponse.json();
      
      // Validar integridade dos dados
      validateSimuladoResults(resultsData, questions);

      // Store the detailed results according to the API specification
      setAttempt(prev => prev ? ({
        ...prev,
        detailedResults: resultsData
      }) : null);

      return resultsData;
    } catch (error) {
      console.error('❌ Failed to fetch detailed results:', error);
      throw error;
    }
  };

  const startSimulado = async () => {
    setLoading(true);
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Você precisa fazer login para iniciar o simulado');
      }

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

      const response = await fetch(`${apiUrl}/attempts/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          assessmentId: assessment.id,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
        
        let errorMessage = 'Failed to start simulado';
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
      
      setAttempt(attempt);
      
      if (!isNew) {
        // Tentativa existente - continuar de onde parou
        toast({
          title: t('continuingQuiz'),
          description: t('foundActiveAttempt'),
        });
        
        // Calcular tempo restante se a tentativa já estava ativa
        if (attempt.expiresAt) {
          const expiresAt = new Date(attempt.expiresAt);
          const now = new Date();
          const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
          
          if (timeRemaining > 0) {
            setTimeLeft(timeRemaining);
            startTimer(timeRemaining / 60);
          } else {
            // Tempo já expirado
            throw new Error('O tempo do simulado já expirou');
          }
        }
      } else {
        // Nova tentativa - iniciar timer
        if (assessment.timeLimitInMinutes) {
          startTimer(assessment.timeLimitInMinutes);
        }
      }
      
      setPhase('simulado');
      toast({
        title: 'Simulado iniciado',
        description: assessment.timeLimitInMinutes ? `Você tem ${assessment.timeLimitInMinutes} minutos para completar` : 'Boa sorte!',
      });
    } catch (error) {
      console.error('Error starting simulado:', error);
      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : 'Erro ao iniciar simulado',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (questionId: string, selectedOptionId?: string, textAnswer?: string) => {
    if (!attempt) return;

    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`${apiUrl}/attempts/${attempt.id}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          questionId,
          selectedOptionId,
          textAnswer,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save answer error:', errorText);
        throw new Error(`Failed to save answer: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setAnswers(prev => new Map(prev).set(questionId, data.attemptAnswer));
    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: t('error.title'),
        description: t('error.saveAnswer'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmitSimulado = async () => {
    if (!attempt) return;

    // Parar o timer
    clearTimer();

    setSubmitting(true);
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const submitResponse = await fetch(`${apiUrl}/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Submit error response:', errorText);
        throw new Error(`Failed to submit simulado: ${submitResponse.status} - ${errorText}`);
      }

      const submitData = await submitResponse.json();
      const finalAttemptId = submitData.attemptId || submitData.id || attempt.id;
      
      setAttempt(prev => prev ? ({
        ...prev,
        id: finalAttemptId,
        status: submitData.status,
        score: submitData.score,
        gradedAt: submitData.gradedAt
      }) : null);
      
      // Buscar resultados detalhados
      try {
        await fetchDetailedResults(finalAttemptId);
      } catch (error) {
        console.warn('⚠️ Failed to fetch detailed results, using fallback:', error);
        setAttempt(prev => prev ? ({
          ...prev,
          detailedResults: {
            attempt: submitData.attempt,
            summary: submitData.summary,
            assessment: {
              id: assessment.id,
              title: assessment.title,
              type: assessment.type,
              passingScore: assessment.passingScore || 0
            },
            answers: []
          }
        }) : null);
      }
      
      setPhase('results');
      
      toast({
        title: 'Simulado finalizado',
        description: 'Suas respostas foram enviadas com sucesso.',
      });
    } catch (error) {
      console.error('Error submitting simulado:', error);
      toast({
        title: t('error.title'),
        description: 'Erro ao finalizar simulado',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;
  const answeredCount = answers.size;
  const progressPercentage = (answeredCount / questions.length) * 100;

  // Encontrar o grupo atual da questão
  const currentArgumentGroup = argumentGroups.find(group => 
    group.questions.some(q => q.id === currentQuestion?.id)
  );

  if (phase === 'start') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">
                Instruções do Simulado
              </h2>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• {questions.length} questões</p>
                {assessment.passingScore && (
                  <p>• Nota mínima: {assessment.passingScore}%</p>
                )}
                {assessment.timeLimitInMinutes && (
                  <p className="text-orange-400">
                    • Tempo limite: {assessment.timeLimitInMinutes} minutos
                  </p>
                )}
                <p>• Questões agrupadas por argumentos</p>
                <p className="text-red-400">• Não é possível pausar o simulado</p>
              </div>
            </div>
            
            {/* Mostrar argumentos */}
            {argumentGroups.length > 0 && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-md font-semibold text-white mb-2">
                  Argumentos ({argumentGroups.length})
                </h3>
                <div className="space-y-1 text-sm text-gray-300">
                  {argumentGroups.map(group => (
                    <div key={group.id} className="flex justify-between">
                      <span>{group.name}</span>
                      <span>{group.questions.length} questões</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={startSimulado}
              disabled={loading || questions.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-primary px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  Iniciando...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Iniciar Simulado
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'simulado') {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header com Timer e Progress */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">
              Questão {currentQuestionIndex + 1} de {questions.length}
            </span>
            
            {/* Timer */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                timeLeft <= 300 ? 'bg-red-900/20 text-red-400' : 'bg-blue-900/20 text-blue-400'
              }`}>
                <Timer size={16} />
                <span className="font-mono font-bold">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
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
              {/* Argumento */}
              {currentArgumentGroup && (
                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-blue-400" />
                    <span className="text-blue-400 text-sm font-medium">
                      Argumento: {currentArgumentGroup.name}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white leading-relaxed">
                  {currentQuestion.text}
                </h2>
                
                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={option.id}
                        onClick={() => saveAnswer(currentQuestion.id, option.id)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          currentAnswer?.selectedOptionId === option.id
                            ? 'border-secondary bg-secondary/10'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            currentAnswer?.selectedOptionId === option.id
                              ? 'border-secondary bg-secondary'
                              : 'border-gray-500'
                          }`}>
                            {currentAnswer?.selectedOptionId === option.id && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <span className="text-gray-300 flex-1">
                            {String.fromCharCode(65 + index)}. {option.text}
                          </span>
                        </div>
                      </button>
                    ))}
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
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              Anterior
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                {answeredCount}/{questions.length} respondidas
              </span>
              
              <button
                onClick={handleSubmitSimulado}
                disabled={submitting}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Finalizando...
                  </>
                ) : (
                  <>
                    <Flag size={16} />
                    Finalizar Simulado
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
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
          <div className={`p-6 rounded-lg ${
            stats.passed ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'
          }`}>
            <div className="flex items-center justify-center mb-4">
              {stats.passed ? (
                <Trophy size={48} className="text-green-400" />
              ) : (
                <XCircle size={48} className="text-red-400" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {stats.passed ? 'Parabéns!' : 'Tente Novamente'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-3xl font-bold text-secondary">{stats.score}%</p>
                <p className="text-gray-400 text-sm">Pontuação Final</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-green-400">{stats.correct}</p>
                <p className="text-gray-400 text-sm">Corretas</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-red-400">{stats.wrong}</p>
                <p className="text-gray-400 text-sm">Incorretas</p>
              </div>
            </div>
            
            {assessment.passingScore && (
              <p className="text-center text-gray-400 mt-4">
                Nota mínima: {assessment.passingScore}%
              </p>
            )}
          </div>

          {/* Detailed Answers */}
          {detailedResults?.answers ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                Resultados Detalhados
              </h3>
              
              {detailedResults.answers.map((answer, index) => {
                const originalQuestion = questions.find(q => q.id === answer.questionId);
                const isCorrect = answer.selectedOptionId === answer.correctOptionId;
                
                let displaySelectedText = 'Opção não encontrada';
                let displayCorrectText = 'Opção correta não encontrada';
                
                if (originalQuestion) {
                  const selectedOption = originalQuestion.options.find(opt => opt.id === answer.selectedOptionId);
                  const correctOption = originalQuestion.options.find(opt => opt.id === answer.correctOptionId);
                  
                  displaySelectedText = selectedOption?.text || 'Opção não encontrada';
                  displayCorrectText = correctOption?.text || 'Opção correta não encontrada';
                }
                
                return (
                  <div
                    key={answer.questionId}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect ? 'bg-green-900/10 border-green-500/30' : 'bg-red-900/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {isCorrect ? (
                        <CheckCircle size={20} className="text-green-400 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle size={20} className="text-red-400 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-2">
                          Questão {index + 1}: {answer.questionText}
                        </h4>
                        
                        {/* Argumento */}
                        {originalQuestion?.argumentName && (
                          <div className="mb-2">
                            <span className="text-blue-400 text-sm">
                              Argumento: {originalQuestion.argumentName}
                            </span>
                          </div>
                        )}
                        
                        {displaySelectedText && (
                          <div className="mb-2">
                            <span className="text-gray-400 text-sm">Sua resposta: </span>
                            <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                              {displaySelectedText}
                            </span>
                          </div>
                        )}
                        
                        {displayCorrectText && !isCorrect && (
                          <div className="mb-2">
                            <span className="text-gray-400 text-sm">Resposta correta: </span>
                            <span className="text-green-400">
                              {displayCorrectText}
                            </span>
                          </div>
                        )}
                        
                        {answer.explanation && (
                          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle size={16} className="text-blue-400" />
                              <span className="text-blue-400 text-sm font-medium">
                                Explicação
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
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>Resultados detalhados não disponíveis</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(backUrl)}
              className="flex items-center justify-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
              Voltar à Aula
            </button>
            
            <button
              onClick={() => {
                setPhase('start');
                setCurrentQuestionIndex(0);
                setAttempt(null);
                setAnswers(new Map());
                setTimeLeft(null);
                clearTimer();
              }}
              className="flex items-center justify-center gap-2 bg-secondary text-primary px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors"
            >
              <RotateCcw size={20} />
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}