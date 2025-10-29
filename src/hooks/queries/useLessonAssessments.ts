import { useQuery } from '@tanstack/react-query';

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
  passingScore?: number;
  timeLimitInMinutes?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  lessonId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentsResponse {
  assessments: Assessment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface UseLessonAssessmentsOptions {
  lessonId: string;
  enabled?: boolean;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

/**
 * Fetch assessments for a lesson
 */
async function fetchLessonAssessments(lessonId: string): Promise<AssessmentsResponse> {
  const response = await fetch(
    `${apiUrl}/api/v1/assessments?lessonId=${lessonId}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    // Return empty if not found
    return {
      assessments: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }

  return response.json();
}

/**
 * Hook to fetch lesson assessments with caching
 *
 * Cache strategy:
 * - staleTime: 10 minutes (assessments rarely change)
 * - gcTime: 30 minutes
 * - refetchOnWindowFocus: false
 */
export function useLessonAssessments({
  lessonId,
  enabled = true,
}: UseLessonAssessmentsOptions) {
  return useQuery({
    queryKey: ['lesson-assessments', lessonId],
    queryFn: () => fetchLessonAssessments(lessonId),
    enabled: enabled && !!lessonId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
