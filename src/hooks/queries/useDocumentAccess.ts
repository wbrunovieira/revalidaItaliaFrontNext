import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookie } from '@/lib/auth-utils';
import type { ProtectionLevel } from './useDocumentStatus';

interface WatermarkAccessResponse {
  url: string;
}

interface FullAccessResponse {
  signedUrl: string;
  expiresAt: string;
  rateLimitInfo: {
    limit: number;
    remaining: number;
    resetAt: number;
  };
}

type DocumentAccessResponse = WatermarkAccessResponse | FullAccessResponse;

interface AccessDocumentParams {
  lessonId: string;
  documentId: string;
  protectionLevel: ProtectionLevel;
}

interface UseDocumentAccessOptions {
  onSuccess?: (url: string, rateLimitInfo?: FullAccessResponse['rateLimitInfo']) => void;
  onError?: (error: string) => void;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

/**
 * Request access URL for WATERMARK or FULL protection document
 */
async function requestDocumentAccess({
  lessonId,
  documentId,
  protectionLevel,
}: AccessDocumentParams): Promise<{
  url: string;
  rateLimitInfo?: FullAccessResponse['rateLimitInfo'];
}> {
  const token = getCookie('token');

  if (!token) {
    throw new Error('Unauthorized');
  }

  const url = `${apiUrl}/api/v1/lessons/${lessonId}/documents/${documentId}/access`;
  console.log('========================================');
  console.log('[useDocumentAccess] POST /access');
  console.log('[useDocumentAccess] URL:', url);
  console.log('[useDocumentAccess] lessonId:', lessonId);
  console.log('[useDocumentAccess] documentId:', documentId);
  console.log('[useDocumentAccess] protectionLevel:', protectionLevel);
  console.log('========================================');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  console.log('[useDocumentAccess] Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    console.error('Error response:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
    });

    switch (response.status) {
      case 401:
        throw new Error('Você precisa fazer login para acessar este documento.');
      case 403:
        throw new Error('Você não tem acesso a este documento. Faça upgrade do seu plano.');
      case 404:
        throw new Error('Documento não encontrado.');
      case 429:
        const resetAt = new Date(errorData.resetAt);
        const now = new Date();
        const minutesRemaining = Math.ceil((resetAt.getTime() - now.getTime()) / 60000);
        throw new Error(
          `Limite de ${errorData.maxRequests || 5} acessos por hora atingido. Tente novamente em ${minutesRemaining} minutos.`
        );
      default:
        throw new Error('Erro ao acessar documento. Tente novamente.');
    }
  }

  const data: DocumentAccessResponse = await response.json();

  // Handle response based on protection level
  if ('signedUrl' in data) {
    // FULL protection - has rate limit info
    console.log('Signed URL received:', {
      expiresAt: data.expiresAt,
      rateLimitRemaining: data.rateLimitInfo?.remaining,
    });
    return {
      url: data.signedUrl,
      rateLimitInfo: data.rateLimitInfo,
    };
  } else if ('url' in data) {
    // WATERMARK - direct URL with watermark
    console.log('Watermark URL received:', { url: data.url });
    return { url: data.url };
  }

  throw new Error('Resposta inválida do servidor');
}

/**
 * Hook to request access to protected documents using TanStack Query mutation
 *
 * Features:
 * - Automatic caching of document URLs
 * - Rate limit tracking for FULL documents
 * - Smart cache invalidation
 *
 * Cache Strategy:
 * - WATERMARK URLs: Cache for 30 minutes (doesn't change)
 * - FULL signed URLs: Cache for 50 minutes (expires in 1 hour)
 * - Rate limit info: Cache separately for UI feedback
 */
export function useDocumentAccess({ onSuccess, onError }: UseDocumentAccessOptions = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: requestDocumentAccess,

    onSuccess: (data, variables) => {
      console.log('[useDocumentAccess] Success, caching URL...', {
        documentId: variables.documentId,
        protectionLevel: variables.protectionLevel,
        hasRateLimitInfo: !!data.rateLimitInfo,
      });

      // Cache the document URL
      queryClient.setQueryData(
        ['document-access', variables.lessonId, variables.documentId],
        data
      );

      // Cache rate limit info separately for FULL documents
      if (data.rateLimitInfo) {
        queryClient.setQueryData(
          ['rate-limit', variables.lessonId, variables.documentId],
          data.rateLimitInfo
        );
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(data.url, data.rateLimitInfo);
      }
    },

    onError: (error: Error) => {
      console.error('[useDocumentAccess] Error:', error.message);

      // Call error callback
      if (onError) {
        onError(error.message);
      }
    },

    // Retry logic
    retry: (failureCount, error) => {
      // Don't retry auth errors or rate limit errors
      if (
        error instanceof Error &&
        (error.message.includes('login') ||
          error.message.includes('Limite') ||
          error.message.includes('acesso'))
      ) {
        return false;
      }
      // Retry up to 2 times for network errors
      return failureCount < 2;
    },
  });

  return {
    accessDocument: mutation.mutate,
    accessDocumentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
    reset: mutation.reset,
  };
}

/**
 * Hook to get cached document access URL without making a new request
 * Useful for checking if we already have a valid URL in cache
 */
export function useCachedDocumentUrl(lessonId: string, documentId: string) {
  const queryClient = useQueryClient();

  const cachedData = queryClient.getQueryData<{
    url: string;
    rateLimitInfo?: FullAccessResponse['rateLimitInfo'];
  }>(['document-access', lessonId, documentId]);

  return {
    url: cachedData?.url || null,
    rateLimitInfo: cachedData?.rateLimitInfo || null,
    hasCachedUrl: !!cachedData?.url,
  };
}

/**
 * Hook to invalidate document access cache
 * Useful after document reprocessing or when user upgrades plan
 */
export function useInvalidateDocumentAccess() {
  const queryClient = useQueryClient();

  return {
    invalidateDocument: (lessonId: string, documentId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['document-access', lessonId, documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['document-status', lessonId, documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['rate-limit', lessonId, documentId],
      });
    },
    invalidateAllDocuments: (lessonId: string) => {
      queryClient.invalidateQueries({
        queryKey: ['document-access', lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ['document-status', lessonId],
      });
    },
  };
}
