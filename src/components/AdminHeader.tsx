// /src/components/AdminHeader.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Shield,
  User,
  Activity,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  WifiOff,
} from 'lucide-react';

import LanguageButton from '@/components/LanguageButton';
import LogoutButton from '@/components/LogoutButton';
import Logo from '@/components/Logo';
import { GradientDivider } from '@/components/ui/gradient-divider';
import { useAuth } from '@/stores/auth.store';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
}

interface ConnectionError {
  type: 'network' | 'auth' | 'server';
  message: string;
  retryable: boolean;
}

export default function AdminHeader() {
  const t = useTranslations('Admin');
  const { user, isAuthenticated, token } = useAuth();
  const [loadingUser, setLoadingUser] = useState(false);
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [additionalUserInfo, setAdditionalUserInfo] = useState<UserInfo | null>(null);

  const determineErrorType = (error: unknown): ConnectionError => {
    const err = error as Error;
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      return {
        type: 'network',
        message: 'Servidor indisponível. Verifique sua conexão.',
        retryable: true
      };
    }
    if (err.message.includes('401') || err.message.includes('Unauthorized')) {
      return {
        type: 'auth',
        message: 'Sessão expirada. Faça login novamente.',
        retryable: false
      };
    }
    return {
      type: 'server',
      message: 'Erro interno do servidor.',
      retryable: true
    };
  };

  const fetchAdditionalUserInfo = useCallback(async (isRetry = false) => {
    // Se já temos os dados do usuário no store, não precisa buscar novamente
    if (user && user.name && user.email) {
      setAdditionalUserInfo({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'admin' | 'student'
      });
      return;
    }

    if (!isAuthenticated || !token || !user?.id) {
      setConnectionError({
        type: 'auth',
        message: 'Token de autenticação não encontrado.',
        retryable: false
      });
      return;
    }

    if (isRetry) {
      setIsRetrying(true);
    }

    try {
      setConnectionError(null);
      setLoadingUser(true);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${user.id}`,
        { 
          headers,
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        setAdditionalUserInfo(userData.user);
        setRetryCount(0);
      } else if (response.status === 401) {
        setConnectionError({
          type: 'auth',
          message: 'Sessão expirada. Faça login novamente.',
          retryable: false
        });
      } else {
        setConnectionError({
          type: 'server',
          message: `Erro do servidor (${response.status}).`,
          retryable: true
        });
      }
    } catch (error) {
      console.error('Erro ao buscar informações adicionais do usuário:', error);
      const errorInfo = determineErrorType(error);
      setConnectionError(errorInfo);
      
      if (errorInfo.retryable && retryCount < 3 && !isRetry) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchAdditionalUserInfo(true);
        }, 2000 * (retryCount + 1));
      }
    } finally {
      setLoadingUser(false);
      setIsRetrying(false);
    }
  }, [retryCount, user, token, isAuthenticated]);

  const handleManualRetry = () => {
    setLoadingUser(true);
    setRetryCount(0);
    fetchAdditionalUserInfo(true);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAdditionalUserInfo();
    }
  }, [fetchAdditionalUserInfo, isAuthenticated, user]);

  return (
    <header className="relative z-10 bg-gradient-to-r from-primary-dark/80 via-primary/60 to-primary-dark/80 backdrop-blur-md shadow-2xl shadow-primary/20 rounded-2xl border border-primary/20 mb-8">
      <div className="p-4">
        {/* Grid Layout - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          
          {/* Column 1 - Title & Activity */}
          <div className="flex justify-center lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/20 to-primary/20 border border-secondary/30 shadow-md">
                <Activity
                  size={20}
                  className="text-secondary"
                />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                  {t('title')}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-gray-300 text-sm">
                    {t('description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 - Logo (Center) */}
          <div className="flex justify-center order-first lg:order-none">
            <div className="bg-gradient-to-br from-secondary/10 to-primary/10 p-3 rounded-xl border border-secondary/20 shadow-lg">
              <Logo />
            </div>
          </div>

          {/* Column 3 - User Info & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 sm:gap-4">
            {/* User Profile */}
            {!loadingUser && (user || additionalUserInfo) && !connectionError && (
              <div className="group relative">
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50 backdrop-blur-sm hover:from-gray-700/60 hover:to-gray-800/60 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary ring-2 ring-secondary/20 shadow-md">
                      {(user?.role || additionalUserInfo?.role) === 'admin' ? (
                        <Shield
                          size={18}
                          className="text-white"
                        />
                      ) : (
                        <User
                          size={18}
                          className="text-white"
                        />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800 flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <p className="text-white text-sm font-medium leading-tight">
                      {user?.name || additionalUserInfo?.name || 'Usuário'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                      <p className="text-gray-400 text-xs">
                        {(user?.role || additionalUserInfo?.role) === 'admin'
                          ? 'Administrador'
                          : 'Usuário'}
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    size={16}
                    className="text-gray-400 hidden sm:block"
                  />
                </div>
              </div>
            )}

            {/* Connection Error State */}
            {!loadingUser && connectionError && (
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-900/60 to-red-800/60 rounded-xl border border-red-700/50 backdrop-blur-sm shadow-lg">
                <div className="relative">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-red-500/20 shadow-md">
                    {connectionError.type === 'network' ? (
                      <WifiOff size={18} className="text-white" />
                    ) : (
                      <AlertTriangle size={18} className="text-white" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-800 flex items-center justify-center shadow-sm animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="hidden sm:block text-right flex-1">
                  <p className="text-white text-sm font-medium leading-tight">
                    Erro de Conexão
                  </p>
                  <p className="text-red-300 text-xs mt-1 max-w-48 truncate">
                    {connectionError.message}
                  </p>
                </div>

                {connectionError.retryable && (
                  <button
                    onClick={handleManualRetry}
                    disabled={isRetrying}
                    className="flex items-center gap-1 px-2 py-1 bg-red-600/80 hover:bg-red-500/80 rounded-lg text-white text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw 
                      size={12} 
                      className={isRetrying ? "animate-spin" : ""} 
                    />
                    <span className="hidden sm:inline">
                      {isRetrying ? 'Tentando...' : 'Tentar'}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Retry Status */}
            {retryCount > 0 && isRetrying && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-900/60 to-yellow-800/60 rounded-lg border border-yellow-700/50 backdrop-blur-sm">
                <RefreshCw size={14} className="text-yellow-300 animate-spin" />
                <p className="text-yellow-200 text-xs">
                  Tentativa {retryCount}/3
                </p>
              </div>
            )}
            {/* Loading State */}
            {loadingUser && (
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50 backdrop-blur-sm shadow-lg">
                <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="hidden sm:block text-right">
                  <div className="w-20 h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="w-16 h-3 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <LanguageButton />
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <GradientDivider variant="subtle" />
    </header>
  );
}
