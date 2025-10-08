/**
 * ErrorHandler Component
 *
 * Componente centralizado para tratamento visual de erros no fluxo de entrada
 * em sessões ao vivo com tokens JWT únicos.
 *
 * Features:
 * - Dialog modal com mensagens user-friendly
 * - Mapeamento específico de erros por status HTTP
 * - Ações: Retry (gera novo token) e Dismiss (fecha modal)
 * - Integração completa com i18n (useTranslations)
 * - Ícones visuais por tipo de erro
 * - Design: bg-gray-800, bordas vermelhas para erros críticos
 *
 * Tipos de erro tratados:
 * - 400: Token inválido/expirado/usado
 * - 403: Acesso negado (sem matrícula)
 * - 404: Sessão não encontrada
 * - 500+: Erro inesperado
 *
 * @example
 * ```tsx
 * <ErrorHandler
 *   error={error}
 *   onRetry={() => handleJoinSession()}
 *   onDismiss={() => clearError()}
 * />
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Button from '@/components/Button';
import { AlertCircle, XCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApiProblemDetails } from '@/types/live-session';

/**
 * Props do componente ErrorHandler
 */
export interface ErrorHandlerProps {
  /** Erro da API (RFC 7807 Problem Details format) */
  error: ApiProblemDetails | null;
  /** Callback para tentar novamente (gera novo token) */
  onRetry?: () => void;
  /** Callback para fechar o modal */
  onDismiss?: () => void;
  /** Classes CSS customizadas */
  className?: string;
}

/**
 * Tipo de erro baseado em status HTTP
 */
type ErrorType = 'tokenInvalid' | 'tokenUsed' | 'sessionUnavailable' | 'accessDenied' | 'unknownError';

/**
 * Mapeia status HTTP para tipo de erro
 */
function getErrorType(status: number): ErrorType {
  switch (status) {
    case 400:
      // Pode ser: token expirado, token já usado, sessão não LIVE
      return 'tokenInvalid';
    case 401:
      // Token inválido ou ausente
      return 'tokenInvalid';
    case 403:
      // Sem permissão (não matriculado)
      return 'accessDenied';
    case 404:
      // Sessão não existe
      return 'sessionUnavailable';
    case 410:
      // Token já usado (Gone)
      return 'tokenUsed';
    default:
      // 500, 503, etc
      return 'unknownError';
  }
}

/**
 * Retorna ícone e cor baseado no tipo de erro
 */
function getErrorIcon(errorType: ErrorType): {
  Icon: typeof AlertCircle;
  colorClass: string;
} {
  switch (errorType) {
    case 'tokenInvalid':
      return { Icon: AlertCircle, colorClass: 'text-yellow-400' };
    case 'tokenUsed':
      return { Icon: ShieldAlert, colorClass: 'text-orange-400' };
    case 'sessionUnavailable':
      return { Icon: XCircle, colorClass: 'text-blue-400' };
    case 'accessDenied':
      return { Icon: ShieldAlert, colorClass: 'text-red-400' };
    case 'unknownError':
      return { Icon: XCircle, colorClass: 'text-red-400' };
  }
}

/**
 * Determina se é um erro crítico (bordas vermelhas)
 */
function isCriticalError(errorType: ErrorType): boolean {
  return errorType === 'accessDenied' || errorType === 'unknownError';
}

/**
 * Componente de tratamento de erros para sessões ao vivo
 */
export function ErrorHandler({
  error,
  onRetry,
  onDismiss,
  className,
}: ErrorHandlerProps) {
  const t = useTranslations('LiveSessions.errorHandler');
  const [open, setOpen] = useState(false);

  /**
   * Abre modal quando houver erro
   */
  useEffect(() => {
    if (error) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [error]);

  /**
   * Handler para fechar modal
   */
  const handleDismiss = () => {
    setOpen(false);
    onDismiss?.();
  };

  /**
   * Handler para retry
   */
  const handleRetry = () => {
    setOpen(false);
    onRetry?.();
  };

  // Se não houver erro, não renderizar nada
  if (!error) return null;

  const errorType = getErrorType(error.status);
  const { Icon, colorClass } = getErrorIcon(errorType);
  const critical = isCriticalError(errorType);

  /**
   * Mapeamento de tipos de erro para chaves de tradução
   */
  const errorMessageKey: Record<ErrorType, string> = {
    tokenInvalid: t('tokenInvalid'),
    tokenUsed: t('tokenUsed'),
    sessionUnavailable: t('sessionUnavailable'),
    accessDenied: t('accessDenied'),
    unknownError: t('unknownError'),
  };

  const errorMessage = errorMessageKey[errorType];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          'bg-gray-800 text-white border-2 max-w-md',
          critical ? 'border-red-500' : 'border-gray-600',
          className
        )}
      >
        <DialogHeader>
          {/* Ícone do erro */}
          <div className="flex justify-center mb-4">
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center',
                critical ? 'bg-red-500/20' : 'bg-gray-700'
              )}
            >
              <Icon className={cn('w-8 h-8', colorClass)} />
            </div>
          </div>

          {/* Título */}
          <DialogTitle className="text-center text-xl font-semibold">
            {t('title')}
          </DialogTitle>

          {/* Descrição do erro */}
          <DialogDescription className="text-center text-gray-300 mt-2">
            {errorMessage}
          </DialogDescription>
        </DialogHeader>

        {/* Botões de ação */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
          {/* Botão Dismiss */}
          <Button
            onClick={handleDismiss}
            className="flex-1 bg-transparent border border-gray-600 hover:bg-gray-700 text-white"
          >
            {t('dismiss')}
          </Button>

          {/* Botão Retry (apenas se callback fornecido) */}
          {onRetry && (
            <Button
              onClick={handleRetry}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('retry')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Exporta também como default para compatibilidade
 */
export default ErrorHandler;
