import { useQuery } from '@tanstack/react-query';

// ============ Types ============

export interface UserProgressOverview {
  lastActivityAt?: string;
  memberSince: string;
  daysActive: number;
}

export interface CoursesProgressStats {
  totalCourses: number;
  coursesInProgress: number;
  completedCourses: number;
  notStartedCourses: number;
  averageProgress: number;
  totalLessons: number;
  completedLessons: number;
  lessonsCompletionRate: number;
}

export interface TracksProgressStats {
  totalTracks: number;
  completedTracks: number;
  tracksInProgress: number;
  mostAdvancedTrack?: {
    id: string;
    title: string;
    progress: number;
  };
}

export interface FlashcardsStats {
  totalAnswered: number;
  correctAnswers: number;
  accuracy: number;
  todayCompleted: boolean;
  lastReviewDate?: string;
}

export interface AnimationsStats {
  totalAvailable: number;
  totalAttempted: number;
  totalCompleted: number;
  successRate: number;
  averageAttempts: number;
  todayActivity: boolean;
  lastActivityAt?: string;
}

export interface UserProgress {
  overview: UserProgressOverview;
  coursesProgress: CoursesProgressStats;
  tracksProgress: TracksProgressStats;
  flashcardsStats: FlashcardsStats;
  animationsStats?: AnimationsStats;
}

export interface CourseProgressItem {
  id: string;
  slug: string;
  order: number;
  imageUrl: string;
  moduleCount: number;
  translations?: Array<{ locale: string; title: string; description: string }>;
  progress?: {
    completedModules: number;
    totalModules: number;
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
}

// ============ Helpers ============

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;

  return document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1] || null;
}

// ============ Fetch Functions ============

/**
 * Fetch user progress (SLOW endpoint - ~1-2s)
 */
async function fetchUserProgress(): Promise<UserProgress> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(`${apiUrl}/api/v1/users/me/progress`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user progress: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch courses with progress (FASTER endpoint - ~200-500ms)
 */
async function fetchCoursesProgress(): Promise<CourseProgressItem[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(`${apiUrl}/api/v1/courses-progress`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch courses progress: ${response.status}`);
  }

  return response.json();
}

// ============ Hooks ============

/**
 * Hook to fetch user progress with caching
 *
 * This is the SLOW endpoint, so we use aggressive caching:
 * - staleTime: 5 minutes (data rarely changes within a session)
 * - gcTime: 30 minutes (keep in cache for navigation)
 * - refetchOnWindowFocus: false (avoid unnecessary refetches)
 */
export function useUserProgress(enabled: boolean = true) {
  return useQuery({
    queryKey: ['user-progress'],
    queryFn: fetchUserProgress,
    enabled,
    staleTime: 5 * 60 * 1000,      // 5 minutes - data is valid
    gcTime: 30 * 60 * 1000,        // 30 minutes - keep in cache
    refetchOnWindowFocus: false,   // Don't refetch on tab focus
    refetchOnMount: false,         // Use cached data if available
    retry: 1,                      // Only 1 retry (slow endpoint)
    retryDelay: 1000,              // Wait 1s before retry
  });
}

/**
 * Hook to fetch courses with progress (faster endpoint)
 *
 * This endpoint is faster, so we can be less aggressive with caching:
 * - staleTime: 2 minutes
 * - gcTime: 15 minutes
 */
export function useCoursesProgress(enabled: boolean = true) {
  return useQuery({
    queryKey: ['courses-progress'],
    queryFn: fetchCoursesProgress,
    enabled,
    staleTime: 2 * 60 * 1000,      // 2 minutes
    gcTime: 15 * 60 * 1000,        // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// ============ Utility Functions ============

/**
 * Get active courses (with progress > 0) sorted by progress
 */
export function getActiveCourses(
  courses: CourseProgressItem[] | undefined,
  locale: string,
  limit: number = 4
): Array<{
  id: string;
  title: string;
  slug: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
}> {
  if (!courses) return [];

  return courses
    .filter(course => (course.progress?.percentage ?? 0) > 0)
    .map(course => ({
      id: course.id,
      title: course.translations?.find(t => t.locale === locale)?.title || course.slug,
      slug: course.slug,
      progress: course.progress?.percentage || 0,
      completedLessons: course.progress?.completedLessons || 0,
      totalLessons: course.progress?.totalLessons || 0,
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
}
