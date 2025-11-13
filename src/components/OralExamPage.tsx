// /src/components/OralExamPage.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  Volume2,
} from 'lucide-react';
import { useAuth } from '@/stores/auth.store';

interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA' | 'ORAL_EXAM';
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

interface OralExamPageProps {
  assessment: Assessment;
  questions: Question[];
  backUrl: string;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'preview';

export default function OralExamPage({
  assessment,
  questions,
  backUrl,
}: OralExamPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { token, user, isAuthenticated } = useAuth();
  const t = useTranslations('OralExam');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Audio recording states
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Track submitted answers
  const [submittedAnswers, setSubmittedAnswers] = useState<Set<string>>(new Set());

  const currentQuestion = questions[currentQuestionIndex];

  // Start or resume attempt
  const startAttempt = useCallback(async () => {
    if (!token || !isAuthenticated || !user) {
      console.error('No token, not authenticated, or no user available');
      setLoading(false);
      return;
    }

    const identityId = user?.id;
    if (!identityId) {
      console.error('No user ID available');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Starting attempt for assessment:', assessment.id, 'identityId:', identityId);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            identityId: identityId,
            assessmentId: assessment.id,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to start attempt:', response.status, errorText);
        throw new Error(`Failed to start attempt: ${response.status}`);
      }

      const data = await response.json();
      console.log('Attempt started successfully:', data);
      setAttemptId(data.attempt.id);

      // Load existing answers if resuming
      if (data.attempt.status === 'IN_PROGRESS' && !data.isNew) {
        // TODO: Load existing audio answers
        console.log('Resuming existing attempt');
      }
    } catch (error) {
      console.error('Error starting attempt:', error);
      toast({
        title: t('error.startTitle'),
        description: t('error.startDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [assessment.id, token, isAuthenticated, user, toast, t]);

  useEffect(() => {
    startAttempt();
  }, [startAttempt]);

  // Timer for recording
  useEffect(() => {
    if (recordingState === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordingState]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState('preview');

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingTime(0);

      toast({
        title: t('recording.started'),
        description: t('recording.startedDescription'),
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: t('error.microphoneTitle'),
        description: t('error.microphoneDescription'),
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  };

  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const submitAnswer = async () => {
    if (!audioBlob || !attemptId) return;

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (audioBlob.size > maxSize) {
      toast({
        title: t('error.fileTooLargeTitle'),
        description: t('error.fileTooLargeDescription'),
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('questionId', currentQuestion.id);
    formData.append('audioFile', audioBlob, 'answer.webm');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/${attemptId}/answers`,
        {
          method: 'POST',
          headers: {
            Cookie: `token=${token}`,
          },
          credentials: 'include',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit answer');
      }

      await response.json();

      toast({
        title: t('success.answerSubmitted'),
        description: t('success.answerSubmittedDescription'),
      });

      // Mark as submitted
      setSubmittedAnswers(prev => new Set(prev).add(currentQuestion.id));

      // Clear recording
      discardRecording();

      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: t('error.submitTitle'),
        description: t('error.submitDescription'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const submitExam = async () => {
    if (!attemptId) return;

    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/${attemptId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `token=${token}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit exam');
      }

      toast({
        title: t('success.examSubmitted'),
        description: t('success.examSubmittedDescription'),
      });

      router.push(backUrl);
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast({
        title: t('error.submitExamTitle'),
        description: t('error.submitExamDescription'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-primary">
        <Loader2 size={48} className="animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-primary min-h-screen p-6">
      <div className="max-w-4xl mx-auto w-full">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>
              {t('question')} {currentQuestionIndex + 1} {t('of')} {questions.length}
            </span>
            <span>
              {submittedAnswers.size} {t('answered')}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-6 border border-secondary/20 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Mic size={24} className="text-orange-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">
                {currentQuestion.text}
              </h2>
              {currentQuestion.argumentName && (
                <p className="text-sm text-gray-400">
                  {t('argument')}: {currentQuestion.argumentName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Audio Recorder */}
        <div className="bg-primary-dark/50 backdrop-blur-sm rounded-xl p-8 border border-secondary/20 mb-6">
          {recordingState === 'idle' && (
            <div className="text-center">
              <div className="inline-flex p-6 bg-orange-500/10 rounded-full mb-6">
                <Mic size={64} className="text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t('recorder.readyToRecord')}
              </h3>
              <p className="text-gray-400 mb-6">
                {t('recorder.clickToStart')}
              </p>
              <button
                onClick={startRecording}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-3"
              >
                <Mic size={20} />
                {t('recorder.startRecording')}
              </button>
            </div>
          )}

          {(recordingState === 'recording' || recordingState === 'paused') && (
            <div className="text-center">
              <div className={`inline-flex p-6 rounded-full mb-6 ${
                recordingState === 'recording' ? 'bg-red-500/20 animate-pulse' : 'bg-orange-500/10'
              }`}>
                <Mic size={64} className={recordingState === 'recording' ? 'text-red-500' : 'text-orange-400'} />
              </div>
              <div className="text-4xl font-mono font-bold text-white mb-6">
                {formatTime(recordingTime)}
              </div>
              {recordingState === 'recording' && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="w-2 h-8 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-12 bg-red-500 rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                  <div className="w-2 h-10 bg-red-500 rounded animate-pulse" style={{ animationDelay: '450ms' }} />
                  <div className="w-2 h-7 bg-red-500 rounded animate-pulse" style={{ animationDelay: '600ms' }} />
                </div>
              )}
              <div className="flex gap-3 justify-center">
                {recordingState === 'recording' && (
                  <button
                    onClick={pauseRecording}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <Pause size={20} />
                    {t('recorder.pause')}
                  </button>
                )}
                {recordingState === 'paused' && (
                  <button
                    onClick={resumeRecording}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2"
                  >
                    <Mic size={20} />
                    {t('recorder.resume')}
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2"
                >
                  <Square size={20} />
                  {t('recorder.stop')}
                </button>
              </div>
            </div>
          )}

          {recordingState === 'preview' && audioUrl && (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex p-6 bg-green-500/10 rounded-full mb-4">
                  <CheckCircle size={64} className="text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t('recorder.recordingComplete')}
                </h3>
                <p className="text-gray-400">
                  {t('recorder.reviewBeforeSending')}
                </p>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayback}
                    className="p-3 bg-orange-500 hover:bg-orange-600 rounded-full transition-colors"
                  >
                    {isPlaying ? (
                      <Pause size={24} className="text-white" />
                    ) : (
                      <Play size={24} className="text-white" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Volume2 size={16} />
                      <span>{formatTime(recordingTime)}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full w-0" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={discardRecording}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2"
                >
                  <Trash2 size={20} />
                  {t('recorder.discard')}
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={uploading}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {t('recorder.uploading')}
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      {t('recorder.sendAnswer')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {submittedAnswers.has(currentQuestion.id) && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle size={20} />
              <span className="font-semibold">{t('status.answerSubmitted')}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
            {t('navigation.previous')}
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={submitExam}
              disabled={submitting || submittedAnswers.size < questions.length}
              className="px-8 py-3 bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t('navigation.submitting')}
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {t('navigation.submitExam')}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2"
            >
              {t('navigation.next')}
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
