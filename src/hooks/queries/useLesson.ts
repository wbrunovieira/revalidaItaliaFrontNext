import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

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

// ============ Interactive Lessons Types ============

export type LessonType = 'STANDARD' | 'ENVIRONMENT_3D';

export interface AudioTranslation {
  locale: string;
  title: string;
  description?: string;
}

export interface Audio {
  id: string;
  lessonId?: string;
  filename: string;
  url: string;
  s3Key?: string;
  durationInSeconds: number;
  formattedDuration?: string;
  fileSize: number;
  mimeType: string;
  order: number;
  transcription?: string;
  translations: AudioTranslation[];
  createdAt?: string;
  updatedAt?: string;
}

export type AnimationType = 'CompleteSentence' | 'MultipleChoice';
export type GameType = 'DRAG_WORD' | 'REORDER_WORDS' | 'FILL_BLANK' | 'SELECT_OPTION' | 'TYPE_COMPLETION' | 'MULTIPLE_BLANKS';

export interface AnimationSentence {
  fullSentence: string;
  // For DRAG_WORD, REORDER_WORDS, TYPE_COMPLETION
  targetWord?: string;
  wordPosition?: number;
  // For MULTIPLE_BLANKS (minimum 2 words)
  targetWords?: string[];
  wordPositions?: number[];
  hint?: string;
}

export interface AnimationContent {
  gameType: GameType;
  sentences: AnimationSentence[];
  distractors: string[];
}

// MultipleChoice animation content (quiz format)
export interface MultipleChoiceContent {
  question: string;
  options: [string, string, string];
  correctOptionIndex: 0 | 1 | 2;
  explanation?: string;
}

export interface Animation {
  id: string;
  lessonId?: string;
  type: AnimationType;
  order: number;
  totalQuestions?: number;
  enabled: boolean;
  disabledAt?: string | null;
  // Content varies based on type:
  // - CompleteSentence: AnimationContent
  // - MultipleChoice: MultipleChoiceContent
  content?: AnimationContent | MultipleChoiceContent;
  createdAt?: string;
  updatedAt?: string;
}

export interface Environment3DTranslation {
  locale: string;
  name?: string;
  title?: string;
  description?: string;
}

export interface Environment3D {
  id: string;
  slug: string;
  translations: Environment3DTranslation[];
}

// ============ Main Lesson Interface ============

export interface Lesson {
  id: string;
  moduleId: string;
  courseId?: string;
  slug?: string;
  order?: number;
  imageUrl?: string;
  videoId?: string | null;
  // Lesson type for interactive lessons
  type?: LessonType;
  // Standard video content
  video?: Video;
  // Interactive Lessons: Audio content (for STANDARD type) - from detail route
  audios?: Audio[];
  // Interactive Lessons: Animation exercises (for STANDARD type) - from detail route
  animations?: Animation[];
  // Interactive Lessons: Boolean flags - from list route
  hasAudios?: boolean;
  hasAnimations?: boolean;
  // Interactive Lessons: 3D environment (for ENVIRONMENT_3D type)
  environment3dId?: string;
  environment3d?: Environment3D;
  // Existing fields
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

  const data = await response.json();

  return data;
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
 * Prefetch lesson data for faster navigation
 *
 * Call this on hover to preload lesson data before user clicks.
 * Data will be instantly available when they navigate.
 */
export function prefetchLesson(
  courseId: string,
  moduleId: string,
  lessonId: string
): void {
  if (!courseId || !moduleId || !lessonId) return;

  // Check if already cached and fresh
  const cached = queryClient.getQueryData(['lesson', courseId, moduleId, lessonId]);
  if (cached) return;

  queryClient.prefetchQuery({
    queryKey: ['lesson', courseId, moduleId, lessonId],
    queryFn: () => fetchLesson(courseId, moduleId, lessonId),
    staleTime: 5 * 60 * 1000, // 5 minutes
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

// ============ Animation Attempt Types ============

export interface RecordAttemptResponse {
  progressId: string;
  animationId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  attempts: number;
  isFirstCompletion: boolean;
}

interface RecordAttemptParams {
  lessonId: string;
  animationId: string;
  isCorrect: boolean;
}

/**
 * Record an animation attempt
 */
async function recordAnimationAttempt({
  lessonId,
  animationId,
  isCorrect,
}: RecordAttemptParams): Promise<RecordAttemptResponse> {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) {
    console.warn('[AnimationAttempt] No auth token found');
    throw new Error('Not authenticated');
  }

  const url = `${apiUrl}/api/v1/lessons/${lessonId}/animations/${animationId}/attempt`;

  console.log('[AnimationAttempt] Sending request:', {
    url,
    lessonId,
    animationId,
    isCorrect,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isCorrect }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[AnimationAttempt] API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // Body is not JSON
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log('[AnimationAttempt] Success:', result);
  return result;
}

/**
 * Hook to record animation attempt (for incorrect answers)
 */
export function useRecordAnimationAttempt() {
  return useMutation({
    mutationFn: recordAnimationAttempt,
  });
}

interface CompleteAnimationParams {
  lessonId: string;
  animationId: string;
}

/**
 * Mark an animation as complete (successful completion)
 */
async function completeAnimation({
  lessonId,
  animationId,
}: CompleteAnimationParams): Promise<RecordAttemptResponse> {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) {
    console.warn('[AnimationComplete] No auth token found');
    throw new Error('Not authenticated');
  }

  const url = `${apiUrl}/api/v1/lessons/${lessonId}/animations/${animationId}/complete`;

  console.log('[AnimationComplete] Sending request:', {
    url,
    lessonId,
    animationId,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[AnimationComplete] API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // Body is not JSON
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log('[AnimationComplete] Success:', result);
  return result;
}

/**
 * Hook to mark animation as complete (for successful completions)
 */
export function useCompleteAnimation() {
  return useMutation({
    mutationFn: completeAnimation,
  });
}

// ============ Animation Progress Types ============

export interface AnimationProgressItem {
  animationId: string;
  completed: boolean;
  attempts: number;
  completedAt: string | null;
}

export interface AnimationsProgressResponse {
  lessonId: string;
  totalAnimations: number;
  completedAnimations: number;
  totalAttempts: number;
  percentComplete: number;
  progress: AnimationProgressItem[];
}

/**
 * Fetch animations progress for a lesson
 */
async function fetchAnimationsProgress(
  lessonId: string
): Promise<AnimationsProgressResponse> {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) {
    console.warn('[AnimationsProgress] No auth token found');
    throw new Error('Not authenticated');
  }

  const url = `${apiUrl}/api/v1/lessons/${lessonId}/animations/progress`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[AnimationsProgress] API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // Body is not JSON
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

interface UseAnimationsProgressOptions {
  lessonId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch animations progress for a lesson
 *
 * Cache strategy:
 * - staleTime: 1 minute (progress changes frequently as user completes exercises)
 * - gcTime: 5 minutes
 * - refetchOnWindowFocus: true (user might complete exercise in another tab)
 */
export function useAnimationsProgress({
  lessonId,
  enabled = true,
}: UseAnimationsProgressOptions) {
  return useQuery({
    queryKey: ['animations-progress', lessonId],
    queryFn: () => fetchAnimationsProgress(lessonId),
    enabled: enabled && !!lessonId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
