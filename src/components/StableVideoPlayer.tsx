'use client';

import { memo } from 'react';
import LessonVideoPlayer from './LessonVideoPlayer';

interface StableVideoPlayerProps {
  videoId?: string;
  title?: string;
  thumbnailUrl?: string;
  playerUrl?: string;
  lessonId: string;
  courseId?: string;
  moduleId?: string;
  lessonTitle?: string;
  courseTitle?: string;
  courseSlug?: string;
  moduleTitle?: string;
  moduleSlug?: string;
  lessonImageUrl?: string;
}

// Memoize the video player to prevent unnecessary re-renders
const StableVideoPlayer = memo(function StableVideoPlayer(props: StableVideoPlayerProps) {
  // Create stable props object to prevent DevTools errors
  const stableProps = {
    videoId: props.videoId || '',
    title: props.title || '',
    thumbnailUrl: props.thumbnailUrl || '',
    playerUrl: props.playerUrl || '',
    lessonId: props.lessonId || '',
    courseId: props.courseId || '',
    moduleId: props.moduleId || '',
    lessonTitle: props.lessonTitle || '',
    courseTitle: props.courseTitle || '',
    courseSlug: props.courseSlug || '',
    moduleTitle: props.moduleTitle || '',
    moduleSlug: props.moduleSlug || '',
    lessonImageUrl: props.lessonImageUrl || '',
  };

  return <LessonVideoPlayer {...stableProps} />;
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary updates
  return (
    prevProps.videoId === nextProps.videoId &&
    prevProps.lessonId === nextProps.lessonId &&
    prevProps.courseId === nextProps.courseId &&
    prevProps.moduleId === nextProps.moduleId
  );
});

export default StableVideoPlayer;