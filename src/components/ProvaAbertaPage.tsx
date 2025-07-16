'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Flag,
  AlertCircle,
  Trophy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  MessageSquare,
  Eye,
  Send,
  Edit,
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

interface Question {
  id: string;
  text: string;
  type: 'OPEN_QUESTION';
  argumentId?: string;
  argumentName?: string;
  options: never[];
}

interface DetailedAnswer {
  questionId: string;
  questionText: string;
  questionType: 'OPEN_QUESTION';
  textAnswer?: string;
  isCorrect?: boolean | null;
  teacherComment?: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  reviewerId?: string;
}

interface DetailedResults {
  attempt: {
    id: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
    startedAt: string;
    submittedAt?: string;
    gradedAt?: string;
  };
  results: {
    totalQuestions: number;
    reviewedQuestions: number;
    pendingReview: number;
    correctAnswers: number;
    scorePercentage: number;
    passed: boolean;
  };
  answers: DetailedAnswer[];
}

interface Attempt {
  id: string;
  userId: string;
  assessmentId: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
  startedAt: string;
  submittedAt?: string;
  gradedAt?: string;
  detailedResults?: DetailedResults;
}

interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  textAnswer: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
  isCorrect?: boolean;
  teacherComment?: string;
  reviewerId?: string;
  answeredAt: string;
}

interface ProvaAbertaPageProps {
  assessment: Assessment;
  questions: Question[];
  locale: string;
  backUrl: string;
}

type ProvaAbertaPhase = 'start' | 'exam' | 'results';

interface ArgumentGroup {
  id: string;
  name: string;
  questions: Question[];
}

