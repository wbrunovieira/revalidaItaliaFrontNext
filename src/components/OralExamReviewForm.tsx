// src/components/OralExamReviewForm.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Volume2, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthToken } from '@/lib/auth-utils';

type ReviewDecision = 'FULLY_ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'NEEDS_REVISION';

interface OralExamReviewFormProps {
  attemptAnswerId: string;
  studentAudioUrl: string;
  reviewerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OralExamReviewForm({
  attemptAnswerId,
  studentAudioUrl,
  reviewerId,
  onSuccess,
  onCancel,
}: OralExamReviewFormProps) {
  const t = useTranslations('OralExamReview');
  const { toast } = useToast();

  const [isCorrect, setIsCorrect] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>('FULLY_ACCEPTED');
  const [teacherAudioBlob, setTeacherAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (!teacherAudioBlob) {
      toast({
        title: t('error'),
        description: t('audioRequired'),
        variant: 'destructive',
      });
      return;
    }

    // Verificar se o blob de áudio tem conteúdo
    if (teacherAudioBlob.size === 0) {
      toast({
        title: t('error'),
        description: 'O arquivo de áudio está vazio. Por favor, grave novamente.',
        variant: 'destructive',
      });
      console.error('[OralExamReviewForm] Audio blob is empty!', {
        size: teacherAudioBlob.size,
        type: teacherAudioBlob.type,
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const token = getAuthToken();
      if (!token) {
        toast({
          title: t('error'),
          description: t('authenticationRequired'),
          variant: 'destructive',
        });
        return;
      }

      // Submit review with audio file using FormData
      const formData = new FormData();
      formData.append('reviewerId', reviewerId);
      formData.append('isCorrect', isCorrect ? 'true' : 'false'); // Backend converte string para boolean
      formData.append('reviewDecision', reviewDecision);

      // Adicionar arquivo de áudio somente se tiver conteúdo
      if (teacherAudioBlob && teacherAudioBlob.size > 0) {
        formData.append('teacherAudioFile', teacherAudioBlob, 'teacher-feedback.webm');
      } else {
        console.error('[OralExamReviewForm] Audio blob is empty! Not sending file.');
      }

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/answers/${attemptAnswerId}/review`;

      console.log('[OralExamReviewForm] Submitting review:');
      console.log('Endpoint:', endpoint);
      console.log('Payload:', {
        reviewerId,
        isCorrect: isCorrect ? 'true' : 'false',
        reviewDecision,
        teacherAudioFile: {
          name: 'teacher-feedback.webm',
          size: teacherAudioBlob.size,
          type: teacherAudioBlob.type,
        },
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do NOT set Content-Type - browser will set it automatically with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('[OralExamReviewForm] Review submission failed:');
        console.error('Status:', response.status, response.statusText);
        console.error('Error data:', errorData);
        throw new Error(
          errorData?.message || `Failed to submit review: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log('[OralExamReviewForm] Review submitted successfully:', result);

      toast({
        title: t('success'),
        description: t('reviewSubmitted'),
      });

      onSuccess?.();
    } catch (error) {
      console.error('[OralExamReviewForm] Error submitting review:', error);
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : t('submitError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student's Audio Answer */}
      <div className="space-y-3 p-4 bg-primary-dark rounded-lg border border-secondary/20">
        <div className="flex items-center gap-2">
          <Volume2 size={18} className="text-secondary" />
          <h3 className="font-semibold text-white">{t('studentAnswer')}</h3>
        </div>
        <audio
          src={studentAudioUrl}
          controls
          className="w-full"
          style={{
            backgroundColor: 'transparent',
            borderRadius: '8px',
          }}
        />
        <p className="text-xs text-gray-500">{t('listenToStudentAnswer')}</p>
      </div>

      {/* Teacher's Audio Feedback Recorder */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">{t('yourFeedback')}</h3>
          <span className="text-xs text-red-500">*</span>
        </div>
        <AudioRecorder
          onRecordingComplete={setTeacherAudioBlob}
          onClear={() => setTeacherAudioBlob(null)}
          disabled={isSubmitting}
        />
      </div>

      {/* Review Decision */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          {t('reviewDecision')}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setReviewDecision('FULLY_ACCEPTED');
              setIsCorrect(true);
            }}
            disabled={isSubmitting}
            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              reviewDecision === 'FULLY_ACCEPTED'
                ? 'border-green-500 bg-green-500/10 text-green-400'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-green-500'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsUp size={20} />
            <span className="font-medium">{t('fullyAccepted')}</span>
            <span className="text-xs text-center">{t('fullyAcceptedDesc')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setReviewDecision('PARTIALLY_ACCEPTED');
              setIsCorrect(true);
            }}
            disabled={isSubmitting}
            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              reviewDecision === 'PARTIALLY_ACCEPTED'
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-orange-500'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <AlertCircle size={20} />
            <span className="font-medium">{t('partiallyAccepted')}</span>
            <span className="text-xs text-center">{t('partiallyAcceptedDesc')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setReviewDecision('NEEDS_REVISION');
              setIsCorrect(false);
            }}
            disabled={isSubmitting}
            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              reviewDecision === 'NEEDS_REVISION'
                ? 'border-red-500 bg-red-500/10 text-red-400'
                : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-red-500'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsDown size={20} />
            <span className="font-medium">{t('needsRevision')}</span>
            <span className="text-xs text-center">{t('needsRevisionDesc')}</span>
          </button>
        </div>
      </div>

      {/* Success message for FULLY_ACCEPTED */}
      {reviewDecision === 'FULLY_ACCEPTED' && (
        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-400" />
            <p className="text-green-400">
              {t('fullyAcceptedMessage')}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isSubmitting}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
        )}
        <Button
          onClick={handleSubmitReview}
          disabled={!teacherAudioBlob || !reviewDecision || isSubmitting}
          className="flex-1 bg-secondary hover:bg-secondary/80"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            <>
              <Send size={18} className="mr-2" />
              {t('submitReview')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
