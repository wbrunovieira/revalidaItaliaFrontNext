import { useQuery } from '@tanstack/react-query';
import { getCookie } from '@/lib/auth-utils';

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ProtectionLevel = 'NONE' | 'WATERMARK' | 'FULL';

export interface DocumentStatusData {
  documentId: string;
  filename: string;
  protectionLevel: ProtectionLevel;
  processingStatus: ProcessingStatus;
  processingError: string | null;
  processingAttempts: number;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  canRetryProcessing: boolean;
}

interface UseDocumentStatusOptions {
  lessonId: string;
  documentId: string;
  enabled?: boolean;
  onStatusChange?: (status: ProcessingStatus) => void;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

/**
 * Fetches document processing status from API
 */
async function fetchDocumentStatus(
  lessonId: string,
  documentId: string
): Promise<DocumentStatusData> {
  const token = getCookie('token');

  if (!token) {
    throw new Error('Unauthorized');
  }

  const url = `${apiUrl}/api/v1/lessons/${lessonId}/documents/${documentId}/status`;
  console.log('[useDocumentStatus] Fetching status:', { url, lessonId, documentId });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    switch (response.status) {
      case 401:
        throw new Error('Você precisa fazer login para acessar este documento.');
      case 403:
        throw new Error('Você não tem acesso a este documento.');
      case 404:
        throw new Error('Documento não encontrado.');
      default:
        throw new Error('Erro ao buscar status do documento. Tente novamente.');
    }
  }

  const data: DocumentStatusData = await response.json();

  console.log('[useDocumentStatus] Status received:', {
    documentId: data.documentId,
    protectionLevel: data.protectionLevel,
    processingStatus: data.processingStatus,
    canRetryProcessing: data.canRetryProcessing,
  });

  return data;
}

/**
 * Hook to fetch and poll document processing status using TanStack Query
 *
 * Features:
 * - Automatic polling when status is PENDING or PROCESSING
 * - Stops polling when COMPLETED or FAILED
 * - Smart caching based on protection level
 * - Automatic retry on errors
 *
 * Cache Strategy:
 * - NONE: 1 minute cache (static files)
 * - WATERMARK: 30 minutes cache (processed files don't change often)
 * - FULL: 50 minutes cache (aligned with signed URL expiration)
 */
export function useDocumentStatus({
  lessonId,
  documentId,
  enabled = true,
  onStatusChange,
}: UseDocumentStatusOptions) {
  const query = useQuery({
    queryKey: ['document-status', lessonId, documentId],
    queryFn: () => fetchDocumentStatus(lessonId, documentId),
    enabled: enabled && !!lessonId && !!documentId,

    // Smart caching based on status
    staleTime: (query) => {
      const data = query.state.data;
      if (!data) return 0;

      // Don't cache PENDING/PROCESSING - need fresh data for polling
      if (data.processingStatus === 'PENDING' || data.processingStatus === 'PROCESSING') {
        return 0;
      }

      // Cache COMPLETED documents based on protection level
      if (data.processingStatus === 'COMPLETED') {
        switch (data.protectionLevel) {
          case 'NONE':
            return 1 * 60 * 1000; // 1 minute
          case 'WATERMARK':
            return 30 * 60 * 1000; // 30 minutes
          case 'FULL':
            return 50 * 60 * 1000; // 50 minutes (aligned with signed URL)
          default:
            return 5 * 60 * 1000; // 5 minutes default
        }
      }

      // Don't cache FAILED status - allow retry
      return 0;
    },

    // Keep in cache for 1 hour after component unmount
    gcTime: 60 * 60 * 1000,

    // Automatic polling when status is PENDING or PROCESSING
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;

      const isProcessing =
        data.processingStatus === 'PENDING' ||
        data.processingStatus === 'PROCESSING';

      console.log('[useDocumentStatus] Polling check:', {
        status: data.processingStatus,
        willPoll: isProcessing,
      });

      // Poll every 10 seconds while processing
      return isProcessing ? 10000 : false;
    },

    // Retry failed requests
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error instanceof Error && error.message.includes('login')) {
        return false;
      }
      // Retry up to 3 times
      return failureCount < 3;
    },

    // Don't refetch on window focus to avoid unnecessary requests
    refetchOnWindowFocus: false,
  });

  // Call onStatusChange callback when status changes
  const currentStatus = query.data?.processingStatus;
  if (currentStatus && onStatusChange) {
    onStatusChange(currentStatus);
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isPolling: query.isRefetching && (
      query.data?.processingStatus === 'PENDING' ||
      query.data?.processingStatus === 'PROCESSING'
    ),
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

/**
 * Helper function to get user-friendly status message
 */
export function getStatusMessage(status: ProcessingStatus): string {
  const messages = {
    PENDING: 'aguardando processamento',
    PROCESSING: 'sendo processado',
    FAILED: 'falhou no processamento',
    COMPLETED: 'pronto',
  };
  return messages[status] || 'em status desconhecido';
}
