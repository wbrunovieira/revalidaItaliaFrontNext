import { useQuery } from '@tanstack/react-query';
import type { ProtectionLevel } from './useDocumentStatus';

interface DocumentTranslation {
  locale: string;
  title: string;
  description: string;
  url: string;
}

export interface Document {
  id: string;
  filename: string;
  protectionLevel?: ProtectionLevel;
  translations: DocumentTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface UseLessonDocumentsOptions {
  lessonId: string;
  enabled?: boolean;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

/**
 * Fetch documents for a lesson
 */
async function fetchLessonDocuments(lessonId: string): Promise<Document[]> {
  const response = await fetch(
    `${apiUrl}/api/v1/lessons/${lessonId}/documents`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  return response.json();
}

/**
 * Hook to fetch lesson documents with caching
 *
 * Cache strategy:
 * - staleTime: 10 minutes (document list rarely changes)
 * - gcTime: 30 minutes
 * - refetchOnWindowFocus: false
 * - Invalidate when new document uploaded
 */
export function useLessonDocuments({
  lessonId,
  enabled = true,
}: UseLessonDocumentsOptions) {
  return useQuery({
    queryKey: ['lesson-documents', lessonId],
    queryFn: () => fetchLessonDocuments(lessonId),
    enabled: enabled && !!lessonId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
