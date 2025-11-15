// src/components/AudioRecorder.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Mic, Square, Play, Pause, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  onClear,
  disabled = false,
}: AudioRecorderProps) {
  const t = useTranslations('OralExamReview');
  const hasNotifiedRef = useRef(false);

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearRecording,
    error,
  } = useAudioRecorder();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleClearRecording = () => {
    clearRecording();
    hasNotifiedRef.current = false;
    onClear?.();
  };

  // When recording stops and we have a blob, notify parent (only once)
  useEffect(() => {
    if (audioBlob && !isRecording && !hasNotifiedRef.current) {
      console.log('[AudioRecorder] Notifying parent of new recording:', {
        size: audioBlob.size,
        type: audioBlob.type,
      });
      onRecordingComplete(audioBlob);
      hasNotifiedRef.current = true;
    }
  }, [audioBlob, isRecording, onRecordingComplete]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={18} className="text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Recording Controls */}
      {!audioBlob && (
        <div className="flex flex-col items-center gap-4 p-6 bg-primary-dark rounded-lg border border-secondary/20">
          {/* Timer */}
          {isRecording && (
            <div className="text-3xl font-mono text-white">
              {formatTime(recordingTime)}
            </div>
          )}

          {/* Recording Status */}
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-sm text-gray-400">
                {isPaused ? t('paused') : t('recording')}
              </span>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={disabled}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Mic size={18} className="mr-2" />
                {t('startRecording')}
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button
                    onClick={resumeRecording}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Play size={18} className="mr-2" />
                    {t('resume')}
                  </Button>
                ) : (
                  <Button
                    onClick={pauseRecording}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <Pause size={18} className="mr-2" />
                    {t('pause')}
                  </Button>
                )}
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                >
                  <Square size={18} className="mr-2" />
                  {t('stop')}
                </Button>
              </>
            )}
          </div>

          {!isRecording && (
            <p className="text-xs text-gray-500 text-center">
              {t('recordingInstructions')}
            </p>
          )}
        </div>
      )}

      {/* Audio Playback */}
      {audioBlob && audioUrl && (
        <div className="space-y-3 p-4 bg-primary-dark rounded-lg border border-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-gray-400">
                {t('recordingComplete')} ({formatTime(recordingTime)})
              </span>
            </div>
            <Button
              onClick={handleClearRecording}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={16} className="mr-2" />
              {t('clear')}
            </Button>
          </div>

          <audio
            src={audioUrl}
            controls
            className="w-full"
            style={{
              backgroundColor: 'transparent',
              borderRadius: '8px',
            }}
          />

          <p className="text-xs text-gray-500">
            {t('reviewRecordingBeforeSubmit')}
          </p>
        </div>
      )}
    </div>
  );
}
