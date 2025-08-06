'use client';

import { useEffect } from 'react';
import { useLessonAccess } from '@/hooks/useLessonAccess';

interface LessonAccessTrackerProps {
  lessonId: string;
  lessonTitle: string;
  courseId?: string;
  courseTitle: string;
  courseSlug: string;
  moduleId?: string;
  moduleTitle: string;
  moduleSlug: string;
  lessonImageUrl?: string;
  hasVideo: boolean;
  locale: string;
}

export default function LessonAccessTracker({
  lessonId,
  lessonTitle,
  courseId,
  courseTitle,
  courseSlug,
  moduleId,
  moduleTitle,
  moduleSlug,
  lessonImageUrl,
  hasVideo,
  locale,
}: LessonAccessTrackerProps) {
  const { trackLessonAccess } = useLessonAccess();

  useEffect(() => {
    // Track lesson access when component mounts
    console.log('[LessonAccessTracker] 🚀 Tracking lesson access:', {
      lessonId,
      lessonTitle,
      hasVideo,
    });

    trackLessonAccess(
      lessonId,
      lessonTitle,
      { courseId, courseTitle, courseSlug },
      { moduleId, moduleTitle, moduleSlug },
      lessonImageUrl,
      hasVideo,
      locale
    );
  }, [
    lessonId,
    lessonTitle,
    courseId,
    courseTitle,
    courseSlug,
    moduleId,
    moduleTitle,
    moduleSlug,
    lessonImageUrl,
    hasVideo,
    locale,
    trackLessonAccess,
  ]);

  // This component doesn't render anything
  return null;
}