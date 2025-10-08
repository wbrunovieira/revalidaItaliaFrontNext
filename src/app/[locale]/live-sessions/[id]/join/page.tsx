/**
 * Live Session Join Page
 *
 * Página de redirecionamento para entrada em sessões ao vivo com tokens JWT únicos.
 *
 * Fluxo:
 * 1. Usuário acessa: /live-sessions/:id/join?token=xxx
 * 2. Mostra waiting room com animações suaves
 * 3. Valida token JWT (GET /api/v1/live-sessions/:id/join?token=xxx)
 * 4. Redireciona automaticamente para Zoom
 *
 * Features:
 * - Waiting room com animações amigáveis
 * - Mensagens multilanguage com tom humorado
 * - Loading states durante validação
 * - Error handling com ErrorHandler component
 * - Auto-redirect após validação bem-sucedida
 *
 * @route /[locale]/live-sessions/[id]/join?token=xxx
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { WaitingRoom } from '@/components/LiveSession/WaitingRoom';
import { ErrorHandler } from '@/components/LiveSession/ErrorHandler';
import { useLiveSessionJoin } from '@/hooks/useLiveSessionJoin';
import type { ApiProblemDetails } from '@/types/live-session';

/**
 * Props da página (Next.js App Router)
 */
interface JoinPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

/**
 * Página de entrada em sessão ao vivo
 */
export default function JoinPage({ params }: JoinPageProps) {
  const t = useTranslations('LiveSessions');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { joinWithToken, isJoining, error, clearError } = useLiveSessionJoin();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<ApiProblemDetails | null>(null);

  /**
   * Resolve params (Next.js 15 async params)
   */
  useEffect(() => {
    params.then((resolvedParams) => {
      setSessionId(resolvedParams.id);
    });
  }, [params]);

  /**
   * Valida token e redireciona quando página carregar
   */
  useEffect(() => {
    // Aguardar sessionId e token estarem disponíveis
    if (!sessionId || !token) {
      return;
    }

    console.log('🚪 [JoinPage] Iniciando validação de token para sessão:', sessionId);

    // Construir joinUrl (path relativo)
    const joinUrl = `/api/v1/live-sessions/${sessionId}/join?token=${token}`;

    // Validar token e redirecionar
    const validateAndRedirect = async () => {
      try {
        await joinWithToken(joinUrl);
        // Se chegou aqui, joinWithToken já redirecionou para Zoom
        // (window.location.href = redirectUrl)
      } catch (err) {
        console.error('❌ [JoinPage] Erro ao validar token:', err);
        setValidationError(err as ApiProblemDetails);
      }
    };

    validateAndRedirect();
  }, [sessionId, token, joinWithToken]);

  /**
   * Handler para retry (gera novo token)
   * Redireciona para página de detalhes da sessão
   */
  const handleRetry = () => {
    if (sessionId) {
      window.location.href = `/live-sessions`;
    }
  };

  /**
   * Handler para dismiss error
   */
  const handleDismissError = () => {
    clearError();
    setValidationError(null);
  };

  /**
   * Se não houver token, mostrar erro
   */
  if (!token) {
    return (
      <ErrorHandler
        error={{
          status: 400,
          detail: t('errorHandler.tokenInvalid'),
        }}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
      />
    );
  }

  /**
   * Mostrar waiting room durante validação
   */
  return (
    <>
      <WaitingRoom isValidating={isJoining} />

      {/* Error handler (modal) */}
      <ErrorHandler
        error={error || validationError}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
      />
    </>
  );
}
