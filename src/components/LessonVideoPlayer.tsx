'use client';

import { useCallback, useEffect } from 'react';
import PandaVideoPlayer from './PandaVideoPlayer';
import { VideoProgress } from '@/types/panda-player';
import { useVideoProgress } from '@/hooks/useVideoProgress';

interface LessonVideoPlayerProps {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  playerUrl?: string;
  lessonId: string;
  courseId?: string;
  moduleId?: string;
}

export default function LessonVideoPlayer({
  videoId,
  title,
  thumbnailUrl,
  playerUrl,
  lessonId,
  courseId,
  moduleId,
}: LessonVideoPlayerProps) {
  // Initialize video progress hook
  const { progress, updateProgress, clearProgress, isLoading } = useVideoProgress(lessonId);

  // Log when component mounts
  useEffect(() => {
    console.log('[LessonVideoPlayer] 🎬 Component mounted:', {
      lessonId,
      videoId,
      hasExistingProgress: !!progress,
      existingTime: progress?.currentTime || 0,
      existingPercentage: progress?.percentage || 0
    });
  }, [lessonId, videoId, progress]);

  const handleProgress = useCallback(async (newProgress: VideoProgress) => {
    console.log('[LessonVideoPlayer] 📹 Video progress event:', {
      lessonId,
      courseId,
      moduleId,
      currentTime: newProgress.currentTime,
      percentage: `${newProgress.percentage.toFixed(2)}%`,
      duration: newProgress.duration
    });

    // Update progress using the hook
    updateProgress(newProgress);

    // Future implementation:
    // - Send to backend API endpoint when online
    // - Track engagement metrics
  }, [lessonId, courseId, moduleId, updateProgress]);

  const handleComplete = useCallback(async () => {
    console.log('[LessonVideoPlayer] ✅ Video completed:', {
      lessonId,
      courseId,
      moduleId,
      finalProgress: progress?.percentage || 0
    });

    // Future implementation:
    // - Send completion status to backend
    // - Update UI to show lesson as completed
    // - Trigger next lesson recommendation
  }, [lessonId, courseId, moduleId, progress]);

  const handlePlay = useCallback(() => {
    console.log('[LessonVideoPlayer] ▶️ Video started:', {
      lessonId,
      startingFrom: progress?.currentTime || 0,
      isResuming: !!progress && progress.currentTime > 0
    });
  }, [lessonId, progress]);

  const handlePause = useCallback(() => {
    console.log('[LessonVideoPlayer] ⏸️ Video paused:', {
      lessonId,
      pausedAt: progress?.currentTime || 0,
      percentageWatched: progress?.percentage || 0
    });
  }, [lessonId, progress]);

  // Log loading state
  if (isLoading) {
    console.log('[LessonVideoPlayer] ⏳ Loading saved progress...');
  }

  return (
    <PandaVideoPlayer
      videoId={videoId}
      playerUrl={playerUrl}
      title={title}
      thumbnailUrl={thumbnailUrl}
      lessonId={lessonId}
      onProgress={handleProgress}
      onComplete={handleComplete}
      onPlay={handlePlay}
      onPause={handlePause}
      saveProgress={false} // Disable Panda's own progress saving to avoid conflicts
      smartAutoplay={true}
      startTime={0} // Don't use our saved progress for now - let Panda handle it
    />
  );
}