/**
 * JoinButton Component
 *
 * Botão para entrada em sessões Zoom ao vivo usando tokens JWT únicos.
 *
 * Features:
 * - Gera token JWT único (15 minutos, one-time use)
 * - Countdown timer de expiração
 * - Loading states (generating, joining)
 * - Estados visuais por status da sessão (LIVE, SCHEDULED, ENDED)
 * - Tratamento de erros completo
 * - Auto-redirect para Zoom após validação
 *
 * @example
 * ```tsx
 * <JoinButton
 *   sessionId="abc-123"
 *   sessionStatus="LIVE"
 * />
 * ```
 */

'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useLiveSessionJoin } from '@/hooks/useLiveSessionJoin';
import { ExpirationTimer } from './ExpirationTimer';
import Button from '@/components/Button';
import { Radio, Loader2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props do componente JoinButton
 */
export interface JoinButtonProps {
  /** UUID da sessão Zoom */
  sessionId: string;
  /** Status atual da sessão */
  sessionStatus: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  /** Desabilitar botão manualmente */
  disabled?: boolean;
  /** Callback após entrar com sucesso (opcional) */
  onJoinSuccess?: () => void;
  /** Callback em caso de erro (opcional) */
  onJoinError?: (error: Error) => void;
  /** Classes CSS customizadas */
  className?: string;
}

/**
 * Componente de botão para entrar em sessões ao vivo
 */
export function JoinButton({
  sessionId,
  sessionStatus,
  disabled = false,
  onJoinSuccess,
  onJoinError,
  className,
}: JoinButtonProps) {
  const t = useTranslations('LiveSessions');
  const { generateToken, joinWithToken, isGenerating, isJoining, error } = useLiveSessionJoin();

  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [hasExpired, setHasExpired] = useState(false);

  /**
   * Handler chamado quando token expira
   */
  const handleTokenExpire = useCallback(() => {
    console.log('⏰ Token expirou');
    setHasExpired(true);
    setTokenExpiresAt(null);
  }, []);

  /**
   * Handler principal - gera token e redireciona
   */
  const handleJoinSession = async () => {
    try {
      // Resetar estados
      setHasExpired(false);
      setTokenExpiresAt(null);

      // Passo 1: Gerar token JWT único
      const response = await generateToken(sessionId);

      if (!response) {
        // Erro já foi tratado pelo hook (toast exibido)
        onJoinError?.(new Error('Failed to generate token'));
        return;
      }

      console.log('✅ Token gerado:', {
        expiresAt: response.expiresAt,
        expiresIn: response.expiresIn,
      });

      // Armazenar timestamp de expiração
      setTokenExpiresAt(response.expiresAt);

      // Passo 2: Validar token e redirecionar (automaticamente)
      await joinWithToken(response.joinUrl);

      // Se chegou aqui, sucesso!
      onJoinSuccess?.();
    } catch (err) {
      console.error('❌ Erro ao entrar na sessão:', err);
      onJoinError?.(err instanceof Error ? err : new Error('Unknown error'));
    }
  };

  /**
   * Determina se botão deve estar desabilitado
   */
  const isDisabled =
    disabled ||
    isGenerating ||
    isJoining ||
    !['LIVE', 'SCHEDULED'].includes(sessionStatus);

  /**
   * Determina o texto do botão baseado no estado
   */
  const getButtonText = () => {
    if (isGenerating) return t('joinButton.generating') || 'Gerando token...';
    if (isJoining) return t('joinButton.joining') || 'Entrando na sessão...';

    switch (sessionStatus) {
      case 'LIVE':
        return t('joinButton.joinLive') || 'Entrar ao Vivo';
      case 'SCHEDULED':
        return t('joinButton.scheduled') || 'Sessão Agendada';
      case 'ENDED':
        return t('joinButton.ended') || 'Sessão Encerrada';
      case 'CANCELLED':
        return t('joinButton.cancelled') || 'Sessão Cancelada';
      default:
        return t('joinButton.unavailable') || 'Indisponível';
    }
  };

  /**
   * Determina classes CSS baseado no status da sessão
   */
  const getButtonClasses = () => {
    if (sessionStatus === 'LIVE' && !isDisabled) {
      return 'bg-red-500 hover:bg-red-600 animate-pulse';
    }
    if (sessionStatus === 'SCHEDULED' && !isDisabled) {
      return 'bg-blue-500 hover:bg-blue-600';
    }
    return 'bg-gray-400 hover:bg-gray-400 opacity-60';
  };

  /**
   * Ícone do botão baseado no estado
   */
  const getIcon = () => {
    if (isGenerating || isJoining) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    if (sessionStatus === 'LIVE') {
      return <Radio className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Botão principal */}
      <Button
        onClick={handleJoinSession}
        disabled={isDisabled}
        className={cn(
          'w-full flex items-center justify-center gap-2 text-white font-semibold transition-all duration-200',
          getButtonClasses(),
          className
        )}
        size="large"
      >
        {getIcon()}
        {getButtonText()}
      </Button>

      {/* Timer de expiração do token */}
      {tokenExpiresAt && !hasExpired && (
        <div className="flex justify-center">
          <ExpirationTimer expiresAt={tokenExpiresAt} onExpire={handleTokenExpire} />
        </div>
      )}

      {/* Mensagem de token expirado */}
      {hasExpired && (
        <div className="flex items-center justify-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-3 h-3" />
          <span>{t('joinButton.expired') || 'Link expirado. Clique novamente para gerar novo.'}</span>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-2 rounded border border-red-500/30">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error.detail || 'Erro ao entrar na sessão'}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Exporta também como default para compatibilidade
 */
export default JoinButton;
