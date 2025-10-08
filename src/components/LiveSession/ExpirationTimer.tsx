/**
 * ExpirationTimer Component
 *
 * Countdown timer para tokens JWT de sessões Zoom ao vivo.
 * Mostra tempo restante em formato MM:SS com alertas visuais.
 *
 * Features:
 * - Countdown em tempo real (atualização a cada segundo)
 * - Formato MM:SS (ex: 14:32)
 * - Alert visual quando < 2 minutos (amarelo pulsante)
 * - Callback quando expirar (timeLeft === 0)
 * - Cleanup automático de interval no unmount
 * - Badge com ícones Clock (normal) / AlertTriangle (low time)
 *
 * @example
 * ```tsx
 * <ExpirationTimer
 *   expiresAt="2025-01-08T15:15:00.000Z"
 *   onExpire={() => console.log('Token expirado!')}
 * />
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Props do componente ExpirationTimer
 */
export interface ExpirationTimerProps {
  /** Timestamp ISO 8601 de quando o token expira */
  expiresAt: string;
  /** Callback chamado quando o timer chega a zero */
  onExpire?: () => void;
  /** Classes CSS customizadas */
  className?: string;
}

/**
 * Threshold em segundos para considerar "low time" (2 minutos = 120 segundos)
 */
const LOW_TIME_THRESHOLD = 120;

/**
 * Componente de countdown timer para expiração de token
 */
export function ExpirationTimer({ expiresAt, onExpire, className }: ExpirationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasExpired, setHasExpired] = useState(false);

  /**
   * Calcula tempo restante em segundos
   */
  const calculateTimeLeft = useCallback((): number => {
    const now = Date.now();
    const expiresAtTime = new Date(expiresAt).getTime();
    const remaining = Math.max(0, Math.floor((expiresAtTime - now) / 1000));
    return remaining;
  }, [expiresAt]);

  /**
   * Formata segundos em MM:SS
   */
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Determina se está em low time (< 2 minutos)
   */
  const isLowTime = timeLeft > 0 && timeLeft <= LOW_TIME_THRESHOLD;

  /**
   * Setup do interval para atualizar countdown a cada segundo
   */
  useEffect(() => {
    // Calcular tempo inicial
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    // Se já expirou, chamar callback imediatamente
    if (initialTime === 0) {
      setHasExpired(true);
      onExpire?.();
      return;
    }

    // Setup interval para atualizar a cada segundo
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      // Quando chegar a zero, chamar callback e limpar interval
      if (remaining === 0) {
        setHasExpired(true);
        onExpire?.();
        clearInterval(interval);
      }
    }, 1000);

    // Cleanup: limpar interval quando componente desmontar ou expiresAt mudar
    return () => {
      clearInterval(interval);
    };
  }, [expiresAt, calculateTimeLeft, onExpire]);

  /**
   * Se já expirou, não renderizar nada
   * (O componente pai deve lidar com o estado expirado)
   */
  if (hasExpired || timeLeft === 0) {
    return null;
  }

  /**
   * Determina classes CSS baseado no tempo restante
   */
  const badgeClasses = cn(
    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-300',
    isLowTime
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    className
  );

  /**
   * Ícone baseado no tempo restante
   */
  const Icon = isLowTime ? AlertTriangle : Clock;

  /**
   * Texto do label
   */
  const label = isLowTime ? 'Expira em breve' : 'Expira em';

  return (
    <Badge variant="outline" className={badgeClasses}>
      <Icon className="w-3 h-3" />
      <span className="text-xs">{label}:</span>
      <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
    </Badge>
  );
}

/**
 * Exporta também como default para compatibilidade
 */
export default ExpirationTimer;
