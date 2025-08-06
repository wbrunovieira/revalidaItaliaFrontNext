// src/hooks/useLessonAccess.ts
'use client';

import { useEffect, useCallback } from 'react';

const STORAGE_KEY = 'revalida_last_lesson_access';
const LOG_PREFIX = '[useLessonAccess]';

export interface LessonAccessData {
  lessonId: string;
  lessonTitle: string;
  courseId?: string;
  courseTitle: string;
  courseSlug: string;
  moduleId?: string;
  moduleTitle: string;
  moduleSlug: string;
  lessonImageUrl?: string;
  lessonUrl: string;
  accessedAt: string;
  hasVideo: boolean;
  progress: {
    percentage: number;
    currentTime: number;
    duration: number;
  };
}

export function useLessonAccess() {
  // Save lesson access to localStorage
  const saveLessonAccess = useCallback((data: Omit<LessonAccessData, 'accessedAt'>) => {
    try {
      const accessData: LessonAccessData = {
        ...data,
        accessedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(accessData));
      
      console.log(`${LOG_PREFIX} 💾 Lesson access saved:`, {
        lessonId: accessData.lessonId,
        title: accessData.lessonTitle,
        hasVideo: accessData.hasVideo,
        timestamp: accessData.accessedAt,
      });
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error saving lesson access:`, error);
    }
  }, []);

  // Get last accessed lesson from localStorage
  const getLastLessonAccess = useCallback((): LessonAccessData | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as LessonAccessData;
        console.log(`${LOG_PREFIX} 📥 Retrieved last lesson access:`, {
          lessonId: data.lessonId,
          title: data.lessonTitle,
          hasVideo: data.hasVideo,
          accessedAt: data.accessedAt,
        });
        return data;
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error retrieving lesson access:`, error);
    }
    return null;
  }, []);

  // Clear lesson access data
  const clearLessonAccess = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log(`${LOG_PREFIX} 🗑️ Lesson access data cleared`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error clearing lesson access:`, error);
    }
  }, []);

  // Track lesson access (called when entering a lesson page)
  const trackLessonAccess = useCallback((
    lessonId: string,
    lessonTitle: string,
    courseInfo: {
      courseId?: string;
      courseTitle: string;
      courseSlug: string;
    },
    moduleInfo: {
      moduleId?: string;
      moduleTitle: string;
      moduleSlug: string;
    },
    lessonImageUrl?: string,
    hasVideo: boolean = false,
    locale: string = 'pt'
  ) => {
    const lessonUrl = `/${locale}/courses/${courseInfo.courseSlug}/modules/${moduleInfo.moduleSlug}/lessons/${lessonId}`;
    
    const accessData: Omit<LessonAccessData, 'accessedAt'> = {
      lessonId,
      lessonTitle,
      courseId: courseInfo.courseId,
      courseTitle: courseInfo.courseTitle,
      courseSlug: courseInfo.courseSlug,
      moduleId: moduleInfo.moduleId,
      moduleTitle: moduleInfo.moduleTitle,
      moduleSlug: moduleInfo.moduleSlug,
      lessonImageUrl: lessonImageUrl || '',
      lessonUrl,
      hasVideo,
      progress: {
        percentage: hasVideo ? 0 : 100, // 100% for non-video lessons
        currentTime: 0,
        duration: hasVideo ? 1 : 0, // Default 1 second for video lessons until real duration is known
      },
    };

    saveLessonAccess(accessData);
    
    console.log(`${LOG_PREFIX} 📍 Tracking lesson access:`, {
      lessonId,
      title: lessonTitle,
      hasVideo,
      url: lessonUrl,
    });
  }, [saveLessonAccess]);

  return {
    trackLessonAccess,
    getLastLessonAccess,
    clearLessonAccess,
  };
}