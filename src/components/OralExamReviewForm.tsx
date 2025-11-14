// src/components/OralExamReviewForm.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Send, Loader2, Volume2 } from 'lucide-react';
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

      const formData = new FormData();
      formData.append('reviewerId', reviewerId);
      formData.append('isCorrect', String(isCorrect));
      formData.append('reviewDecision', reviewDecision);
      formData.append('teacherAudioFile', teacherAudioBlob, 'teacher-feedback.mp3');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/answers/${attemptAnswerId}/review`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Do NOT set Content-Type for FormData - browser will set it automatically
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to submit review: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log('[OralExamReviewForm] Review submitted:', result.attemptAnswer);

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
      <div className="space-y-3 p-4 bg-primary-dark rounded-lg border border-secondary/20">
        <Label className="text-white font-semibold">{t('reviewDecision')}</Label>
        <RadioGroup
          value={reviewDecision}
          onValueChange={(value) => setReviewDecision(value as ReviewDecision)}
          disabled={isSubmitting}
        >
          <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-primary/40 transition-colors">
            <RadioGroupItem value="FULLY_ACCEPTED" id="fully-accepted" />
            <Label htmlFor="fully-accepted" className="flex-1 cursor-pointer">
              <div className="font-medium text-white">{t('fullyAccepted')}</div>
              <div className="text-xs text-gray-400">{t('fullyAcceptedDesc')}</div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-primary/40 transition-colors">
            <RadioGroupItem value="PARTIALLY_ACCEPTED" id="partially-accepted" />
            <Label htmlFor="partially-accepted" className="flex-1 cursor-pointer">
              <div className="font-medium text-white">{t('partiallyAccepted')}</div>
              <div className="text-xs text-gray-400">{t('partiallyAcceptedDesc')}</div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-primary/40 transition-colors">
            <RadioGroupItem value="NEEDS_REVISION" id="needs-revision" />
            <Label htmlFor="needs-revision" className="flex-1 cursor-pointer">
              <div className="font-medium text-white">{t('needsRevision')}</div>
              <div className="text-xs text-gray-400">{t('needsRevisionDesc')}</div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Is Correct Checkbox */}
      <div className="flex items-center space-x-2 p-4 bg-primary-dark rounded-lg border border-secondary/20">
        <Checkbox
          id="is-correct"
          checked={isCorrect}
          onCheckedChange={(checked) => setIsCorrect(checked === true)}
          disabled={isSubmitting}
        />
        <Label
          htmlFor="is-correct"
          className="flex-1 cursor-pointer"
        >
          <div className="font-medium text-white">{t('markAsCorrect')}</div>
          <div className="text-xs text-gray-400">{t('markAsCorrectDesc')}</div>
        </Label>
      </div>

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
          disabled={!teacherAudioBlob || isSubmitting}
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
