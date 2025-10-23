import { useQuery } from '@tanstack/react-query';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

export interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}

export interface Module {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

/**
 * Fetch all courses
 */
async function fetchCourses(): Promise<Course[]> {
  const response = await fetch(`${apiUrl}/api/v1/courses`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }

  return response.json();
}

/**
 * Hook to fetch all courses with caching
 *
 * Cache strategy:
 * - staleTime: 10 minutes (courses rarely change)
 * - gcTime: 30 minutes
 * - Shared across entire app
 */
export function useCourses(enabled: boolean = true) {
  return useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Fetch course modules
 */
async function fetchCourseModules(courseId: string): Promise<Module[]> {
  const response = await fetch(
    `${apiUrl}/api/v1/courses/${courseId}/modules`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch course modules');
  }

  return response.json();
}

interface UseCourseModulesOptions {
  courseId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch course modules with caching
 *
 * Cache strategy:
 * - staleTime: 5 minutes (modules list can change)
 * - gcTime: 20 minutes
 */
export function useCourseModules({
  courseId,
  enabled = true,
}: UseCourseModulesOptions) {
  return useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: () => fetchCourseModules(courseId),
    enabled: enabled && !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