export default function ProvaAbertaPage({ assessment, questions, locale, backUrl }: ProvaAbertaPageProps) {
  const t = useTranslations('Assessment');
  const router = useRouter();
  const { toast } = useToast();

  const [phase, setPhase] = useState<ProvaAbertaPhase>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Map<string, AttemptAnswer>>(new Map());
  const [textAnswers, setTextAnswers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveTimeouts, setAutoSaveTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

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

  // Função para auto-salvar resposta com debounce
  const debouncedSaveAnswer = (questionId: string, textAnswer: string) => {
    // Cancelar timeout anterior se existir
    const existingTimeout = autoSaveTimeouts.get(questionId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Criar novo timeout
    const newTimeout = setTimeout(() => {
      saveAnswer(questionId, textAnswer);
    }, 2000); // 2 segundos de delay

    setAutoSaveTimeouts(prev => new Map(prev).set(questionId, newTimeout));
  };

  // Cleanup dos timeouts
  useEffect(() => {
    return () => {
      autoSaveTimeouts.forEach(timeout => clearTimeout(timeout));
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
            throw new Error('Tentativa não encontrada');
          case 'ATTEMPT_NOT_FINALIZED':
            throw new Error('Tentativa ainda não foi finalizada');
          case 'INSUFFICIENT_PERMISSIONS':
            throw new Error('Usuário não tem permissão para ver esta tentativa');
          default:
            throw new Error(errorData.message || `Results endpoint failed: ${resultsResponse.status}`);
        }
      }

      const resultsData = await resultsResponse.json();
      
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

  const startExam = async () => {
    setLoading(true);
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Você precisa fazer login para iniciar a prova');
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
        
        let errorMessage = 'Falha ao iniciar a prova';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Se não conseguir fazer parse do JSON, usar mensagem padrão
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { attempt, isNew } = data;
      
      setAttempt(attempt);
      
      if (!isNew) {
        // Tentativa existente - carregar respostas já salvas
        toast({
          title: 'Continuando prova',
          description: 'Encontramos uma tentativa em andamento. Continuando de onde você parou.',
        });
        
        // TODO: Carregar respostas salvas quando disponível
      }
      
      setPhase('exam');
      toast({
        title: 'Prova iniciada',
        description: 'Você pode salvar suas respostas a qualquer momento.',
      });
    } catch (error) {
      console.error('Error starting exam:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao iniciar a prova',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAnswer = async (questionId: string, textAnswer: string) => {
    if (!attempt || !textAnswer.trim()) return;

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
          textAnswer: textAnswer.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save answer error:', errorText);
        throw new Error(`Falha ao salvar resposta: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setAnswers(prev => new Map(prev).set(questionId, data.attemptAnswer));
      
      // Mostrar feedback sutil de salvamento
      toast({
        title: 'Resposta salva',
        description: 'Sua resposta foi salva automaticamente.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar sua resposta. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleTextChange = (questionId: string, value: string) => {
    setTextAnswers(prev => new Map(prev).set(questionId, value));
    
    // Auto-save com debounce
    if (value.trim()) {
      debouncedSaveAnswer(questionId, value);
    }
  };

  const handleSubmitExam = async () => {
    if (!attempt) return;

    // Verificar se todas as questões foram respondidas
    const unansweredQuestions = questions.filter(q => !answers.has(q.id) && !textAnswers.get(q.id)?.trim());
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: 'Questões não respondidas',
        description: `Você precisa responder todas as ${questions.length} questões antes de enviar.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      // Salvar respostas pendentes antes de submeter
      const pendingSaves = [];
      for (const [questionId, textAnswer] of textAnswers.entries()) {
        if (textAnswer.trim() && !answers.has(questionId)) {
          pendingSaves.push(saveAnswer(questionId, textAnswer));
        }
      }
      
      if (pendingSaves.length > 0) {
        await Promise.all(pendingSaves);
      }

      const submitResponse = await fetch(`${apiUrl}/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({
          attemptId: attempt.id,
        }),
      });

      if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        console.error('Submit error response:', errorText);
        throw new Error(`Falha ao enviar prova: ${submitResponse.status} - ${errorText}`);
      }

      const submitData = await submitResponse.json();
      
      setAttempt(prev => prev ? ({
        ...prev,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
      }) : null);
      
      setPhase('results');
      
      toast({
        title: 'Prova enviada',
        description: 'Sua prova foi enviada para revisão. Você receberá o resultado em breve.',
      });
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua prova. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'text-blue-400 bg-blue-900/20';
      case 'SUBMITTED':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'GRADING':
        return 'text-orange-400 bg-orange-900/20';
      case 'GRADED':
        return 'text-green-400 bg-green-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'Em andamento';
      case 'SUBMITTED':
        return 'Enviada para revisão';
      case 'GRADING':
        return 'Sendo revisada';
      case 'GRADED':
        return 'Revisada';
      default:
        return status;
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;
  const currentTextAnswer = currentQuestion ? textAnswers.get(currentQuestion.id) || '' : '';
  const answeredCount = answers.size + Array.from(textAnswers.values()).filter(text => text.trim()).length;
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
                Instruções da Prova Aberta
              </h2>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• {questions.length} questões dissertativas</p>
                {assessment.passingScore && (
                  <p>• Nota mínima: {assessment.passingScore}%</p>
                )}
                <p>• Suas respostas serão revisadas por um tutor</p>
                <p>• Salvamento automático das respostas</p>
                <p className="text-blue-400">• Você pode pausar e continuar depois</p>
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
              onClick={startExam}
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
                  <FileText size={20} />
                  Iniciar Prova
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'exam') {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header com Status e Progress */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">
              Questão {currentQuestionIndex + 1} de {questions.length}
            </span>
            
            {/* Status da Prova */}
            {attempt && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${getStatusColor(attempt.status)}`}>
                <Eye size={16} />
                <span className="text-sm font-medium">
                  {getStatusText(attempt.status)}
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
            <div className="max-w-4xl mx-auto space-y-6">
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
                
                {/* Área de resposta dissertativa */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">
                    Sua resposta:
                  </label>
                  <textarea
                    value={currentTextAnswer}
                    onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                    placeholder="Digite sua resposta aqui..."
                    className="w-full h-64 p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-secondary focus:outline-none resize-none"
                    disabled={attempt?.status === 'SUBMITTED'}
                  />
                  
                  {/* Indicador de salvamento */}
                  {currentAnswer && (
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <CheckCircle size={16} />
                      <span>Resposta salva automaticamente</span>
                    </div>
                  )}
                  
                  {/* Feedback do tutor, se disponível */}
                  {currentAnswer?.teacherComment && (
                    <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare size={16} className="text-yellow-400" />
                        <span className="text-yellow-400 text-sm font-medium">
                          Feedback do Tutor
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        {currentAnswer.teacherComment}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
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
                onClick={handleSubmitExam}
                disabled={submitting || answeredCount === 0 || attempt?.status === 'SUBMITTED'}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {attempt?.status === 'SUBMITTED' ? 'Enviada' : 'Enviar Prova'}
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
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Status da Submissão */}
          <div className="p-6 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <div className="flex items-center justify-center mb-4">
              <Clock size={48} className="text-blue-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Prova Enviada para Revisão
            </h2>
            
            <div className="text-center space-y-2">
              <p className="text-gray-300">
                Sua prova foi enviada com sucesso e está sendo revisada por um tutor.
              </p>
              <p className="text-sm text-gray-400">
                Você receberá o resultado em breve.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">{questions.length}</p>
                <p className="text-gray-400 text-sm">Questões Respondidas</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-400">Pendente</p>
                <p className="text-gray-400 text-sm">Status da Revisão</p>
              </div>
            </div>
          </div>

          {/* Resumo das Respostas */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">
              Suas Respostas
            </h3>
            
            {questions.map((question, index) => {
              const answer = answers.get(question.id);
              const textAnswer = textAnswers.get(question.id);
              const finalAnswer = answer?.textAnswer || textAnswer || '';
              
              return (
                <div key={question.id} className="p-4 rounded-lg border-2 bg-gray-800/50 border-gray-700">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-primary text-sm font-bold mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-2">
                        {question.text}
                      </h4>
                      
                      {/* Argumento */}
                      {question.argumentName && (
                        <div className="mb-2">
                          <span className="text-blue-400 text-sm">
                            Argumento: {question.argumentName}
                          </span>
                        </div>
                      )}
                      
                      {finalAnswer && (
                        <div className="mb-2">
                          <span className="text-gray-400 text-sm">Sua resposta: </span>
                          <div className="mt-1 p-2 bg-gray-700 rounded text-gray-300 text-sm">
                            {finalAnswer}
                          </div>
                        </div>
                      )}
                      
                      {!finalAnswer && (
                        <div className="mb-2">
                          <span className="text-gray-400 text-sm">Não respondida</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
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
                setTextAnswers(new Map());
              }}
              className="flex items-center justify-center gap-2 bg-secondary text-primary px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors"
            >
              <Edit size={20} />
              Nova Tentativa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}