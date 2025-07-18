'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Calendar,
  BookOpen,
  GraduationCap,
  Edit,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  Trophy,
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
  passingScore?: number;
}

interface Question {
  id: string;
  text: string;
  type: 'OPEN_QUESTION';
  argumentId?: string;
  argumentName?: string;
}

interface Answer {
  id: string;
  questionId: string;
  textAnswer: string;
  isCorrect?: boolean | null;
  teacherComment?: string;
  reviewerId?: string;
  status: 'SUBMITTED' | 'GRADING' | 'GRADED';
  answeredAt: string;
}

interface AttemptData {
  id: string;
  student: Student;
  assessment: Assessment;
  status: 'SUBMITTED' | 'GRADING' | 'GRADED';
  submittedAt: string;
  questions: Question[];
  answers: Answer[];
  totalQuestions: number;
  reviewedQuestions: number;
  pendingReview: number;
}

interface TutorReviewPageProps {
  attemptId: string;
  locale: string;
  backUrl: string;
}

export default function TutorReviewPage({ attemptId, locale, backUrl }: TutorReviewPageProps) {
  const t = useTranslations('Tutor');
  const router = useRouter();
  const { toast } = useToast();

  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Local state for current question review
  const [currentReview, setCurrentReview] = useState<{
    isCorrect: boolean | null;
    teacherComment: string;
  }>({
    isCorrect: null,
    teacherComment: '',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  useEffect(() => {
    fetchAttemptData();
  }, [attemptId]);

  useEffect(() => {
    if (attemptData && attemptData.questions.length > 0) {
      const currentQuestion = attemptData.questions[currentQuestionIndex];
      const currentAnswer = attemptData.answers.find(a => a.questionId === currentQuestion.id);
      
      setCurrentReview({
        isCorrect: currentAnswer?.isCorrect ?? null,
        teacherComment: currentAnswer?.teacherComment || '',
      });
    }
  }, [currentQuestionIndex, attemptData]);

  const fetchAttemptData = async () => {
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`${apiUrl}/attempts/${attemptId}/results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar dados da tentativa');
      }

      const data = await response.json();
      console.log('API Response data:', data);
      console.log('Number of answers in response:', data.answers?.length || 0);
      console.log('Answers array:', data.answers);
      
      // Mapear os dados da API para o formato esperado pelo componente
      const mappedData = {
        id: data.attempt?.id || attemptId,
        student: {
          id: data.user?.id || '',
          name: data.user?.name || 'Nome não disponível',
          email: data.user?.email || '',
        },
        assessment: {
          id: data.assessment?.id || '',
          title: data.assessment?.title || 'Avaliação',
          type: data.assessment?.type || 'PROVA_ABERTA',
          passingScore: data.assessment?.passingScore || 0,
        },
        status: data.attempt?.status || 'SUBMITTED',
        submittedAt: data.attempt?.submittedAt || new Date().toISOString(),
        questions: (data.answers || [])
          .filter((answer: any) => answer.questionType === 'OPEN')
          .map((answer: any) => ({
            id: answer.questionId,
            text: answer.questionText,
            type: 'OPEN_QUESTION',
          })),
        answers: (data.answers || [])
          .filter((answer: any) => answer.questionType === 'OPEN' || answer.questionType === 'OPEN_QUESTION')
          .map((answer: any) => {
            console.log('Raw answer object:', JSON.stringify(answer, null, 2));
            // Usar o campo id retornado pela API
            const answerId = answer.id;
            console.log('Found answerId:', answerId);
            return {
              id: answerId,
              questionId: answer.questionId,
              textAnswer: answer.textAnswer || answer.answer,
              isCorrect: answer.isCorrect,
              teacherComment: answer.teacherComment,
              reviewerId: answer.reviewerId,
              status: answer.status,
              answeredAt: answer.submittedAt || answer.answeredAt,
              // Guardar dados originais para debug
              originalData: answer,
            };
          }),
        totalQuestions: data.results?.totalQuestions || 0,
        reviewedQuestions: data.results?.reviewedQuestions || 0,
        pendingReview: data.results?.pendingReview || 0,
      };

      console.log('Mapped data - questions:', mappedData.questions);
      console.log('Mapped data - answers:', mappedData.answers);
      console.log('Total questions mapped:', mappedData.questions.length);
      console.log('Total answers mapped:', mappedData.answers.length);

      setAttemptData(mappedData);
    } catch (error) {
      console.error('Error fetching attempt data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da tentativa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReview = async (questionId: string, isCorrect: boolean | null, teacherComment: string) => {
    if (!attemptData) return;

    // Validar que o professor marcou como correta ou incorreta
    if (isCorrect === null) {
      toast({
        title: 'Atenção',
        description: 'Você deve marcar a resposta como correta ou incorreta.',
        variant: 'destructive',
      });
      return;
    }

    // Se marcou como incorreta, deve fornecer comentário
    if (isCorrect === false && !teacherComment.trim()) {
      toast({
        title: 'Atenção',
        description: 'Você deve fornecer um comentário quando a resposta está incorreta.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      // Obter userId do token
      let userId = '';
      try {
        const payload = JSON.parse(atob(token?.split('.')[1] || ''));
        userId = payload.sub || payload.id;
      } catch (e) {
        throw new Error('Token inválido');
      }

      // Encontrar o answerId para esta questão
      const answer = attemptData.answers.find(a => a.questionId === questionId);
      if (!answer || !answer.id) {
        throw new Error('Não foi possível obter o ID da resposta');
      }

      const reviewPayload = {
        reviewerId: userId,
        isCorrect,
        teacherComment: teacherComment.trim() || undefined,
      };
      
      console.log('Review URL:', `${apiUrl}/attempts/answers/${answer.id}/review`);
      console.log('Review payload:', reviewPayload);

      const response = await fetch(`${apiUrl}/attempts/answers/${answer.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(reviewPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Review API error response:', errorText);
        console.error('Review API error status:', response.status);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
          console.error('Parsed error data:', errorData);
        } catch (e) {
          console.error('Could not parse error response as JSON');
        }
        throw new Error(`Falha ao salvar revisão: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Review response:', data);
      
      // Update local state
      setAttemptData(prev => prev ? {
        ...prev,
        answers: prev.answers.map(a => 
          a.questionId === questionId 
            ? { 
                ...a, 
                isCorrect: isCorrect,
                teacherComment: teacherComment,
                status: 'GRADED',
                reviewerId: userId,
              }
            : a
        ),
        status: data.attemptStatus?.status || prev.status,
        reviewedQuestions: prev.reviewedQuestions + 1,
        pendingReview: Math.max(0, prev.pendingReview - 1),
      } : null);

      toast({
        title: 'Sucesso',
        description: 'Revisão salva com sucesso.',
      });
    } catch (error) {
      console.error('Error saving review:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a revisão.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCurrentReview = () => {
    if (!attemptData) return;
    
    const currentQuestion = attemptData.questions[currentQuestionIndex];
    saveReview(currentQuestion.id, currentReview.isCorrect, currentReview.teacherComment);
  };


  const findNextPendingQuestion = () => {
    if (!attemptData) return -1;
    
    // Procurar próxima questão pendente
    for (let i = currentQuestionIndex + 1; i < attemptData.questions.length; i++) {
      if (isAnswerReviewable(attemptData.questions[i].id)) {
        return i;
      }
    }
    return -1;
  };

  const findPreviousPendingQuestion = () => {
    if (!attemptData) return -1;
    
    // Procurar questão pendente anterior
    for (let i = currentQuestionIndex - 1; i >= 0; i--) {
      if (isAnswerReviewable(attemptData.questions[i].id)) {
        return i;
      }
    }
    return -1;
  };

  const goToNextQuestion = () => {
    if (!attemptData) return;
    
    // Se a questão atual pode ser revisada, salvar antes de mover
    if (isCurrentReviewable) {
      handleSaveCurrentReview();
    }
    
    // Tentar ir para próxima questão pendente, senão próxima qualquer
    const nextPending = findNextPendingQuestion();
    const nextIndex = nextPending !== -1 ? nextPending : currentQuestionIndex + 1;
    
    if (nextIndex < attemptData.questions.length) {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const goToPreviousQuestion = () => {
    if (!attemptData) return;
    
    // Tentar ir para questão pendente anterior, senão anterior qualquer
    const prevPending = findPreviousPendingQuestion();
    const prevIndex = prevPending !== -1 ? prevPending : currentQuestionIndex - 1;
    
    if (prevIndex >= 0) {
      setCurrentQuestionIndex(prevIndex);
    }
  };

  const getQuestionStatus = (questionId: string) => {
    if (!attemptData) return 'pending';
    
    const answer = attemptData.answers.find(a => a.questionId === questionId);
    if (!answer) return 'pending';
    
    // Seguir regras do backend: SUBMITTED = pode revisar, GRADED = já revisado
    if (answer.status === 'GRADED') return 'graded';
    if (answer.status === 'SUBMITTED') return 'submitted';
    return 'pending';
  };

  const isAnswerReviewable = (questionId: string) => {
    if (!attemptData) return false;
    
    const answer = attemptData.answers.find(a => a.questionId === questionId);
    if (!answer) return false;
    
    // Regra do backend: SUBMITTED e sem reviewerId
    return answer.status === 'SUBMITTED' && !answer.reviewerId;
  };

  const getReviewedCount = () => {
    if (!attemptData) return 0;
    return attemptData.answers.filter(a => a.status === 'GRADED').length;
  };

  const getPendingCount = () => {
    if (!attemptData) return 0;
    return attemptData.answers.filter(a => a.status === 'SUBMITTED' && !a.reviewerId).length;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-gray-300">Carregando dados da tentativa...</p>
        </div>
      </div>
    );
  }

  if (!attemptData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Tentativa não encontrada
          </h3>
          <p className="text-gray-400">
            A tentativa que você está procurando não foi encontrada.
          </p>
        </div>
      </div>
    );
  }

  if (attemptData.questions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle size={48} className="text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhuma questão encontrada
          </h3>
          <p className="text-gray-400">
            Esta tentativa não possui questões para revisar.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>Debug info:</p>
            <p>Questions: {attemptData.questions.length}</p>
            <p>Answers: {attemptData.answers.length}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = attemptData.questions[currentQuestionIndex];
  const currentAnswer = attemptData.answers.find(a => a.questionId === currentQuestion.id);
  const reviewedCount = getReviewedCount();
  const pendingCount = getPendingCount();
  const currentQuestionStatus = getQuestionStatus(currentQuestion.id);
  const isCurrentReviewable = isAnswerReviewable(currentQuestion.id);
  const progressPercentage = (reviewedCount / attemptData.totalQuestions) * 100;

  return (
    <div className="flex-1 flex flex-col">
      {/* Student and Assessment Info */}
      <div className="p-6 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
              <User size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{attemptData.student.name}</h2>
              <p className="text-gray-400 text-sm">{attemptData.student.email}</p>
            </div>
          </div>
          
          <div className="text-right">
            <h3 className="text-lg font-semibold text-white">{attemptData.assessment.title}</h3>
            <p className="text-gray-400 text-sm">
              Enviada em {new Date(attemptData.submittedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar with Status */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">
              Questão {currentQuestionIndex + 1} de {attemptData.questions.length}
            </span>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              currentQuestionStatus === 'graded' 
                ? 'bg-green-900/20 text-green-400 border border-green-500/30'
                : currentQuestionStatus === 'submitted'
                ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/30' 
                : 'bg-gray-900/20 text-gray-400 border border-gray-500/30'
            }`}>
              {currentQuestionStatus === 'graded' ? '✓ Revisada' 
               : currentQuestionStatus === 'submitted' ? '⏳ Pendente'
               : '○ Sem resposta'}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">{reviewedCount} revisadas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-300">{pendingCount} pendentes</span>
            </div>
          </div>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question */}
          <div className="space-y-4">
            {currentQuestion.argumentName && (
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">
                    Argumento: {currentQuestion.argumentName}
                  </span>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">Questão</h3>
              <p className="text-gray-300 leading-relaxed">
                {currentQuestion.text}
              </p>
            </div>
          </div>

          {/* Student Answer */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Resposta do Aluno</h3>
            {currentAnswer?.textAnswer ? (
              <div className="p-3 bg-gray-700 rounded-lg">
                <p className="text-gray-300 whitespace-pre-wrap">
                  {currentAnswer.textAnswer}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 italic">Não respondida</p>
            )}
          </div>

          {/* Review Section */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Revisão</h3>
            
            {currentQuestionStatus === 'graded' ? (
              /* Already Reviewed - Display Only */
              <div className="space-y-4">
                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="text-green-400 font-medium">Resposta já revisada</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {currentAnswer?.isCorrect ? (
                        <>
                          <ThumbsUp size={16} className="text-green-400" />
                          <span className="text-green-400">Marcada como correta</span>
                        </>
                      ) : (
                        <>
                          <ThumbsDown size={16} className="text-red-400" />
                          <span className="text-red-400">Marcada como incorreta</span>
                        </>
                      )}
                    </div>
                    {currentAnswer?.teacherComment && (
                      <div className="mt-3 p-3 bg-gray-700 rounded">
                        <p className="text-sm text-gray-300">{currentAnswer.teacherComment}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center text-gray-400 text-sm">
                  Esta resposta não pode ser revisada novamente
                </div>
              </div>
            ) : isCurrentReviewable ? (
              /* Can Review - Interactive */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Avaliação da Resposta
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentReview(prev => ({ ...prev, isCorrect: true }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        currentReview.isCorrect === true
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500'
                      }`}
                    >
                      <ThumbsUp size={20} />
                      Correta
                    </button>
                    
                    <button
                      onClick={() => setCurrentReview(prev => ({ ...prev, isCorrect: false }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        currentReview.isCorrect === false
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-red-500'
                      }`}
                    >
                      <ThumbsDown size={20} />
                      Incorreta
                    </button>
                  </div>
                </div>

                {/* Teacher Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Comentário do Tutor {currentReview.isCorrect === false && <span className="text-red-400">*</span>}
                  </label>
                  <textarea
                    value={currentReview.teacherComment}
                    onChange={(e) => setCurrentReview(prev => ({ ...prev, teacherComment: e.target.value }))}
                    placeholder={currentReview.isCorrect === true ? "Adicione um comentário para o aluno (opcional)..." : currentReview.isCorrect === false ? "Explique por que a resposta está incorreta..." : "Selecione uma avaliação acima para comentar..."}
                    className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-secondary focus:outline-none resize-none"
                  />
                  {currentReview.isCorrect === false && !currentReview.teacherComment.trim() && (
                    <p className="text-sm text-red-400 mt-1">
                      Comentário obrigatório quando a resposta está incorreta.
                    </p>
                  )}
                  {currentReview.isCorrect === null && (
                    <p className="text-sm text-yellow-400 mt-1">
                      Selecione "Correta" ou "Incorreta" antes de enviar a revisão.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Cannot Review - No Response or Invalid State */
              <div className="text-center space-y-3">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <AlertCircle size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Esta questão não pode ser revisada</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {!currentAnswer ? 'Sem resposta do aluno' : 'Estado inválido para revisão'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">
              {findPreviousPendingQuestion() !== -1 ? 'Pendente Anterior' : 'Anterior'}
            </span>
            <span className="sm:hidden">Anterior</span>
          </button>

          <div className="flex items-center gap-3">
            {isCurrentReviewable ? (
              <button
                onClick={handleSaveCurrentReview}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar Revisão
                  </>
                )}
              </button>
            ) : currentQuestionStatus === 'graded' ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Revisão concluída</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Não revisável</span>
              </div>
            )}

            {pendingCount === 0 && reviewedCount > 0 && (
              <div className="flex items-center gap-2 text-green-400">
                <Trophy size={16} />
                <span className="text-sm font-medium">
                  Todas as revisões concluídas!
                </span>
              </div>
            )}
          </div>

          <button
            onClick={goToNextQuestion}
            disabled={currentQuestionIndex === attemptData.questions.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">
              {findNextPendingQuestion() !== -1 ? 'Próxima Pendente' : 'Próxima'}
            </span>
            <span className="sm:hidden">Próxima</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}