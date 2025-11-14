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
    `${apiUrl}/api/v1/lessons/${lessonId}/documents?page=1&limit=100&_t=${Date.now()}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Força não usar cache
    }
  );

  if (!response.ok) {
    console.error('[useLessonDocuments] API error:', response.status, response.statusText);
    return [];
  }

  const data = await response.json();
  console.log('[useLessonDocuments] API response:', data);

  // API retorna { documents: [], pagination: {} }
  // Extrair apenas o array de documentos
  if (Array.isArray(data)) {
    console.warn('[useLessonDocuments] ⚠️ API retornou array direto (formato antigo)');
    return data;
  }

  if (data.documents && Array.isArray(data.documents)) {
    console.log('[useLessonDocuments] ✅ API retornou objeto paginado (formato novo)');
    return data.documents;
  }

  console.error('[useLessonDocuments] ❌ Formato inesperado:', data);
  return [];
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
