import { useState, useCallback } from 'react';
import { getCookie } from '@/lib/auth-utils';

type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
type ProtectionLevel = 'NONE' | 'WATERMARK' | 'FULL';

interface SignedUrlResponse {
  signedUrl: string;
  expiresAt: string;
  rateLimitInfo: {
    limit: number;
    remaining: number;
    resetAt: number;
  };
}

interface DocumentStatusResponse {
  documentId: string;
  processingStatus: ProcessingStatus;
  protectionLevel: ProtectionLevel;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  processingError: string | null;
  processingAttempts: number;
  estimatedCompletionTime: string | null;
}

interface UseDocumentAccessOptions {
  lessonId: string;
  documentId: string;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export function useDocumentAccess({
  lessonId,
  documentId,
  onSuccess,
  onError,
}: UseDocumentAccessOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<SignedUrlResponse['rateLimitInfo'] | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  const getAuthToken = () => {
    return getCookie('token');
  };

  const requestSignedUrl = useCallback(async (): Promise<string> => {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Unauthorized');
    }

    const url = `${apiUrl}/api/v1/lessons/${lessonId}/documents/${documentId}/access`;
    console.log('Requesting signed URL:', {
      url,
      lessonId,
      documentId,
      hasToken: !!token,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

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
        case 409:
          const status = errorData.processingStatus || 'PROCESSING';
          setProcessingStatus(status);
          throw new Error(`PROCESSING:${status}`);
        case 429:
          const resetAt = new Date(errorData.resetAt);
          const now = new Date();
          const minutesRemaining = Math.ceil((resetAt.getTime() - now.getTime()) / 60000);
          throw new Error(`Limite de ${errorData.maxRequests || 5} acessos por hora atingido. Tente novamente em ${minutesRemaining} minutos.`);
        default:
          throw new Error('Erro ao acessar documento. Tente novamente.');
      }
    }

    const data: SignedUrlResponse = await response.json();
    setRateLimitInfo(data.rateLimitInfo);

    console.log('Signed URL received successfully:', {
      hasSignedUrl: !!data.signedUrl,
      expiresAt: data.expiresAt,
      rateLimitRemaining: data.rateLimitInfo.remaining,
    });

    return data.signedUrl;
  }, [apiUrl, lessonId, documentId]);

  const checkDocumentStatus = useCallback(async (): Promise<DocumentStatusResponse> => {
    const token = getAuthToken();

    if (!token) {
      throw new Error('Unauthorized');
    }

    const response = await fetch(
      `${apiUrl}/api/v1/lessons/${lessonId}/documents/${documentId}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao verificar status do documento');
    }

    const data: DocumentStatusResponse = await response.json();
    setProcessingStatus(data.processingStatus);

    return data;
  }, [apiUrl, lessonId, documentId]);

  const pollDocumentStatus = useCallback(async (): Promise<boolean> => {
    const maxAttempts = 30; // 30 tentativas = 5 minutos (10s cada)
    let attempts = 0;

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const status = await checkDocumentStatus();

          if (status.processingStatus === 'COMPLETED') {
            clearInterval(interval);
            setError(null);
            resolve(true);
          } else if (status.processingStatus === 'FAILED') {
            clearInterval(interval);
            setError('Falha no processamento do documento');
            resolve(false);
          }

          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(interval);
            setError('Tempo limite excedido. Tente novamente mais tarde.');
            resolve(false);
          }
        } catch (err) {
          console.error('Erro ao verificar status:', err);
          clearInterval(interval);
          resolve(false);
        }
      }, 10000); // 10 segundos
    });
  }, [checkDocumentStatus]);

  const accessDocument = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const signedUrl = await requestSignedUrl();

      if (onSuccess) {
        onSuccess(signedUrl);
      }

      return signedUrl;
    } catch (err: any) {
      const errorMessage = err.message;

      // Se for erro de processamento, iniciar polling
      if (errorMessage.startsWith('PROCESSING:')) {
        const status = errorMessage.split(':')[1];
        setError(`Documento ${getStatusMessage(status as ProcessingStatus)}. Aguarde...`);

        // Iniciar polling
        const completed = await pollDocumentStatus();

        if (completed && onError) {
          setError('Documento pronto! Clique novamente para abrir.');
        }
      } else {
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [requestSignedUrl, pollDocumentStatus, onSuccess, onError]);

  const getStatusMessage = (status: ProcessingStatus): string => {
    const messages = {
      PENDING: 'aguardando processamento',
      PROCESSING: 'sendo processado',
      FAILED: 'com erro no processamento',
      COMPLETED: 'pronto',
    };
    return messages[status] || 'em status desconhecido';
  };

  return {
    loading,
    error,
    rateLimitInfo,
    processingStatus,
    accessDocument,
    checkDocumentStatus,
    getStatusMessage,
  };
}
