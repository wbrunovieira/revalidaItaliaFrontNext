import { useQuery } from '@tanstack/react-query';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Video {
  id: string;
  slug: string;
  imageUrl?: string;
  providerVideoId: string;
  durationInSeconds: number;
  isSeen: boolean;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

import type { LiveSessionRecording } from '@/components/LiveSessionsSection';

export interface Lesson {
  id: string;
  moduleId: string;
  courseId?: string;
  imageUrl?: string;
  video?: Video;
  translations: Translation[];
  flashcardIds?: string[];
  liveSessionRecordings?: LiveSessionRecording[];
  createdAt: string;
  updatedAt: string;
}

interface UseLessonOptions {
  courseId: string;
  moduleId: string;
  lessonId: string;
  enabled?: boolean;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

/**
 * Fetch lesson data from API
 */
async function fetchLesson(
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<Lesson> {
  const response = await fetch(
    `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch lesson');
  }

  return response.json();
}

/**
 * Hook to fetch lesson data with caching
 *
 * Cache strategy:
 * - staleTime: 5 minutes (lesson content rarely changes)
 * - gcTime: 30 minutes (keep in cache for navigation)
 * - refetchOnWindowFocus: false (avoid unnecessary refetches)
 */
export function useLesson({
  courseId,
  moduleId,
  lessonId,
  enabled = true,
}: UseLessonOptions) {
  return useQuery({
    queryKey: ['lesson', courseId, moduleId, lessonId],
    queryFn: () => fetchLesson(courseId, moduleId, lessonId),
    enabled: enabled && !!courseId && !!moduleId && !!lessonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Fetch module lessons with pagination
 */
export interface LessonsResponse {
  lessons: Lesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

async function fetchModuleLessons(
  courseId: string,
  moduleId: string,
  page: number = 1,
  limit: number = 10
): Promise<LessonsResponse> {
  const response = await fetch(
    `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons?page=${page}&limit=${limit}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch module lessons');
  }

  return response.json();
}

interface UseModuleLessonsOptions {
  courseId: string;
  moduleId: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook to fetch all lessons in a module with caching
 *
 * Cache strategy:
 * - staleTime: 3 minutes (list changes when new lessons added)
 * - gcTime: 15 minutes
 * - Cached per page to enable pagination
 */
export function useModuleLessons({
  courseId,
  moduleId,
  page = 1,
  limit = 10,
  enabled = true,
}: UseModuleLessonsOptions) {
  return useQuery({
    queryKey: ['module-lessons', courseId, moduleId, page, limit],
    queryFn: () => fetchModuleLessons(courseId, moduleId, page, limit),
    enabled: enabled && !!courseId && !!moduleId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
