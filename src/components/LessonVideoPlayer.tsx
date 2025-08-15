'use client';

import { useCallback, useEffect, useState } from 'react';
import PandaVideoPlayer from './PandaVideoPlayer';
import ContinueWatchingBanner from './ContinueWatchingBanner';
import { VideoProgress } from '@/types/panda-player';
import { useVideoProgress } from '@/hooks/useVideoProgress';

// Load heartbeat test utility in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  import('@/utils/heartbeat-test');
}

interface LessonVideoPlayerProps {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  playerUrl?: string;
  lessonId: string;
  courseId?: string;
  moduleId?: string;
  // Additional context for Continue Learning
  lessonTitle?: string;
  courseTitle?: string;
  courseSlug?: string;
  moduleTitle?: string;
  moduleSlug?: string;
  lessonImageUrl?: string;
}

export default function LessonVideoPlayer({
  videoId,
  title,
  thumbnailUrl,
  playerUrl,
  lessonId,
  courseId,
  moduleId,
  lessonTitle,
  courseTitle,
  courseSlug,
  moduleTitle,
  moduleSlug,
  lessonImageUrl,
}: LessonVideoPlayerProps) {
  // Initialize video progress hook with course and module context
  const { progress, updateProgress, clearProgress, isLoading } = useVideoProgress(
    lessonId,
    courseId,
    moduleId
  );
  
  // Initialize heartbeat service directly here
  useEffect(() => {
    if (typeof window !== 'undefined' && courseTitle && moduleTitle) {
      // Get or create heartbeat service
      // Dynamic import to avoid require
      import('@/services/video-progress-heartbeat').then(({ getHeartbeatService }) => {
        const heartbeat = getHeartbeatService();
        (window as unknown as Record<string, unknown>).videoProgressHeartbeat = heartbeat;
        console.log('[LessonVideoPlayer] 🎯 Heartbeat service initialized and exposed');
      });
    }
  }, [courseTitle, moduleTitle]);
  
  // State for managing start time
  const [startTime, setStartTime] = useState<number>(0);
  const [showBanner, setShowBanner] = useState<boolean>(true);

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

    // Send to heartbeat service with full context for new API
    const heartbeatService = (window as unknown as Record<string, unknown>).videoProgressHeartbeat as { 
      enqueueWithContext?: (
        lessonId: string,
        progress: VideoProgress,
        context: {
          courseId?: string;
          moduleId?: string;
          lessonTitle?: string;
          courseTitle?: string;
          courseSlug?: string;
          moduleTitle?: string;
          moduleSlug?: string;
          lessonImageUrl?: string;
        }
      ) => void 
    } | undefined;
    
    if (!heartbeatService) {
      console.warn('[LessonVideoPlayer] ⚠️ Heartbeat service not available on window');
    } else if (!heartbeatService.enqueueWithContext) {
      console.warn('[LessonVideoPlayer] ⚠️ enqueueWithContext method not available');
    } else {
      const imageUrl = lessonImageUrl || thumbnailUrl || '';
      console.log('[LessonVideoPlayer] 📤 Sending to heartbeat service:', {
        lessonId,
        lessonTitle: lessonTitle || title,
        courseTitle,
        percentage: newProgress.percentage.toFixed(2) + '%'
      });
      
      // Call with correct parameters order: lessonId, progress, context
      heartbeatService.enqueueWithContext(
        lessonId,
        newProgress,
        {
          courseId,
          moduleId,
          lessonTitle: lessonTitle || title,
          courseTitle,
          courseSlug,
          moduleTitle,
          moduleSlug,
          lessonImageUrl: imageUrl
        }
      );
    }
  }, [lessonId, courseId, moduleId, updateProgress, lessonTitle, title, courseTitle, courseSlug, moduleTitle, moduleSlug, lessonImageUrl, thumbnailUrl]);

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

  const handleResume = useCallback(() => {
    // Use setTimeout to avoid setState during render
    setTimeout(() => {
      console.log('[LessonVideoPlayer] ▶️ Resuming from saved position:', progress?.currentTime);
      setStartTime(progress?.currentTime || 0);
      setShowBanner(false);
    }, 0);
  }, [progress]);

  const handleRestart = useCallback(() => {
    // Use setTimeout to avoid setState during render
    setTimeout(() => {
      console.log('[LessonVideoPlayer] 🔄 Restarting from beginning');
      setStartTime(0);
      setShowBanner(false);
      // Clear the saved progress
      clearProgress();
    }, 0);
  }, [clearProgress]);

  // Log loading state
  if (isLoading) {
    console.log('[LessonVideoPlayer] ⏳ Loading saved progress...');
  }

  return (
    <div className="relative w-full h-full">
      {/* Continue Watching Banner */}
      {showBanner && !isLoading && (
        <ContinueWatchingBanner
          progress={progress}
          onResume={handleResume}
          onRestart={handleRestart}
          autoResumeDelay={5}
        />
      )}
      
      {/* Video Player */}
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
        saveProgress={true} // Enable Panda's saveProgress for dual tracking
        smartAutoplay={true}
        startTime={startTime} // Use our managed start time
      />
    </div>
  );
}