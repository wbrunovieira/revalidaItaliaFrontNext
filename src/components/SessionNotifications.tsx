'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore, checkSuspiciousActivity } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente que observa mudanças no auth store e exibe notificações
 * sobre sessões revogadas usando o sistema de i18n do projeto
 */
export function SessionNotifications() {
  const t = useTranslations('Session');
  const { toast } = useToast();
  const lastRevokedSession = useAuthStore((state) => state.lastRevokedSession);
  const deviceInfo = useAuthStore((state) => state.deviceInfo);
  const session = useAuthStore((state) => state.session);

  // Usar ref para evitar mostrar toast múltiplas vezes para a mesma sessão revogada
  const lastProcessedRevokedSessionId = useRef<string | null>(null);
  const hasShownLoginSuccess = useRef(false);

  useEffect(() => {
    // Caso 1: Sessão revogada detectada
    if (lastRevokedSession && deviceInfo) {
      // Gerar ID único para esta sessão revogada (combinação de IP + timestamp)
      const sessionId = `${lastRevokedSession.ipAddress}-${lastRevokedSession.revokedAt}`;

      // Só processar se não foi processada antes
      if (lastProcessedRevokedSessionId.current !== sessionId) {
        lastProcessedRevokedSessionId.current = sessionId;

        // Verificar se é atividade suspeita
        const isSuspicious = checkSuspiciousActivity(lastRevokedSession, deviceInfo);

        if (isSuspicious) {
          // 🚨 Toast crítico de segurança
          toast({
            title: t('suspiciousActivity.title'),
            description: t('suspiciousActivity.description', {
              deviceName: lastRevokedSession.deviceName || t('deviceInfo.unknown'),
              deviceType: lastRevokedSession.deviceType || t('deviceInfo.device'),
              ip: lastRevokedSession.ipAddress,
            }),
            variant: 'destructive',
          });
        } else {
          // ⚠️ Toast informativo sobre sessão revogada
          const deviceInfoText = `${lastRevokedSession.deviceName || t('deviceInfo.unknown')} (${lastRevokedSession.deviceType || t('deviceInfo.device')})`;
          const date = new Date(lastRevokedSession.createdAt).toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          toast({
            title: t('sessionRevoked.title'),
            description: t('sessionRevoked.description', {
              deviceInfo: deviceInfoText,
              date: date,
              ip: lastRevokedSession.ipAddress,
            }),
            variant: 'default',
          });
        }
      }
    }
    // Caso 2: Primeiro login ou nenhuma sessão anterior
    else if (session && !lastRevokedSession && !hasShownLoginSuccess.current) {
      hasShownLoginSuccess.current = true;

      toast({
        title: t('loginSuccess.title'),
        description: t('loginSuccess.description'),
        variant: 'default',
      });
    }
  }, [lastRevokedSession, deviceInfo, session, toast, t]);

  // Este componente não renderiza nada visualmente
  return null;
}
