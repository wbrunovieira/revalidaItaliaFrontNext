/**
 * WaitingRoom Component
 *
 * Sala de espera animada e amigável exibida durante validação de token
 * para entrada em sessões ao vivo.
 *
 * Features:
 * - Animações suaves e profissionais
 * - Mensagens rotativas com tom humorado
 * - Indicador de loading com pulso
 * - Ícones temáticos (GraduationCap, Sparkles, Coffee)
 * - Design centrado com gradiente de fundo
 * - Transições suaves entre estados
 * - Multilanguage support (i18n)
 *
 * @example
 * ```tsx
 * <WaitingRoom isValidating={true} />
 * ```
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { GraduationCap, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props do componente WaitingRoom
 */
export interface WaitingRoomProps {
  /** Indica se está validando token */
  isValidating?: boolean;
  /** Classes CSS customizadas */
  className?: string;
}

/**
 * Componente de sala de espera com animações
 */
export function WaitingRoom({
  isValidating = true,
  className,
}: WaitingRoomProps) {
  const t = useTranslations('LiveSessions.waitingRoom');

  // Mensagens rotativas
  const messages = [
    t('messages.0'),
    t('messages.1'),
    t('messages.2'),
    t('messages.3'),
    t('messages.4'),
    t('messages.5'),
    t('messages.6'),
    t('messages.7'),
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  /**
   * Rotação de mensagens a cada 2 segundos
   */
  useEffect(() => {
    if (!isValidating || isRedirecting) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isValidating, isRedirecting, messages.length]);

  /**
   * Simula estado de redirecionamento após 3 segundos
   * (na prática, o redirect real acontece antes)
   */
  useEffect(() => {
    if (!isValidating) return;

    const timeout = setTimeout(() => {
      setIsRedirecting(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isValidating]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-gradient-to-br from-primary via-gray-900 to-gray-950',
        'overflow-hidden',
        className
      )}
    >
      {/* Círculos de fundo animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-2xl mx-auto px-6 text-center">
        {/* Ícone principal com animação */}
        <div className="relative mb-8">
          {/* Círculo de fundo pulsante */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-500/20 rounded-full animate-ping" />
          </div>

          {/* Ícone central rotativo */}
          <div className="relative w-32 h-32 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-2xl">
            <GraduationCap className="w-16 h-16 text-white animate-bounce" />
          </div>

          {/* Estrelas decorativas */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
          <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-yellow-400 animate-pulse delay-500" />
        </div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
          {t('title')}
        </h1>

        {/* Subtítulo */}
        <p className="text-lg md:text-xl text-gray-300 mb-8 animate-fade-in delay-200">
          {t('subtitle')}
        </p>

        {/* Mensagem rotativa */}
        <div className="min-h-[60px] flex items-center justify-center mb-8">
          <div
            key={currentMessageIndex}
            className="flex items-center gap-3 text-blue-300 text-base md:text-lg font-medium animate-slide-up"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{isRedirecting ? t('redirecting') : messages[currentMessageIndex]}</span>
          </div>
        </div>

        {/* Barra de progresso indeterminada */}
        <div className="w-full max-w-md h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 animate-progress" />
        </div>

        {/* Mensagem de validação */}
        <p className="mt-6 text-sm text-gray-400 animate-fade-in delay-500">
          {isRedirecting ? t('redirecting') : t('validating')}
        </p>
      </div>

      {/* Animações CSS customizadas */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }

        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }

        .delay-200 {
          animation-delay: 200ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}

/**
 * Exporta também como default para compatibilidade
 */
export default WaitingRoom;
