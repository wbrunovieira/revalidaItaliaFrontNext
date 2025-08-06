// /src/components/ProvaAbertaPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  MessageSquare,
  Eye,
  Send,
  Edit,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';

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
  type: 'MULTIPLE_CHOICE' | 'OPEN_QUESTION' | 'OPEN';
  argumentId?: string;
  argumentName?: string;
  options: Option[];
}

interface Option {
  id: string;
  text: string;
}

interface DetailedAnswer {
  questionId: string;
  questionText: string;
  questionType: 'OPEN_QUESTION' | 'OPEN';
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
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Filter only open questions for this component
  const openQuestions = questions.filter(q => q.type === 'OPEN_QUESTION' || q.type === 'OPEN');

  const [phase, setPhase] = useState<ProvaAbertaPhase>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Map<string, AttemptAnswer>>(new Map());
  const [textAnswers, setTextAnswers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveTimeouts, setAutoSaveTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [savingAnswers, setSavingAnswers] = useState<Set<string>>(new Set()); // Track which answers are being saved
  const [existingAttempt, setExistingAttempt] = useState<Attempt | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  // Agrupar questões por argumento
  const argumentGroups: ArgumentGroup[] = openQuestions.reduce((groups: ArgumentGroup[], question) => {
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
  }, [autoSaveTimeouts]);

  // Verificar se já existe uma tentativa ao carregar
  useEffect(() => {
    const checkExistingAttempt = async () => {
      try {
        const token = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          return;
        }

        // Tentar iniciar para verificar se já existe
        try {
          if (!token || !isAuthenticated || !user) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }
          console.log('User ID:', user.id);
        } catch {
          return;
        }
        
        const identityId = user?.id;
        if (!identityId) {
          return;
        }

        // Primeiro, buscar o status correto usando o novo endpoint
        const statusResponse = await fetch(`${apiUrl}/api/v1/assessments/${assessment.id}/attempt-status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          
          if (statusData.hasActiveAttempt && statusData.attemptId) {
            // Usar o status correto da nova API
            setExistingAttempt({
              id: statusData.attemptId,
              userId: identityId,
              assessmentId: assessment.id,
              status: statusData.status || 'IN_PROGRESS',
              startedAt: new Date().toISOString(),
              submittedAt: statusData.submittedAt,
              gradedAt: statusData.gradedAt,
            });
            setInitialCheckDone(true);
            return;
          }
        }

        // Se não tem tentativa pela nova API, não há tentativa existente
        setInitialCheckDone(true);
      } catch (error) {
        console.error('Error checking existing attempt:', error);
      } finally {
        setInitialCheckDone(true);
      }
    };

    checkExistingAttempt();
  }, [assessment.id, apiUrl, isAuthenticated, user]);


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
      } catch {
        throw new Error('Token de autenticação inválido');
      }
      
      const identityId = payload.sub || payload.id;

      if (!identityId) {
        throw new Error('User ID not found in token');
      }

      const response = await fetch(`${apiUrl}/api/v1/attempts/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          identityId,
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
          errorMessage = errorData.message || errorData.detail || errorMessage;
          
          // Check if it's a "already graded" error
          if (errorData.detail && errorData.detail.includes('already has a graded attempt')) {
            // Refresh the page to show the correct status
            window.location.reload();
            return;
          }
        } catch {
          // Se não conseguir fazer parse do JSON, usar mensagem padrão
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { attempt, isNew } = data;
      
      setAttempt(attempt);
      
      if (!isNew) {
        // Verificar status da tentativa existente
        if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADING') {
          toast({
            title: 'Prova já enviada',
            description: 'Esta prova já foi enviada para correção. Acompanhe o status na página de provas abertas.',
            variant: 'destructive',
          });
          
          // Redirecionar para página de acompanhamento
          setTimeout(() => {
            router.push(`/${locale}/assessments/open-exams`);
          }, 2000);
          return;
        } else if (attempt.status === 'GRADED') {
          toast({
            title: 'Prova já avaliada',
            description: 'Esta prova já foi corrigida. Veja o resultado na página de provas abertas.',
            variant: 'destructive',
          });
          
          // Redirecionar para página de resultados
          setTimeout(() => {
            router.push(`/${locale}/assessments/open-exams/${attempt.id}`);
          }, 2000);
          return;
        } else {
          // Status IN_PROGRESS - continuar prova
          toast({
            title: 'Continuando prova',
            description: 'Encontramos uma tentativa em andamento. Continuando de onde você parou.',
          });
        }
        
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

    // Check if already saving this answer
    if (savingAnswers.has(questionId)) {
      console.log(`Already saving answer for question ${questionId}, skipping...`);
      return;
    }

    // Check if attempt is still active
    if (attempt.status !== 'IN_PROGRESS') {
      console.log(`Attempt is not active (status: ${attempt.status}), skipping save...`);
      return;
    }

    try {
      // Mark as saving
      setSavingAnswers(prev => new Set(prev).add(questionId));

      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`${apiUrl}/api/v1/attempts/${attempt.id}/answers`, {
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
      // Only show error toast if attempt is still active
      if (attempt.status === 'IN_PROGRESS') {
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar sua resposta. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      // Remove from saving set
      setSavingAnswers(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
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

    // Prevent double submission
    if (submitting || attempt.status !== 'IN_PROGRESS') {
      console.log(`Submission already in progress or attempt not active (status: ${attempt.status})`);
      return;
    }

    // Verificar se todas as questões foram respondidas
    const unansweredQuestions = openQuestions.filter(q => !answers.has(q.id) && !textAnswers.get(q.id)?.trim());
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: 'Questões não respondidas',
        description: `Você precisa responder todas as ${openQuestions.length} questões antes de enviar.`,
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

      // Wait for any ongoing saves to complete
      if (savingAnswers.size > 0) {
        console.log(`Waiting for ${savingAnswers.size} answers to finish saving...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }

      // Salvar respostas pendentes antes de submeter
      const pendingSaves = [];
      for (const [questionId, textAnswer] of textAnswers.entries()) {
        if (textAnswer.trim() && !answers.has(questionId) && !savingAnswers.has(questionId)) {
          pendingSaves.push(saveAnswer(questionId, textAnswer));
        }
      }
      
      if (pendingSaves.length > 0) {
        await Promise.all(pendingSaves);
        // Add a small delay to ensure saves are processed
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const submitResponse = await fetch(`${apiUrl}/api/v1/attempts/${attempt.id}/submit`, {
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

      await submitResponse.json();
      
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

  const currentQuestion = openQuestions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;
  const currentTextAnswer = currentQuestion ? textAnswers.get(currentQuestion.id) || '' : '';
  // Contar questões que têm resposta (salva no servidor OU no estado local)
  const answeredCount = openQuestions.filter(question => {
    const hasSavedAnswer = answers.has(question.id);
    const hasLocalAnswer = textAnswers.get(question.id)?.trim();
    const isAnswered = hasSavedAnswer || hasLocalAnswer;
    return isAnswered;
  }).length;
  const progressPercentage = (answeredCount / openQuestions.length) * 100;

  // Encontrar o grupo atual da questão
  const currentArgumentGroup = argumentGroups.find(group => 
    group.questions.some(q => q.id === currentQuestion?.id)
  );

  // Se ainda estamos verificando o status inicial, mostrar loading
  if (!initialCheckDone) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary"></div>
          <span className="text-gray-400">Verificando status da prova...</span>
        </div>
      </div>
    );
  }

  // Se existe uma tentativa, mostrar o status imediatamente
  if (existingAttempt && phase === 'start') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-4">
            {existingAttempt.status === 'IN_PROGRESS' && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Instruções da Prova Aberta
                </h2>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>• {openQuestions.length} questões dissertativas</p>
                  {assessment.passingScore && (
                    <p>• Nota mínima: {assessment.passingScore}%</p>
                  )}
                  <p>• Suas respostas serão revisadas por um tutor</p>
                  <p>• Salvamento automático das respostas</p>
                  <p className="text-blue-400">• Você pode pausar e continuar depois</p>
                </div>
              </div>
            )}

            {existingAttempt.status === 'SUBMITTED' && (
              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={20} className="text-blue-400" />
                  <span className="text-blue-400 font-medium">Prova enviada para correção</span>
                </div>
                <p className="text-sm text-gray-300">
                  Esta prova já foi enviada e está aguardando revisão do tutor.
                </p>
              </div>
            )}
            
            {existingAttempt.status === 'GRADING' && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={20} className="text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Prova em correção</span>
                </div>
                <p className="text-sm text-gray-300">
                  O tutor está revisando suas respostas.
                </p>
              </div>
            )}
            
            {existingAttempt.status === 'GRADED' && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className="text-green-400" />
                  <span className="text-green-400 font-medium">Prova corrigida</span>
                </div>
                <p className="text-sm text-gray-300">
                  A correção foi concluída. Veja o resultado detalhado.
                </p>
              </div>
            )}
            
            <button
              onClick={() => {
                if (existingAttempt.status === 'GRADED' || existingAttempt.status === 'SUBMITTED' || existingAttempt.status === 'GRADING') {
                  // Para qualquer status que não seja IN_PROGRESS, redirecionar para a página específica da tentativa
                  router.push(`/${locale}/assessments/open-exams/${existingAttempt.id}`);
                } else if (existingAttempt.status === 'IN_PROGRESS') {
                  // Continue exam only if really IN_PROGRESS
                  // Double check the status
                  if (existingAttempt.status === 'IN_PROGRESS') {
                    setAttempt(existingAttempt);
                    setPhase('exam');
                  } else {
                    // If not really IN_PROGRESS, redirect
                    router.push(`/${locale}/assessments/open-exams/${existingAttempt.id}`);
                  }
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-primary px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors font-medium"
            >
              {existingAttempt.status === 'IN_PROGRESS' ? (
                <>
                  <Edit size={20} />
                  Continuar Prova
                </>
              ) : (
                <>
                  <Eye size={20} />
                  {existingAttempt.status === 'GRADED' ? 'Ver Resultado' : 'Acompanhar Status'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se não existe tentativa ou fase não é start, mostrar tela normal
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
                <p>• {openQuestions.length} questões dissertativas</p>
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
            
            {/* Se chegou aqui, não há tentativa existente */}
            <button
                onClick={startExam}
                disabled={loading || openQuestions.length === 0}
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
            <div className="flex flex-col">
              <span className="text-sm text-gray-300">
                Questão {currentQuestionIndex + 1} de {openQuestions.length}
              </span>
              <span className="text-xs text-gray-400">
                {answeredCount} de {openQuestions.length} questões respondidas
              </span>
            </div>
            
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
                  <div className="flex items-center gap-2 text-sm">
                    {savingAnswers.has(currentQuestion.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
                        <span className="text-secondary">Salvando...</span>
                      </>
                    ) : currentAnswer ? (
                      <>
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-green-400">Resposta salva automaticamente</span>
                      </>
                    ) : currentTextAnswer.trim() ? (
                      <>
                        <Edit size={16} className="text-gray-400" />
                        <span className="text-gray-400">Digite para salvar automaticamente</span>
                      </>
                    ) : null}
                  </div>
                  
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
                {answeredCount}/{openQuestions.length} respondidas
              </span>
              
              {answeredCount === openQuestions.length ? (
                <button
                  onClick={handleSubmitExam}
                  disabled={submitting || attempt?.status === 'SUBMITTED'}
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
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertCircle size={16} />
                    <span className="text-sm">
                      Responda todas as questões para finalizar
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Suas respostas são salvas automaticamente
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentQuestionIndex(Math.min(openQuestions.length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === openQuestions.length - 1}
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
                <p className="text-2xl font-bold text-blue-400">{openQuestions.length}</p>
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
            
            {openQuestions.map((question, index) => {
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