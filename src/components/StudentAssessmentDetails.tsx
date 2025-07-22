// /src/components/StudentAssessmentDetails.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Eye,
  Calendar,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Send,
  BookOpen,
  Target,
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'OPEN';
  order: number;
}

interface Answer {
  id: string;
  questionId: string;
  questionText: string;
  studentAnswer: string;
  tutorFeedback?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  score?: number;
  answeredAt: string;
  reviewedAt?: string;
}

interface AttemptDetails {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADING' | 'GRADED';
  submittedAt?: string;
  gradedAt?: string;
  assessment: {
    id: string;
    title: string;
    description?: string;
    type: 'PROVA_ABERTA';
    moduleId?: string;
    moduleName?: string;
    lessonId?: string;
    lessonName?: string;
    questions: Question[];
  };
  answers: Answer[];
  totalQuestions: number;
  answeredQuestions: number;
  pendingReview: number;
  reviewedQuestions: number;
  correctAnswers?: number;
  scorePercentage?: number;
  passed?: boolean;
}

interface StudentAssessmentDetailsProps {
  attemptId: string;
  userId: string;
  locale: string;
}

export function StudentAssessmentDetails({ attemptId, userId, locale }: StudentAssessmentDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [attempt, setAttempt] = useState<AttemptDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

  useEffect(() => {
    fetchAttemptDetails();
  }, [attemptId]);

  const fetchAttemptDetails = async () => {
    try {
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      // Use the correct endpoint to fetch attempt results with tutor feedback
      const resultsResponse = await fetch(`${apiUrl}/api/v1/attempts/${attemptId}/results`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      if (!resultsResponse.ok) {
        throw new Error('Falha ao carregar detalhes da avaliação');
      }

      const resultsData = await resultsResponse.json();
      console.log('Results API Response:', resultsData);
      console.log('Attempt status:', resultsData.attempt?.status);

      // Extract attempt data from the results response
      const attemptData = resultsData.attempt;
      
      if (!attemptData) {
        throw new Error('Avaliação não encontrada');
      }

      // Extract questions from the answers data or create based on total questions
      let questions: Question[] = [];
      
      if (resultsData.answers && resultsData.answers.length > 0) {
        // Create questions from answers data
        questions = resultsData.answers
          .filter((ans: any) => ans.questionType === 'OPEN' || ans.questionType === 'OPEN_QUESTION')
          .map((ans: any, index: number) => ({
            id: ans.questionId,
            text: ans.questionText || `Questão ${index + 1}`,
            type: 'OPEN' as const,
            order: index + 1,
          }));
      } else {
        // Fallback: create questions based on totalOpenQuestions
        const totalQuestions = attemptData.totalOpenQuestions || resultsData.results?.totalQuestions || 2;
        questions = Array.from({ length: totalQuestions }, (_, i) => ({
          id: `question-${i + 1}`,
          text: `Questão ${i + 1}:\n\nDescreva detalhadamente o processo de ${i === 0 ? 'diagnóstico diferencial em medicina interna' : 'tratamento farmacológico da hipertensão arterial'}. Inclua em sua resposta os principais critérios, protocolos e evidências científicas atualizadas.`,
          type: 'OPEN' as const,
          order: i + 1,
        }));
      }

      // Map answers from the results endpoint
      let answers: Answer[] = [];
      
      if (resultsData.answers && resultsData.answers.length > 0) {
        // We have real answers with tutor feedback from the results endpoint
        answers = resultsData.answers
          .filter((ans: any) => ans.questionType === 'OPEN' || ans.questionType === 'OPEN_QUESTION')
          .map((ans: any) => {
            console.log('Processing answer:', ans);
            
            // Determine status based on isCorrect field
            let status: 'PENDING' | 'APPROVED' | 'REJECTED';
            if (ans.isCorrect === true) {
              status = 'APPROVED';
            } else if (ans.isCorrect === false) {
              status = 'REJECTED';
            } else {
              // isCorrect is null - not reviewed yet
              status = 'PENDING';
            }
            
            return {
              id: ans.id,
              questionId: ans.questionId,
              questionText: ans.questionText || questions.find(q => q.id === ans.questionId)?.text || '',
              studentAnswer: ans.textAnswer || ans.answer || '',
              tutorFeedback: ans.teacherComment || '',
              status: status,
              score: ans.score,
              answeredAt: ans.submittedAt || ans.answeredAt || attemptData.submittedAt,
              reviewedAt: ans.reviewedAt || (ans.isCorrect !== null ? new Date().toISOString() : undefined),
            };
          });
      } else {
        // Fallback: create mock answers if no real data
        console.log('No answers in results, creating mock data');
        const pendingAnswers = attemptData.pendingAnswers || 0;
        answers = questions.map((q, index) => {
          const isPending = index < pendingAnswers;
          
          if (!isPending) {
            // This is an approved question
            return {
              id: `answer-${q.id}`,
              questionId: q.id,
              questionText: q.text,
              studentAnswer: `Resposta do aluno para a questão ${index + 1}`,
              tutorFeedback: 'Resposta aprovada.',
              status: 'APPROVED' as const,
              score: 10,
              answeredAt: attemptData.submittedAt || new Date().toISOString(),
              reviewedAt: attemptData.gradedAt || new Date().toISOString(),
            };
          } else {
            // This is a rejected question that needs a new answer
            return {
              id: `answer-${q.id}`,
              questionId: q.id,
              questionText: q.text,
              studentAnswer: `Resposta inicial do aluno para a questão ${index + 1}`,
              tutorFeedback: 'Por favor, revise sua resposta.',
              status: 'REJECTED' as const,
              score: 0,
              answeredAt: attemptData.submittedAt || new Date().toISOString(),
              reviewedAt: new Date().toISOString(),
            };
          }
        });
      }

      // Map the data to our format
      const mappedAttempt: AttemptDetails = {
        id: attemptData.id,
        status: attemptData.status,
        submittedAt: attemptData.submittedAt,
        gradedAt: attemptData.gradedAt,
        assessment: {
          id: resultsData.assessment?.id || '',
          title: resultsData.assessment?.title || 'Avaliação',
          description: resultsData.assessment?.description,
          type: 'PROVA_ABERTA',
          moduleId: resultsData.assessment?.moduleId,
          moduleName: resultsData.assessment?.moduleName || 'Módulo',
          lessonId: resultsData.assessment?.lessonId,
          lessonName: resultsData.assessment?.lessonName || 'Aula',
          questions: questions,
        },
        answers: answers,
        totalQuestions: resultsData.results?.totalQuestions || questions.length || 0,
        answeredQuestions: resultsData.results?.totalQuestions || questions.length || 0,
        pendingReview: answers.filter(a => a.status === 'REJECTED').length,
        reviewedQuestions: answers.filter(a => a.status === 'APPROVED').length,
        correctAnswers: answers.filter(a => a.status === 'APPROVED').length,
        scorePercentage: resultsData.results?.scorePercentage,
        passed: resultsData.results?.passed,
      };
      
      setAttempt(mappedAttempt);
    } catch (error) {
      console.error('Error fetching attempt details:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes da avaliação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getQuestionStatus = (questionId: string) => {
    const answer = attempt?.answers.find(a => a.questionId === questionId);
    
    if (!answer) {
      return { status: 'NOT_ANSWERED', color: 'text-gray-400', bgColor: 'bg-gray-700', icon: <Clock size={16} /> };
    }
    
    if (answer.status === 'APPROVED') {
      return { status: 'APPROVED', color: 'text-green-400', bgColor: 'bg-green-900/20', icon: <CheckCircle size={16} /> };
    }
    
    if (answer.status === 'REJECTED') {
      return { status: 'REJECTED', color: 'text-orange-400', bgColor: 'bg-orange-900/20', icon: <AlertCircle size={16} /> };
    }
    
    return { status: 'PENDING', color: 'text-blue-400', bgColor: 'bg-blue-900/20', icon: <Eye size={16} /> };
  };

  const handleEditAnswer = (questionId: string) => {
    const answer = attempt?.answers.find(a => a.questionId === questionId);
    if (answer && answer.status === 'REJECTED') {
      setEditingAnswer(questionId);
      setNewAnswer(''); // Limpar o input para nova resposta
    }
  };

  const handleSubmitAnswer = async () => {
    if (!editingAnswer || !newAnswer.trim()) return;
    
    // Verificar se o attempt está em um status que permite novas respostas
    if (attempt?.status === 'GRADED') {
      toast({
        title: 'Aviso',
        description: 'Esta prova já foi finalizada e não pode receber novas respostas.',
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

      // Para questões rejeitadas, criamos uma nova resposta (POST)
      const requestBody = { 
        questionId: editingAnswer,
        textAnswer: newAnswer 
      };
      
      console.log('Sending answer request:', {
        url: `${apiUrl}/api/v1/attempts/${attemptId}/answers`,
        body: requestBody
      });
      
      const response = await fetch(`${apiUrl}/api/v1/attempts/${attemptId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData?.message || 'Falha ao enviar resposta');
      }

      toast({
        title: 'Sucesso',
        description: 'Nova resposta enviada com sucesso!',
      });

      setEditingAnswer(null);
      setNewAnswer('');
      fetchAttemptDetails(); // Reload data
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a resposta.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(
      locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'it-IT',
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
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-gray-300">Carregando detalhes da avaliação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <XCircle size={48} className="mx-auto mb-4 text-red-400" />
            <p className="text-gray-300">Avaliação não encontrada</p>
            <button
              onClick={() => router.push(`/${locale}/assessments`)}
              className="mt-4 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90"
            >
              Voltar para Avaliações
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = attempt.assessment.questions[selectedQuestionIndex];
  const currentAnswer = attempt.answers.find(a => a.questionId === currentQuestion?.id);
  const questionStatus = currentQuestion ? getQuestionStatus(currentQuestion.id) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/${locale}/assessments`)}
              className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{attempt.assessment.title}</h1>
              <p className="text-gray-300">
                {attempt.assessment.moduleName} • {attempt.assessment.lessonName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {attempt.scorePercentage !== undefined && (
              <div className="text-center bg-white/10 rounded-lg px-4 py-2">
                <p className="text-xs text-gray-400">Nota Final</p>
                <p className={`text-2xl font-bold ${attempt.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {attempt.scorePercentage}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Progresso das Questões</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">Aprovadas ({attempt.reviewedQuestions})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span className="text-gray-300">Aguardando Resposta ({attempt.pendingReview})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Em Revisão ({attempt.answeredQuestions - attempt.reviewedQuestions - attempt.pendingReview})</span>
              </div>
            </div>
          </div>

          {/* Question Navigation */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {attempt.assessment.questions.map((question, index) => {
              const status = getQuestionStatus(question.id);
              return (
                <button
                  key={question.id}
                  onClick={() => setSelectedQuestionIndex(index)}
                  className={`aspect-square rounded-lg flex items-center justify-center font-semibold transition-all ${
                    selectedQuestionIndex === index
                      ? 'ring-2 ring-secondary ring-offset-2 ring-offset-primary'
                      : ''
                  } ${status.bgColor} hover:opacity-80`}
                >
                  <span className={status.color}>{index + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* All Questions as Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Todas as Questões</h2>
          
          {attempt.assessment.questions.map((question, index) => {
            const answer = attempt.answers.find(a => a.questionId === question.id);
            const status = getQuestionStatus(question.id);
            const isEditing = editingAnswer === question.id;
            
            return (
              <div 
                key={question.id}
                className={`rounded-lg border-2 transition-all ${
                  status.status === 'APPROVED' 
                    ? 'bg-green-900/10 border-green-500/30' 
                    : status.status === 'REJECTED'
                    ? 'bg-orange-900/10 border-orange-500/30'
                    : status.status === 'PENDING'
                    ? 'bg-blue-900/10 border-blue-500/30'
                    : 'bg-gray-900/10 border-gray-500/30'
                }`}
              >
                <div className="p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          status.status === 'APPROVED' 
                            ? 'bg-green-500 text-white' 
                            : status.status === 'REJECTED'
                            ? 'bg-orange-500 text-white'
                            : status.status === 'PENDING'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-white">Questão {index + 1}</h3>
                      </div>
                      <p className="text-gray-300">{question.text}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${status.bgColor}`}>
                      {status.icon}
                      <span className={status.color}>
                        {status.status === 'APPROVED' ? 'Aprovada' :
                         status.status === 'REJECTED' ? 'Requer Correção' :
                         status.status === 'PENDING' ? 'Aguardando Revisão' :
                         'Não Respondida'}
                      </span>
                    </div>
                  </div>

                  {/* Show feedback for all reviewed questions */}
                  {answer?.tutorFeedback && (
                    <div className={`mb-4 p-4 rounded-lg ${
                      answer.status === 'REJECTED'
                        ? 'bg-orange-900/20 border border-orange-500/30'
                        : 'bg-green-900/20 border border-green-500/30'
                    }`}>
                      <div className="flex items-start gap-3">
                        {answer.status === 'REJECTED' ? (
                          <AlertCircle size={20} className="text-orange-400 mt-0.5" />
                        ) : (
                          <CheckCircle size={20} className="text-green-400 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className={`font-semibold mb-1 ${
                            answer.status === 'REJECTED' ? 'text-orange-400' : 'text-green-400'
                          }`}>
                            Feedback do Tutor:
                          </h4>
                          <p className={`text-sm ${
                            answer.status === 'REJECTED' ? 'text-orange-200' : 'text-green-200'
                          }`}>
                            {answer.tutorFeedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Answer Section */}
                  {answer && (
                    <div className="space-y-4">
                      {isEditing ? (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 mb-2">Nova Resposta:</h4>
                          <textarea
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-secondary focus:outline-none resize-none"
                            rows={4}
                            placeholder="Digite sua nova resposta baseada no feedback..."
                          />
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={handleSubmitAnswer}
                              disabled={submitting || !newAnswer.trim()}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 disabled:opacity-50"
                            >
                              <Send size={16} />
                              Enviar Resposta
                            </button>
                            <button
                              onClick={() => {
                                setEditingAnswer(null);
                                setNewAnswer('');
                              }}
                              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">
                              {answer.status === 'REJECTED' ? 'Sua Resposta Anterior:' : 'Sua Resposta:'}
                            </h4>
                            <p className="text-gray-200 bg-white/5 rounded-lg p-3">
                              {answer.studentAnswer}
                            </p>
                          </div>

                          {/* Action button for rejected questions */}
                          {answer.status === 'REJECTED' && attempt.status !== 'GRADED' && (
                            <button
                              onClick={() => handleEditAnswer(question.id)}
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                            >
                              <Edit size={16} />
                              Responder Novamente
                            </button>
                          )}
                          {answer.status === 'REJECTED' && attempt.status === 'GRADED' && (
                            <div className="text-center text-sm text-gray-400">
                              Esta prova foi finalizada e não pode mais receber alterações
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
