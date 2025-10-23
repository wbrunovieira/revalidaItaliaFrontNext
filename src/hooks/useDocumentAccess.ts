import { useState, useCallback } from 'react';
import { getCookie } from '@/lib/auth-utils';

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

interface UseDocumentAccessOptions {
  lessonId: string;
  documentId: string;
  protectionLevel: 'WATERMARK' | 'FULL';
  onSuccess?: (url: string, rateLimitInfo?: FullAccessResponse['rateLimitInfo']) => void;
  onError?: (error: string) => void;
}

/**
 * Hook to request access to WATERMARK or FULL protection documents
 * Calls POST /api/v1/lessons/:lessonId/documents/:documentId/access
 *
 * IMPORTANT: Document must be processingStatus === 'COMPLETED' before calling this!
 * Use GET /api/v1/lessons/:lessonId/documents/:documentId to check status first.
 */
export function useDocumentAccess({
  lessonId,
  documentId,
  protectionLevel,
  onSuccess,
  onError,
}: UseDocumentAccessOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<FullAccessResponse['rateLimitInfo'] | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const getAuthToken = () => {
    return getCookie('token');
  };

  /**
   * Request access URL for WATERMARK or FULL protection document
   * Returns processed URL (WATERMARK) or signed URL (FULL)
   */
  const requestAccess = useCallback(async (): Promise<string> => {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Unauthorized');
    }

    if (!lessonId || !documentId) {
      throw new Error('Missing lessonId or documentId');
    }

    const url = `${apiUrl}/api/v1/lessons/${lessonId}/documents/${documentId}/access`;
    console.log('========================================');
    console.log('[requestAccess] POST /access');
    console.log('[requestAccess] URL:', url);
    console.log('[requestAccess] lessonId:', lessonId);
    console.log('[requestAccess] documentId:', documentId);
    console.log('[requestAccess] protectionLevel:', protectionLevel);
    console.log('[requestAccess] hasToken:', !!token);
    console.log('========================================');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[requestAccess] Response status:', response.status);

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
          throw new Error(`Limite de ${errorData.maxRequests || 5} acessos por hora atingido. Tente novamente em ${minutesRemaining} minutos.`);
        default:
          throw new Error('Erro ao acessar documento. Tente novamente.');
      }
    }

    const data = await response.json();

    // Handle response based on protection level
    if (protectionLevel === 'FULL' && data.signedUrl) {
      // FULL protection - has rate limit info
      const fullResponse = data as FullAccessResponse;
      setRateLimitInfo(fullResponse.rateLimitInfo);
      console.log('Signed URL received:', {
        expiresAt: fullResponse.expiresAt,
        rateLimitRemaining: fullResponse.rateLimitInfo?.remaining,
      });
      return fullResponse.signedUrl;
    } else if (protectionLevel === 'WATERMARK' && data.url) {
      // WATERMARK - direct URL with watermark
      const watermarkResponse = data as WatermarkAccessResponse;
      console.log('Watermark URL received:', { url: watermarkResponse.url });
      return watermarkResponse.url;
    }

    throw new Error('Resposta inválida do servidor');
  }, [apiUrl, lessonId, documentId, protectionLevel]);

  /**
   * Main method to access document
   * Will call POST /access and return the URL
   */
  const accessDocument = useCallback(async () => {
    console.log('[accessDocument] Starting access request for', protectionLevel, 'document:', documentId);
    setLoading(true);
    setError(null);

    try {
      console.log('[accessDocument] Calling POST /access...');
      const url = await requestAccess();
      console.log('[accessDocument] Received URL:', url);

      if (onSuccess) {
        console.log('[accessDocument] Calling onSuccess callback');
        onSuccess(url, rateLimitInfo || undefined);
      }

      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[accessDocument] Error:', errorMessage);
      setError(errorMessage);

      if (onError) {
        console.log('[accessDocument] Calling onError callback');
        onError(errorMessage);
      }

      throw err;
    } finally {
      setLoading(false);
      console.log('[accessDocument] Finished');
    }
  }, [requestAccess, rateLimitInfo, onSuccess, onError, protectionLevel, documentId]);

  return {
    loading,
    error,
    rateLimitInfo,
    accessDocument,
  };
}
