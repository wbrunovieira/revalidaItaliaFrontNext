// src/components/StudentOralExamView.tsx
'use client';

import { Volume2, Mic, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export interface Answer {
  id: string;
  questionId: string;
  questionText: string;
  audioAnswerUrl?: string;
  teacherAudioUrl?: string;
  reviewDecision?: 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'NEEDS_REVISION';
  isCorrect?: boolean;
  status: string;
  submittedAt?: string;
  reviewedAt?: string;
  currentAnswer?: {
    reviewDecision?: 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'NEEDS_REVISION';
    isCorrect?: boolean;
    teacherAudioUrl?: string;
    audioAnswerUrl?: string;
  };
}

interface StudentOralExamViewProps {
  attemptId: string;
  assessmentTitle: string;
  answers: Answer[];
  locale: string;
  backUrl?: string;
}

export function StudentOralExamView({
  attemptId,
  assessmentTitle,
  answers,
  locale,
  backUrl = `/${locale}/assessments/open-exams`,
}: StudentOralExamViewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [newAudioBlob, setNewAudioBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Para ORAL_EXAM, podem ter múltiplas versões da mesma questão
  // O backend retorna todas as versões no array answers
  // Ordenar por data de submissão (mais recente primeiro)
  const sortedAnswers = [...answers].sort((a, b) => {
    const dateA = new Date(a.submittedAt || 0).getTime();
    const dateB = new Date(b.submittedAt || 0).getTime();
    return dateB - dateA; // Mais recente primeiro
  });

  // A primeira versão é sempre a mais recente
  const latestAnswer = sortedAnswers[0];

  // Pegar reviewDecision do currentAnswer se disponível, senão do nível superior
  const reviewDecision = latestAnswer.currentAnswer?.reviewDecision || latestAnswer.reviewDecision;
  const isCorrect = latestAnswer.currentAnswer?.isCorrect ?? latestAnswer.isCorrect;
  const teacherAudioUrl = latestAnswer.currentAnswer?.teacherAudioUrl || latestAnswer.teacherAudioUrl;
  const audioAnswerUrl = latestAnswer.currentAnswer?.audioAnswerUrl || latestAnswer.audioAnswerUrl;

  // Log para debug
  console.log('[StudentOralExamView] Latest answer:', {
    id: latestAnswer.id,
    status: latestAnswer.status,
    reviewDecision,
    hasTeacherAudio: !!teacherAudioUrl,
    isCorrect,
    willShowAcceptButton: reviewDecision === 'PARTIALLY_ACCEPTED'
  });

  const getStatusBadge = () => {
    // Se status é GRADED mas não tem reviewDecision, usar isCorrect para determinar
    if (latestAnswer.status === 'GRADED' && !reviewDecision) {
      const hasTeacherAudio = !!teacherAudioUrl;

      // Cenário 1: Aprovado COM áudio do professor
      if (isCorrect && hasTeacherAudio) {
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Aprovado</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Volume2 size={14} />
              <span className="text-xs">Ouça o feedback do professor abaixo</span>
            </div>
          </div>
        );
      }

      // Cenário 2: Aprovado SEM áudio do professor
      if (isCorrect && !hasTeacherAudio) {
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Aprovado</span>
          </div>
        );
      }

      // Cenário 3: Reprovado COM áudio do professor
      if (!isCorrect && hasTeacherAudio) {
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-orange-400">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Revisar</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Volume2 size={14} />
              <span className="text-xs">Professor respondeu - Ouça o feedback</span>
            </div>
          </div>
        );
      }

      // Cenário 4: Reprovado SEM áudio
      return (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">Precisa Revisão</span>
        </div>
      );
    }

    // Se tem teacherAudioUrl mas não tem reviewDecision, inferir NEEDS_REVISION
    if (teacherAudioUrl && !reviewDecision) {
      return (
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">Precisa Revisão</span>
        </div>
      );
    }

    if (!reviewDecision) {
      return (
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">Aguardando revisão do professor</span>
        </div>
      );
    }

    switch (reviewDecision) {
      case 'FULLY_ACCEPTED':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Totalmente Aceita</span>
          </div>
        );
      case 'PARTIALLY_ACCEPTED':
        return (
          <div className="flex items-center gap-2 text-orange-400">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Parcialmente Aceita</span>
          </div>
        );
      case 'NEEDS_REVISION':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">Precisa Revisão</span>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSubmitNewAnswer = async () => {
    if (!newAudioBlob) {
      toast({
        title: 'Erro',
        description: 'Por favor, grave sua nova resposta em áudio.',
        variant: 'destructive',
      });
      return;
    }

    if (newAudioBlob.size === 0) {
      toast({
        title: 'Erro',
        description: 'O arquivo de áudio está vazio. Por favor, grave novamente.',
        variant: 'destructive',
      });
      return;
    }

    // Verificações do blob de áudio ANTES de enviar
    console.log('[StudentOralExamView] Audio blob verification:');
    console.log('- Blob exists:', !!newAudioBlob);
    console.log('- Blob size:', newAudioBlob.size);
    console.log('- Blob type:', newAudioBlob.type);
    console.log('- Blob instanceof Blob:', newAudioBlob instanceof Blob);

    // Validar tipo de arquivo
    const validAudioTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/ogg', 'audio/mpeg'];
    if (!validAudioTypes.includes(newAudioBlob.type)) {
      console.warn('[StudentOralExamView] Audio blob type may be invalid:', newAudioBlob.type);
    }

    try {
      setSubmitting(true);

      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado.',
          variant: 'destructive',
        });
        return;
      }

      // Create FormData to upload audio file
      const formData = new FormData();
      formData.append('questionId', latestAnswer.questionId); // OBRIGATÓRIO!
      formData.append('audioFile', newAudioBlob, 'answer.webm'); // Nome DEVE ser 'audioFile'

      console.log('[StudentOralExamView] Submitting new answer:', {
        answerId: latestAnswer.id,
        questionId: latestAnswer.questionId,
        attemptId,
        audioSize: newAudioBlob.size,
        audioType: newAudioBlob.type,
      });

      // Debug FormData contents
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // Submit new version of the answer
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/${attemptId}/answers`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[StudentOralExamView] Failed to submit new answer:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        throw new Error(
          errorData?.message || `Falha ao enviar nova resposta: ${response.status}`
        );
      }

      const result = await response.json();
      console.log('[StudentOralExamView] New answer submitted successfully:', result);

      toast({
        title: 'Áudio Gravado!',
        description: 'Sua resposta foi salva e enviada para revisão do professor.',
      });

      // Refresh page to show new data
      window.location.reload();

    } catch (error) {
      console.error('Error submitting new answer:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao enviar nova resposta',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptPartialReview = async () => {
    try {
      setAccepting(true);

      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar autenticado.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/answers/${latestAnswer.id}/accept-partial-review`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        let errorMessage = 'Falha ao aceitar resposta';

        if (errorData?.error) {
          switch (errorData.error) {
            case 'ANSWER_NOT_REVIEWABLE':
              errorMessage = 'Esta resposta não pode ser aceita ou já foi aceita anteriormente';
              break;
            case 'INSUFFICIENT_PERMISSIONS':
              errorMessage = 'Você só pode aceitar suas próprias revisões';
              break;
            case 'ATTEMPT_ANSWER_NOT_FOUND':
              errorMessage = 'Resposta não encontrada';
              break;
            default:
              errorMessage = errorData.message || errorMessage;
          }
        }

        throw new Error(errorMessage);
      }

      toast({
        title: 'Sucesso!',
        description: 'Resposta aceita com sucesso!',
      });

      // Redirect back to assessments page
      router.push(backUrl);

    } catch (error) {
      console.error('Error accepting partial review:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao aceitar resposta',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-primary p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(backUrl)}
            className="flex items-center gap-2 text-white hover:text-secondary mb-4"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">{assessmentTitle}</h1>
          <div className="flex items-center gap-4">
            {getStatusBadge()}
          </div>
        </div>

        {/* Question */}
        <div className="bg-primary-dark rounded-lg p-6 mb-6 border border-secondary/20">
          <h2 className="text-xl font-semibold text-white mb-4">{latestAnswer.questionText}</h2>
        </div>

        {/* Se PARTIALLY_ACCEPTED, mostrar APENAS a última resposta com botão de aceitar */}
        {reviewDecision === 'PARTIALLY_ACCEPTED' ? (
          <div className="space-y-6 mb-6">
            {/* Mostrar apenas a última resposta */}
            <div className="bg-primary-dark rounded-lg p-6 border border-secondary">
              {/* Header da versão */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-secondary">
                    📍 Sua Resposta
                  </span>
                  {latestAnswer.submittedAt && (
                    <span className="text-xs text-gray-500">
                      {formatDate(latestAnswer.submittedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Áudio do Aluno */}
              {audioAnswerUrl && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic size={16} className="text-blue-400" />
                    <h4 className="text-sm font-medium text-blue-400">Sua Resposta</h4>
                  </div>
                  <audio
                    src={audioAnswerUrl}
                    controls
                    className="w-full"
                    style={{
                      backgroundColor: 'transparent',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              )}

              {/* Áudio do Professor */}
              {teacherAudioUrl && (
                <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 size={16} className="text-green-400" />
                    <h4 className="text-sm font-medium text-green-400">Feedback do Professor</h4>
                    {latestAnswer.reviewedAt && (
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatDate(latestAnswer.reviewedAt)}
                      </span>
                    )}
                  </div>
                  <audio
                    src={teacherAudioUrl}
                    controls
                    className="w-full"
                    style={{
                      backgroundColor: 'transparent',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Timeline de todas as versões (mais recente primeiro) - Para NEEDS_REVISION */
          <div className="space-y-6 mb-6">
            {sortedAnswers.map((answer, index) => {
              const isLatest = index === 0;

              return (
                <div
                  key={answer.id}
                  className={`bg-primary-dark rounded-lg p-6 border ${
                    isLatest ? 'border-secondary' : 'border-secondary/20'
                  }`}
                >
                  {/* Header da versão */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${
                        isLatest ? 'text-secondary' : 'text-gray-400'
                      }`}>
                        {isLatest ? '📍 Última Resposta' : 'Resposta Anterior'}
                      </span>
                      {answer.submittedAt && (
                        <span className="text-xs text-gray-500">
                          {formatDate(answer.submittedAt)}
                        </span>
                      )}
                    </div>

                    {/* Status badge apenas para a última resposta */}
                    {isLatest && getStatusBadge()}
                  </div>

                  {/* Áudio do Aluno */}
                  {answer.audioAnswerUrl && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic size={16} className="text-blue-400" />
                        <h4 className="text-sm font-medium text-blue-400">Sua Resposta</h4>
                      </div>
                      <audio
                        src={answer.audioAnswerUrl}
                        controls
                        className="w-full"
                        style={{
                          backgroundColor: 'transparent',
                          borderRadius: '8px',
                        }}
                      />
                    </div>
                  )}

                  {/* Áudio do Professor (se tiver feedback) */}
                  {answer.teacherAudioUrl && (
                    <div className="bg-green-900/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Volume2 size={16} className="text-green-400" />
                        <h4 className="text-sm font-medium text-green-400">Feedback do Professor</h4>
                        {answer.reviewedAt && (
                          <span className="text-xs text-gray-500 ml-auto">
                            {formatDate(answer.reviewedAt)}
                          </span>
                        )}
                      </div>
                      <audio
                        src={answer.teacherAudioUrl}
                        controls
                        className="w-full"
                        style={{
                          backgroundColor: 'transparent',
                          borderRadius: '8px',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Resubmit Section - Show ONLY for NEEDS_REVISION (not PARTIALLY_ACCEPTED) */}
        {teacherAudioUrl && reviewDecision === 'NEEDS_REVISION' && (
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Reenviar Nova Resposta
            </h3>
            <p className="text-gray-300 mb-4">
              O professor solicitou que você revise sua resposta. Grave um novo áudio com as correções necessárias.
            </p>

            <div className="mb-4">
              <AudioRecorder
                onRecordingComplete={setNewAudioBlob}
                onClear={() => setNewAudioBlob(null)}
                disabled={submitting}
              />
            </div>

            <Button
              onClick={handleSubmitNewAnswer}
              disabled={!newAudioBlob || submitting}
              className="w-full bg-secondary hover:bg-secondary/80"
            >
              {submitting ? 'Enviando...' : 'Enviar Nova Resposta'}
            </Button>
          </div>
        )}

        {/* Action buttons for PARTIALLY_ACCEPTED */}
        {reviewDecision === 'PARTIALLY_ACCEPTED' && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Resposta Parcialmente Aceita</h3>
            </div>
            <p className="text-gray-300 mb-6">
              O professor aceitou parcialmente sua resposta. Ouça o feedback acima e clique em "Aceitar Resposta" para confirmar.
            </p>
            <Button
              onClick={handleAcceptPartialReview}
              disabled={accepting}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {accepting ? 'Aceitando...' : 'Aceitar Resposta'}
            </Button>
          </div>
        )}

        {/* Info if FULLY_ACCEPTED */}
        {reviewDecision === 'FULLY_ACCEPTED' && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={20} className="text-green-400" />
              <h3 className="text-lg font-semibold text-white">Resposta Totalmente Aceita!</h3>
            </div>
            <p className="text-gray-300">
              Parabéns! O professor aceitou totalmente sua resposta.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
