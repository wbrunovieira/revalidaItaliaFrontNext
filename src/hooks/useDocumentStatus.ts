import { useState, useCallback } from 'react';
import { getCookie } from '@/lib/auth-utils';

export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ProtectionLevel = 'NONE' | 'WATERMARK' | 'FULL';

interface DocumentStatusData {
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
  onStatusChange?: (status: ProcessingStatus) => void;
}

/**
 * Hook to fetch document info and check processing status
 * Calls GET /api/v1/lessons/:lessonId/documents/:documentId
 */
export function useDocumentStatus({
  lessonId,
  documentId,
  onStatusChange,
}: UseDocumentStatusOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatusData | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const getAuthToken = () => {
    return getCookie('token');
  };

  /**
   * Fetch document processing status
   * Calls GET /api/v1/lessons/:lessonId/documents/:documentId/status
   */
  const fetchDocumentStatus = useCallback(async (): Promise<DocumentStatusData> => {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Unauthorized');
    }

    if (!lessonId || !documentId) {
      throw new Error('Missing lessonId or documentId');
    }

    const url = `${apiUrl}/api/v1/lessons/${lessonId}/documents/${documentId}/status`;
    console.log('[fetchDocumentStatus] Fetching status:', { url, lessonId, documentId });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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

    console.log('[fetchDocumentStatus] Status received:', {
      documentId: data.documentId,
      protectionLevel: data.protectionLevel,
      processingStatus: data.processingStatus,
      canRetryProcessing: data.canRetryProcessing,
    });

    setDocumentStatus(data);

    if (onStatusChange) {
      onStatusChange(data.processingStatus);
    }

    return data;
  }, [apiUrl, lessonId, documentId, onStatusChange]);

  /**
   * Poll document status until COMPLETED or FAILED
   * Used for WATERMARK and FULL documents that are still processing
   */
  const pollStatus = useCallback(async (): Promise<DocumentStatusData | null> => {
    const maxAttempts = 30; // 5 minutes at 10s intervals
    let attempts = 0;

    console.log('[pollStatus] Starting polling...');
    setIsPolling(true);
    setError(null);

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          attempts++;
          console.log(`[pollStatus] Attempt ${attempts}/${maxAttempts}`);

          const status = await fetchDocumentStatus();
          console.log('[pollStatus] Status:', status.processingStatus);

          if (status.processingStatus === 'COMPLETED') {
            console.log('[pollStatus] Document COMPLETED! Stopping polling and returning status');
            clearInterval(interval);
            setIsPolling(false);
            resolve(status);
            return;
          } else if (status.processingStatus === 'FAILED') {
            console.log('[pollStatus] Document FAILED!');
            clearInterval(interval);
            setIsPolling(false);
            setError(status.processingError || 'Falha no processamento do documento');
            resolve(null);
            return;
          }

          if (attempts >= maxAttempts) {
            console.log('[pollStatus] Max attempts reached, stopping polling');
            clearInterval(interval);
            setIsPolling(false);
            setError('Tempo limite excedido. O documento ainda está sendo processado. Tente novamente mais tarde.');
            resolve(null);
            return;
          }

          console.log(`[pollStatus] Still ${status.processingStatus}, will check again in 10s...`);
        } catch (err) {
          console.error('[pollStatus] Error:', err);
          clearInterval(interval);
          setIsPolling(false);
          setError(err instanceof Error ? err.message : 'Erro ao verificar status');
          resolve(null);
        }
      }, 10000); // 10 seconds
    });
  }, [fetchDocumentStatus]);

  /**
   * Check document status and wait if processing
   * Returns document status when ready (COMPLETED) or null if failed/timeout
   */
  const checkAndWait = useCallback(async (): Promise<DocumentStatusData | null> => {
    console.log('[checkAndWait] Starting...');
    setLoading(true);
    setError(null);

    try {
      console.log('[checkAndWait] Fetching document status...');
      const status = await fetchDocumentStatus();
      console.log('[checkAndWait] Received status:', status.processingStatus);

      // If already completed, return immediately
      if (status.processingStatus === 'COMPLETED') {
        console.log('[checkAndWait] Document is COMPLETED, returning immediately');
        setLoading(false);
        return status;
      }

      // If failed, return null
      if (status.processingStatus === 'FAILED') {
        console.log('[checkAndWait] Document FAILED');
        setError(status.processingError || 'Falha no processamento do documento');
        setLoading(false);
        return null;
      }

      // If pending or processing, start polling
      if (status.processingStatus === 'PENDING' || status.processingStatus === 'PROCESSING') {
        console.log('[checkAndWait] Document is PENDING/PROCESSING, starting polling...');
        const completedStatus = await pollStatus();
        console.log('[checkAndWait] Polling finished, result:', completedStatus);
        setLoading(false);
        return completedStatus;
      }

      console.log('[checkAndWait] Unknown status, returning status');
      setLoading(false);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[checkAndWait] Error:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [fetchDocumentStatus, pollStatus]);

  const getStatusMessage = useCallback((status: ProcessingStatus): string => {
    const messages = {
      PENDING: 'aguardando processamento',
      PROCESSING: 'sendo processado',
      FAILED: 'falhou no processamento',
      COMPLETED: 'pronto',
    };
    return messages[status] || 'em status desconhecido';
  }, []);

  return {
    loading,
    error,
    documentStatus,
    isPolling,
    fetchDocumentStatus,
    checkAndWait,
    getStatusMessage,
  };
}
