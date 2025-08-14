// /src/components/TutorReviewPage.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  ThumbsUp,
  ThumbsDown,
  Trophy,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';

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

interface AnswerVersion {
  id: string;
  textAnswer: string;
  teacherComment?: string;
  reviewDecision?: 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'NEEDS_REVISION';
  isCorrect?: boolean | null;
  answeredAt: string;
  reviewedAt?: string;
  version: number;
  isLatest: boolean;
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
  versions?: AnswerVersion[];
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

interface AnswerHistoryEntry {
  version: number;
  textAnswer: string;
  teacherComment?: string;
  reviewDecision?: 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'NEEDS_REVISION';
  submittedAt: string;
  reviewedAt?: string;
}

interface AttemptAnswer {
  id: string;
  questionId: string;
  questionText?: string;
  questionType?: string;
  textAnswer?: string;
  answer?: string;
  isCorrect?: boolean | null;
  teacherComment?: string;
  reviewerId?: string;
  status: 'SUBMITTED' | 'GRADING' | 'GRADED';
  submittedAt?: string;
  answeredAt?: string;
  history?: AnswerHistoryEntry[];
  currentAnswer?: any;
  originalData?: unknown;
}

export default function TutorReviewPage({ attemptId }: TutorReviewPageProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Local state for current question review
  const [currentReview, setCurrentReview] = useState<{
    reviewState: 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'NEEDS_REVISION' | null;
    teacherComment: string;
  }>({
    reviewState: null,
    teacherComment: '',
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  const fetchAttemptData = useCallback(async () => {
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(`${apiUrl}/api/v1/attempts/${attemptId}/results`, {
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
      
      // Debug: verificar status individual de cada resposta da API
      console.log('Raw API answers status:');
      data.answers?.forEach((answer: any, index: number) => {
        console.log(`API Answer ${index + 1}:`, {
          id: answer.id,
          questionId: answer.questionId,
          status: answer.status,
          isCorrect: answer.isCorrect,
          reviewerId: answer.reviewerId,
          currentAnswer: answer.currentAnswer
        });
      });
      
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
          .filter((answer: AttemptAnswer) => answer.questionType === 'OPEN')
          .map((answer: AttemptAnswer) => ({
            id: answer.questionId,
            text: answer.questionText,
            type: 'OPEN_QUESTION',
          })),
        answers: (data.answers || [])
          .filter((answer: AttemptAnswer) => answer.questionType === 'OPEN')
          .map((answer: AttemptAnswer) => ({
              id: answer.id,
              questionId: answer.questionId,
              textAnswer: answer.currentAnswer?.textAnswer || answer.textAnswer || answer.answer,
              isCorrect: answer.currentAnswer?.isCorrect ?? answer.isCorrect,
              teacherComment: answer.currentAnswer?.teacherComment || answer.teacherComment,
              reviewerId: answer.reviewerId,
              status: answer.status,
              answeredAt: answer.currentAnswer?.submittedAt || answer.submittedAt || answer.answeredAt,
              versions: answer.history || [],
              // Guardar dados originais para debug
              originalData: answer,
          })),
        totalQuestions: data.results?.totalQuestions || 0,
        reviewedQuestions: data.results?.reviewedQuestions || 0,
        pendingReview: data.results?.pendingReview || 0,
      };

      console.log('Mapped data - questions:', mappedData.questions);
      console.log('Mapped data - answers:', mappedData.answers);
      console.log('Total questions mapped:', mappedData.questions.length);
      console.log('Total answers mapped:', mappedData.answers.length);
      
      // Debug: verificar status de cada resposta
      mappedData.answers.forEach((answer, index) => {
        console.log(`Answer ${index + 1}:`, {
          questionId: answer.questionId,
          status: answer.status,
          isCorrect: answer.isCorrect,
          reviewerId: answer.reviewerId,
          hasTeacherComment: !!answer.teacherComment
        });
      });

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
  }, [attemptId, toast, apiUrl]);

  useEffect(() => {
    fetchAttemptData();
  }, [fetchAttemptData]);

  useEffect(() => {
    if (attemptData && attemptData.questions.length > 0) {
      const currentQuestion = attemptData.questions[currentQuestionIndex];
      const currentAnswer = attemptData.answers.find(a => a.questionId === currentQuestion.id);
      
      // Map existing isCorrect to new review states
      let reviewState: 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'NEEDS_REVISION' | null = null;
      if (currentAnswer?.isCorrect !== undefined && currentAnswer?.isCorrect !== null) {
        reviewState = currentAnswer.isCorrect ? 'FULLY_ACCEPTED' : 'NEEDS_REVISION';
      }
      
      setCurrentReview({
        reviewState: reviewState,
        teacherComment: currentAnswer?.teacherComment || '',
      });
    }
  }, [currentQuestionIndex, attemptData]);


  const saveReview = async (questionId: string, reviewState: typeof currentReview.reviewState, teacherComment: string) => {
    if (!attemptData) return;

    // Validar que o professor selecionou um estado de revisão
    if (reviewState === null) {
      toast({
        title: 'Atenção',
        description: 'Você deve selecionar um estado de revisão.',
        variant: 'destructive',
      });
      return;
    }

    // Se marcou como NEEDS_REVISION ou PARTIALLY_ACCEPTED, deve fornecer comentário
    if ((reviewState === 'NEEDS_REVISION' || reviewState === 'PARTIALLY_ACCEPTED') && !teacherComment.trim()) {
      toast({
        title: 'Atenção',
        description: reviewState === 'NEEDS_REVISION' 
          ? 'Você deve fornecer um comentário explicando o que precisa ser corrigido.'
          : 'Você deve fornecer informações complementares para a resposta parcialmente aceita.',
        variant: 'destructive',
      });
      return;
    }
    
    // Clear comment for FULLY_ACCEPTED to ensure it's not sent
    const finalComment = reviewState === 'FULLY_ACCEPTED' ? '' : teacherComment.trim();

    setSaving(true);
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      // Obter userId do token
      let userId = '';
      try {
        if (!token || !isAuthenticated || !user) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        console.log('Tutor ID:', user.id);
        userId = user?.id;
      } catch {
        throw new Error('Token inválido');
      }

      // Encontrar o answerId para esta questão
      const answer = attemptData.answers.find(a => a.questionId === questionId);
      if (!answer || !answer.id) {
        throw new Error('Não foi possível obter o ID da resposta');
      }

      // Map reviewState to isCorrect for backward compatibility
      const isCorrect = reviewState === 'FULLY_ACCEPTED' ? true : 
                       reviewState === 'NEEDS_REVISION' ? false : 
                       true; // PARTIALLY_ACCEPTED is treated as correct but with additional info
      
      const reviewPayload = {
        reviewerId: userId,
        isCorrect: isCorrect,
        teacherComment: finalComment || undefined,
        reviewDecision: reviewState, // Use reviewDecision instead of reviewState
      };
      
      console.log('Review URL:', `${apiUrl}/api/v1/attempts/answers/${answer.id}/review`);
      console.log('Review payload:', reviewPayload);

      const response = await fetch(`${apiUrl}/api/v1/attempts/answers/${answer.id}/review`, {
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
        } catch {
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
                teacherComment: finalComment,
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
    saveReview(currentQuestion.id, currentReview.reviewState, currentReview.teacherComment);
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

          {/* Student Answer with History */}
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              {currentAnswer?.versions && currentAnswer.versions.length > 1 
                ? 'Histórico de Respostas e Revisões' 
                : 'Resposta do Aluno'}
            </h3>
            
            {currentAnswer?.versions && currentAnswer.versions.length > 0 ? (
              <div className="space-y-4">
                {currentAnswer.versions.map((version, index) => (
                  <div key={index} className="border-l-2 border-gray-600 pl-4 ml-2 space-y-2">
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="font-semibold text-secondary">
                        Versão {version.version}
                      </span>
                      <span>
                        {new Date(version.submittedAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-gray-700 rounded-lg">
                      <p className="text-gray-300 whitespace-pre-wrap">
                        {version.textAnswer}
                      </p>
                    </div>
                    
                    {version.reviewDecision && (
                      <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          {version.reviewDecision === 'FULLY_ACCEPTED' ? (
                            <>
                              <ThumbsUp size={16} className="text-green-400" />
                              <span className="text-green-400 text-sm font-medium">
                                Resposta Aceita
                              </span>
                            </>
                          ) : version.reviewDecision === 'PARTIALLY_ACCEPTED' ? (
                            <>
                              <AlertCircle size={16} className="text-orange-400" />
                              <span className="text-orange-400 text-sm font-medium">
                                Parcialmente Aceita
                              </span>
                            </>
                          ) : (
                            <>
                              <ThumbsDown size={16} className="text-red-400" />
                              <span className="text-red-400 text-sm font-medium">
                                Precisa Revisão
                              </span>
                            </>
                          )}
                          {version.reviewedAt && (
                            <span className="text-gray-500 text-xs ml-auto">
                              Revisado em {new Date(version.reviewedAt).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                        {version.teacherComment && (
                          <p className="text-gray-300 text-sm">
                            <span className="font-medium text-gray-400">Feedback do professor:</span> {version.teacherComment}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : currentAnswer?.textAnswer ? (
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
                      {currentAnswer?.isCorrect === true ? (
                        <>
                          <ThumbsUp size={16} className="text-green-400" />
                          <span className="text-green-400">Resposta totalmente aceita</span>
                        </>
                      ) : currentAnswer?.isCorrect === false ? (
                        <>
                          <ThumbsDown size={16} className="text-red-400" />
                          <span className="text-red-400">Resposta precisa de revisão</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-orange-400" />
                          <span className="text-orange-400">Resposta parcialmente aceita</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setCurrentReview({ reviewState: 'FULLY_ACCEPTED', teacherComment: '' })}
                      className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        currentReview.reviewState === 'FULLY_ACCEPTED'
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500'
                      }`}
                    >
                      <ThumbsUp size={20} />
                      <span className="font-medium">Totalmente Aceita</span>
                      <span className="text-xs text-center">A resposta está completa e correta</span>
                    </button>
                    
                    <button
                      onClick={() => setCurrentReview(prev => ({ ...prev, reviewState: 'PARTIALLY_ACCEPTED' }))}
                      className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        currentReview.reviewState === 'PARTIALLY_ACCEPTED'
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-orange-500'
                      }`}
                    >
                      <AlertCircle size={20} />
                      <span className="font-medium">Parcialmente Aceita</span>
                      <span className="text-xs text-center">Resposta correta mas incompleta</span>
                    </button>
                    
                    <button
                      onClick={() => setCurrentReview(prev => ({ ...prev, reviewState: 'NEEDS_REVISION' }))}
                      className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        currentReview.reviewState === 'NEEDS_REVISION'
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-red-500'
                      }`}
                    >
                      <ThumbsDown size={20} />
                      <span className="font-medium">Precisa Revisão</span>
                      <span className="text-xs text-center">Resposta incorreta ou inadequada</span>
                    </button>
                  </div>
                </div>

                {/* Teacher Comment - Only show for PARTIALLY_ACCEPTED and NEEDS_REVISION */}
                {currentReview.reviewState !== 'FULLY_ACCEPTED' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Comentário do Tutor {(currentReview.reviewState === 'NEEDS_REVISION' || currentReview.reviewState === 'PARTIALLY_ACCEPTED') && <span className="text-red-400">*</span>}
                    </label>
                    <textarea
                      value={currentReview.teacherComment}
                      onChange={(e) => setCurrentReview(prev => ({ ...prev, teacherComment: e.target.value }))}
                      placeholder={
                        currentReview.reviewState === 'PARTIALLY_ACCEPTED' 
                          ? "Adicione informações complementares para completar a resposta..." 
                          : currentReview.reviewState === 'NEEDS_REVISION' 
                          ? "Explique o que precisa ser corrigido na resposta..."
                          : "Selecione uma avaliação acima para comentar..."
                      }
                      className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-secondary focus:outline-none resize-none"
                    />
                    {currentReview.reviewState === 'NEEDS_REVISION' && !currentReview.teacherComment.trim() && (
                      <p className="text-sm text-red-400 mt-1">
                        Comentário obrigatório quando a resposta precisa de revisão.
                      </p>
                    )}
                    {currentReview.reviewState === 'PARTIALLY_ACCEPTED' && !currentReview.teacherComment.trim() && (
                      <p className="text-sm text-orange-400 mt-1">
                        Comentário obrigatório para adicionar informações complementares.
                      </p>
                    )}
                    {currentReview.reviewState === null && (
                      <p className="text-sm text-yellow-400 mt-1">
                        Selecione uma opção de avaliação antes de enviar a revisão.
                      </p>
                    )}
                  </div>
                )}
                
                {/* Success message for FULLY_ACCEPTED */}
                {currentReview.reviewState === 'FULLY_ACCEPTED' && (
                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-400" />
                      <p className="text-green-400">
                        A resposta será marcada como totalmente aceita.
                      </p>
                    </div>
                  </div>
                )}
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