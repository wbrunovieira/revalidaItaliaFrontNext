// /src/components/NavSidebar.tsx
'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  WifiOff,
  CheckCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Nav from './Nav';
import Sidebar from './Sidebar';

interface NavSidebarProps {
  children: ReactNode;
}

interface ConnectionError {
  type: 'network' | 'server' | 'timeout';
  message: string;
  retryable: boolean;
}

type ConnectionStatus =
  | 'checking'
  | 'online'
  | 'offline'
  | 'error';

export default function NavSidebar({
  children,
}: NavSidebarProps) {
  const t = useTranslations('Dashboard');
  const [collapsed, setCollapsed] = useState(true);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('checking');
  const [connectionError, setConnectionError] =
    useState<ConnectionError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const toggleSidebar = () => setCollapsed(prev => !prev);

  const checkBackendConnection = useCallback(async (
    isRetry = false
  ): Promise<boolean> => {
    if (isRetry) {
      setIsRetrying(true);
    }

    try {
      setConnectionError(null);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3333';
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        5000
      ); // 5s timeout

      // Teste endpoints essenciais
      const responses = await Promise.allSettled([
        fetch(`${apiUrl}/api/v1/tracks`, {
          method: 'HEAD', // Apenas verificar se existe
          signal: controller.signal,
          cache: 'no-store',
        }),
        fetch(`${apiUrl}/api/v1/courses`, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-store',
        }),
      ]);

      clearTimeout(timeoutId);

      const hasErrors = responses.some(
        result =>
          result.status === 'rejected' ||
          (result.status === 'fulfilled' &&
            !result.value.ok)
      );

      if (hasErrors) {
        // Verificar tipo de erro
        const firstError = responses.find(
          r => r.status === 'rejected'
        ) as PromiseRejectedResult;
        if (firstError?.reason?.name === 'AbortError') {
          setConnectionError({
            type: 'timeout',
            message: t('serverTimeout'),
            retryable: true,
          });
        } else {
          setConnectionError({
            type: 'network',
            message: t('serverUnavailable'),
            retryable: true,
          });
        }
        setConnectionStatus('error');
        return false;
      }

      setConnectionStatus('online');
      setRetryCount(0);
      return true;
    } catch (error) {
      console.error(
        'Erro na verificação de conectividade:',
        error
      );

      setConnectionError({
        type: 'network',
        message: t('connectionFailed'),
        retryable: true,
      });
      setConnectionStatus('error');

      return false;
    } finally {
      setIsRetrying(false);
    }
  }, [t]);

  // Hidratação segura
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Verificação inicial e automática
  useEffect(() => {
    if (!isHydrated) return;

    const initialCheck = async () => {
      const isOnline = await checkBackendConnection();

      // Auto-retry para erros de rede (máximo 2 tentativas)
      if (!isOnline && retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkBackendConnection(true);
        }, 3000 * (retryCount + 1)); // Backoff: 3s, 6s
      }
    };

    initialCheck();

    // Verificação periódica a cada 30 segundos se houver erro
    const interval = setInterval(() => {
      if (connectionStatus === 'error') {
        checkBackendConnection();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [connectionStatus, retryCount, isHydrated, checkBackendConnection]);

  return (
    <div className="flex">
      <Nav collapsed={collapsed} onToggle={toggleSidebar} />

      <Sidebar
        collapsed={collapsed}
        onToggle={toggleSidebar}
      />

      <main
        className={`flex-1 transition-margin duration-300 ease-in-out ${
          collapsed ? 'ml-20' : 'ml-64'
        } pt-16`}
      >
        {/* Connection Status Banner */}
        {isHydrated &&
          connectionStatus === 'error' &&
          connectionError && (
            <div className="bg-gradient-to-r from-red-600 to-red-700 border-b border-red-500 shadow-lg">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 shadow-md">
                    {connectionError.type === 'network' ? (
                      <WifiOff
                        size={16}
                        className="text-white"
                      />
                    ) : (
                      <AlertTriangle
                        size={16}
                        className="text-white"
                      />
                    )}
                  </div>

                  <div>
                    <p className="text-white text-sm font-medium">
                      {t('serverUnavailable')}
                    </p>
                    <p className="text-red-200 text-xs">
                      {t('serverUnavailableDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Connection Checking Banner */}
        {isHydrated && connectionStatus === 'checking' && (
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 border-b border-yellow-500">
            <div className="flex items-center justify-center px-4 py-2">
              <div className="flex items-center gap-3">
                <RefreshCw
                  size={16}
                  className="text-yellow-200 animate-spin"
                />
                <p className="text-yellow-100 text-sm">
                  {isRetrying
                    ? t('retryingConnection')
                    : t('checkingConnection')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Banner (brief) */}
        {isHydrated &&
          connectionStatus === 'online' &&
          retryCount > 0 && (
            <div className="bg-gradient-to-r from-green-600 to-green-700 border-b border-green-500">
              <div className="flex items-center justify-center px-4 py-2">
                <div className="flex items-center gap-3">
                  <CheckCircle
                    size={16}
                    className="text-green-200"
                  />
                  <p className="text-green-100 text-sm">
                    {t('connectionRestored')}
                  </p>
                </div>
              </div>
            </div>
          )}

        {children}
      </main>
    </div>
  );
}
