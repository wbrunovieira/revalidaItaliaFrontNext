'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoProgress } from '@/types/panda-player';
import { X, Play, RotateCcw, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ContinueWatchingBannerProps {
  progress: VideoProgress | null;
  onResume: () => void;
  onRestart: () => void;
  autoResumeDelay?: number;
}

export default function ContinueWatchingBanner({
  progress,
  onResume,
  onRestart,
  autoResumeDelay = 5
}: ContinueWatchingBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [countdown, setCountdown] = useState(autoResumeDelay);
  const [isPaused, setIsPaused] = useState(false);
  const t = useTranslations('Video');

  useEffect(() => {
    // Only show banner if progress is meaningful (> 5% and < 95%)
    if (progress && progress.percentage > 5 && progress.percentage < 95) {
      setIsVisible(true);
      console.log('[ContinueWatchingBanner] 🎬 Showing banner for progress:', {
        currentTime: progress.currentTime,
        percentage: progress.percentage.toFixed(2) + '%'
      });
    } else {
      setIsVisible(false);
    }
  }, [progress]);

  const handleResume = useCallback(() => {
    console.log('[ContinueWatchingBanner] ▶️ User chose to resume');
    setIsVisible(false);
    onResume();
  }, [onResume]);

  useEffect(() => {
    if (!isVisible || isPaused) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          console.log('[ContinueWatchingBanner] ⏰ Auto-resuming video');
          handleResume();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, isPaused, handleResume]);

  const handleRestart = () => {
    console.log('[ContinueWatchingBanner] 🔄 User chose to restart');
    setIsVisible(false);
    onRestart();
  };

  const handleDismiss = () => {
    console.log('[ContinueWatchingBanner] ❌ User dismissed banner');
    setIsVisible(false);
    setIsPaused(true);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible || !progress) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 p-4 animate-slideDown">
      <div className="bg-primary-dark/95 backdrop-blur-md border border-secondary/30 rounded-lg shadow-lg">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/20 rounded-full">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-white font-semibold">
                  {t('continueWatching.title')}
                </h3>
                <p className="text-gray-400 text-sm">
                  {t('continueWatching.watchedProgress', { 
                    percentage: Math.round(progress.percentage)
                  })}
                </p>
                <p className="text-gray-300 text-xs mt-1">
                  {t('continueWatching.resumeFrom', {
                    time: formatTime(progress.currentTime)
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress bar visualization */}
          <div className="mb-4">
            <div className="h-2 bg-primary/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-secondary to-accent-light transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors font-medium"
              >
                <Play size={16} />
                {t('continueWatching.resumeButton')}
              </button>
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2 bg-primary/50 text-white rounded-lg hover:bg-primary/70 transition-colors border border-secondary/30"
              >
                <RotateCcw size={16} />
                {t('continueWatching.restartButton')}
              </button>
            </div>

            {/* Countdown */}
            {!isPaused && countdown > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="relative">
                  <svg className="w-8 h-8 transform -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      opacity="0.2"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray={`${(countdown / autoResumeDelay) * 88} 88`}
                      className="text-secondary transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                    {countdown}
                  </span>
                </div>
                <span>
                  {t('continueWatching.autoResumeIn', { 
                    seconds: countdown
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}