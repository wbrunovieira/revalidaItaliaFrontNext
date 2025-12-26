import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/auth-utils';

interface FlashcardTranslation {
  locale: string;
  title: string;
}

export interface Flashcard {
  id: string;
  slug: string;
  questionText?: string;
  questionImageUrl?: string;
  questionType: 'TEXT' | 'IMAGE';
  answerText?: string;
  answerImageUrl?: string;
  answerType: 'TEXT' | 'IMAGE';
  translations?: FlashcardTranslation[];
  enabled?: boolean;
  disabledAt?: string | null;
}

interface UseLessonFlashcardsOptions {
  flashcardIds: string[];
  enabled?: boolean;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

/**
 * Fetch multiple flashcards by IDs
 */
async function fetchFlashcards(flashcardIds: string[]): Promise<Flashcard[]> {
  const token = getCookie('token');

  if (!token || flashcardIds.length === 0) {
    return [];
  }

  try {
    const flashcards = await Promise.all(
      flashcardIds.map(async (id) => {
        const response = await fetch(`${apiUrl}/api/v1/flashcards/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        // API retorna { success: true, flashcard: {...} }
        return data.flashcard || data;
      })
    );

    // Filter out nulls and disabled flashcards
    return flashcards.filter((f): f is Flashcard => f !== null && f.enabled !== false);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return [];
  }
}

/**
 * Hook to fetch lesson flashcards with caching
 *
 * Cache strategy:
 * - staleTime: 15 minutes (flashcards rarely change)
 * - gcTime: 30 minutes
 * - refetchOnWindowFocus: false
 */
export function useLessonFlashcards({
  flashcardIds,
  enabled = true,
}: UseLessonFlashcardsOptions) {
  return useQuery({
    queryKey: ['flashcards', flashcardIds.sort().join(',')],
    queryFn: () => fetchFlashcards(flashcardIds),
    enabled: enabled && flashcardIds.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
