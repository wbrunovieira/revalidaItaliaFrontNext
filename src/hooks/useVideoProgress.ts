'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoProgress } from '@/types/panda-player';
import { getHeartbeatService } from '@/services/video-progress-heartbeat';

const STORAGE_PREFIX = 'revalida_video_progress_';
const DEBOUNCE_DELAY = 5000; // 5 seconds
const LOG_PREFIX = '[useVideoProgress]';

interface UseVideoProgressReturn {
  progress: VideoProgress | null;
  updateProgress: (newProgress: VideoProgress) => void;
  clearProgress: () => void;
  isLoading: boolean;
}

export function useVideoProgress(
  lessonId: string,
  courseId?: string,
  moduleId?: string
): UseVideoProgressReturn {
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedProgressRef = useRef<string>('');
  const heartbeatService = useRef(getHeartbeatService());

  // Storage key for this specific lesson
  const storageKey = `${STORAGE_PREFIX}${lessonId}`;

  // Load progress from localStorage on mount
  useEffect(() => {
    console.log(`${LOG_PREFIX} 🚀 Initializing for lesson:`, lessonId);
    
    try {
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsedProgress = JSON.parse(savedData) as VideoProgress;
        console.log(`${LOG_PREFIX} 📥 Loaded saved progress:`, {
          lessonId,
          currentTime: parsedProgress.currentTime,
          percentage: `${parsedProgress.percentage.toFixed(2)}%`,
          duration: parsedProgress.duration,
          watchedSegments: parsedProgress.watchedSegments?.length || 0,
          completionRate: parsedProgress.completionRate
        });
        
        setProgress(parsedProgress);
        lastSavedProgressRef.current = savedData;
      } else {
        console.log(`${LOG_PREFIX} 📭 No saved progress found for lesson:`, lessonId);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error loading progress:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, storageKey]);

  // Save progress to localStorage with debouncing
  const saveProgress = useCallback((progressToSave: VideoProgress) => {
    try {
      const dataToSave = JSON.stringify(progressToSave);
      
      // Only save if data has changed
      if (dataToSave !== lastSavedProgressRef.current) {
        localStorage.setItem(storageKey, dataToSave);
        lastSavedProgressRef.current = dataToSave;
        
        console.log(`${LOG_PREFIX} 💾 Progress saved:`, {
          lessonId,
          currentTime: progressToSave.currentTime,
          percentage: `${progressToSave.percentage.toFixed(2)}%`,
          duration: progressToSave.duration,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`${LOG_PREFIX} ⏭️ Skipping save (no changes)`);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error saving progress:`, error);
    }
  }, [lessonId, storageKey]);

  // Update progress with debouncing
  const updateProgress = useCallback((newProgress: VideoProgress) => {
    console.log(`${LOG_PREFIX} 📊 Progress update received:`, {
      lessonId,
      currentTime: newProgress.currentTime,
      percentage: `${newProgress.percentage.toFixed(2)}%`,
      duration: newProgress.duration,
      isComplete: newProgress.percentage >= 90
    });

    // Update state immediately for UI responsiveness
    setProgress(newProgress);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      console.log(`${LOG_PREFIX} ⏱️ Debounce timer fired, saving progress...`);
      saveProgress(newProgress);
      
      // Send to heartbeat service for backend sync
      console.log(`${LOG_PREFIX} 💓 Sending to heartbeat service`);
      heartbeatService.current.enqueue(lessonId, newProgress, courseId, moduleId);
      
      // Check if video is effectively completed (95% or more)
      if (newProgress.percentage >= 95 && (!progress || progress.percentage < 95)) {
        console.log(`${LOG_PREFIX} 🎉 Video completed! (${newProgress.percentage.toFixed(2)}% watched)`);
      }
    }, DEBOUNCE_DELAY);
  }, [lessonId, courseId, moduleId, saveProgress, progress]);

  // Clear progress for this lesson
  const clearProgress = useCallback(() => {
    console.log(`${LOG_PREFIX} 🗑️ Clearing progress for lesson:`, lessonId);
    
    try {
      localStorage.removeItem(storageKey);
      setProgress(null);
      lastSavedProgressRef.current = '';
      
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      console.log(`${LOG_PREFIX} ✅ Progress cleared successfully`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error clearing progress:`, error);
    }
  }, [lessonId, storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Save any pending progress before unmounting
      if (debounceTimerRef.current) {
        console.log(`${LOG_PREFIX} 🔄 Component unmounting, forcing save...`);
        clearTimeout(debounceTimerRef.current);
        
        if (progress) {
          saveProgress(progress);
          // Also flush heartbeat queue
          console.log(`${LOG_PREFIX} 💓 Forcing heartbeat flush before unmount`);
          heartbeatService.current.flush();
        }
      }
    };
  }, [progress, saveProgress]);

  // Debug: Log storage usage
  useEffect(() => {
    try {
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
      const totalSize = allKeys.reduce((acc, key) => {
        const item = localStorage.getItem(key);
        return acc + (item ? item.length : 0);
      }, 0);
      
      console.log(`${LOG_PREFIX} 📦 Storage info:`, {
        totalVideoProgressKeys: allKeys.length,
        approximateSizeKB: (totalSize / 1024).toFixed(2),
        currentLesson: lessonId
      });
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error checking storage:`, error);
    }
  }, [lessonId]);

  return {
    progress,
    updateProgress,
    clearProgress,
    isLoading
  };
}