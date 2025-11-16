// /src/components/SessionCard.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth.store';
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  ChevronDown,
  ChevronUp,
  Calendar,
  Globe,
  Shield,
  Activity,
  MapPin,
  Clock,
  X,
} from 'lucide-react';

// Interfaces para a resposta da API
interface SessionFromAPI {
  id: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | null;
  deviceName: string | null;
  location: string | null;
  ipAddress: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
  isCurrent: boolean;
}

interface SessionsResponse {
  sessions: SessionFromAPI[];
  totalSessions: number;
  activeSessions: number;
}

export default function SessionCard() {
  const t = useTranslations('Profile.sessions');
  const session = useAuthStore((state) => state.session);
  const deviceInfo = useAuthStore((state) => state.deviceInfo);
  const token = useAuthStore((state) => state.token);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingOtherSessions, setIsLoadingOtherSessions] = useState(false);
  const [otherSessions, setOtherSessions] = useState<SessionFromAPI[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [activeSessions, setActiveSessions] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Se não tiver sessão, mostrar mensagem para fazer novo login
  if (!session || !deviceInfo) {
    return (
      <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <Shield size={24} className="text-secondary" />
            {t('title')}
          </h2>
        </div>

        <div className="text-center py-8">
          <Shield size={48} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/60 text-sm mb-2">{t('noSessionData')}</p>
          <p className="text-white/40 text-xs">{t('reloginRequired')}</p>
        </div>
      </div>
    );
  }

  // Ícone do tipo de dispositivo
  const DeviceIcon = ({ type }: { type: 'desktop' | 'mobile' | 'tablet' | 'unknown' | null }) => {
    switch (type) {
      case 'mobile':
        return <Smartphone size={20} className="text-secondary" />;
      case 'tablet':
        return <Tablet size={20} className="text-secondary" />;
      case 'desktop':
        return <Monitor size={20} className="text-secondary" />;
      default:
        return <Laptop size={20} className="text-secondary" />;
    }
  };

  // Formatar data
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatar data relativa (ex: "2 horas atrás")
  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return t('minutesAgo', { minutes: diffMins });
    if (diffHours < 24) return t('hoursAgo', { hours: diffHours });
    if (diffDays < 7) return t('daysAgo', { days: diffDays });
    return formatDate(isoString);
  };

  const handleToggleExpand = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setIsLoadingOtherSessions(true);
      setFetchError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/v1/me/sessions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.status}`);
        }

        const data: SessionsResponse = await response.json();

        console.log('📋 Sessões recebidas:', data);

        // Identificar a sessão atual comparando com o session.id do Zustand
        const sessionsWithCurrent = data.sessions.map((s) => ({
          ...s,
          isCurrent: s.id === session.id, // Marcar sessão atual
        }));

        setOtherSessions(sessionsWithCurrent);
        setTotalSessions(data.totalSessions);
        setActiveSessions(data.activeSessions);
      } catch (error) {
        console.error('❌ Error fetching sessions:', error);
        setFetchError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoadingOtherSessions(false);
      }
    } else {
      setIsExpanded(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
          <Shield size={24} className="text-secondary" />
          {t('title')}
        </h2>
      </div>

      {/* Sessão Atual */}
      <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg p-4 border border-secondary/20 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-secondary/20 rounded-lg">
            <DeviceIcon type={deviceInfo.deviceType} />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1">
              {t('currentSession')}
            </h3>
            <p className="text-secondary text-sm font-medium">
              {deviceInfo.browser} {deviceInfo.browserVersion} • {deviceInfo.deviceType}
            </p>
          </div>
          <div className="px-2 py-1 bg-green-500/20 rounded-md">
            <div className="flex items-center gap-1">
              <Activity size={12} className="text-green-400" />
              <span className="text-green-400 text-xs font-medium">
                {t('active')}
              </span>
            </div>
          </div>
        </div>

        {/* Detalhes da Sessão */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Monitor size={16} className="text-white/40" />
            <span>{t('system')}:</span>
            <span className="text-white font-medium">{deviceInfo.os}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <MapPin size={16} className="text-white/40" />
            <span>{t('ipAddress')}:</span>
            <span className="text-white font-medium">{session.ipAddress}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <Globe size={16} className="text-white/40" />
            <span>{t('timezone')}:</span>
            <span className="text-white font-medium">{deviceInfo.timezone}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <Calendar size={16} className="text-white/40" />
            <span>{t('loginAt')}:</span>
            <span className="text-white font-medium">{formatDate(session.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Botão Ver Outras Sessões */}
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
      >
        <span className="text-white text-sm font-medium">
          {isExpanded ? t('hideOtherSessions') : t('viewOtherSessions')}
          {totalSessions > 0 && !isExpanded && (
            <span className="ml-2 text-white/60">({totalSessions})</span>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp size={20} className="text-white/60" />
        ) : (
          <ChevronDown size={20} className="text-white/60" />
        )}
      </button>

      {/* Outras Sessões (Expandido) */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
          {isLoadingOtherSessions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto mb-3"></div>
              <p className="text-white/60 text-sm">{t('loading')}</p>
            </div>
          ) : fetchError ? (
            <div className="text-center py-8">
              <X size={48} className="text-red-400/60 mx-auto mb-3" />
              <p className="text-red-400 text-sm mb-2">{t('errorLoading')}</p>
              <p className="text-white/40 text-xs">{fetchError}</p>
            </div>
          ) : otherSessions.length === 0 ? (
            <div className="text-center py-8">
              <Shield size={48} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm mb-2">{t('noOtherSessions')}</p>
              <p className="text-white/40 text-xs">{t('onlyOneSessionAllowed')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header com contadores */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <p className="text-white/80 text-sm">
                  {t('totalSessions', { total: totalSessions })}
                </p>
                <p className="text-secondary text-sm font-medium">
                  {t('activeSessions', { active: activeSessions })}
                </p>
              </div>

              {/* Lista de sessões */}
              {otherSessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`p-3 rounded-lg border transition-all ${
                    sess.isCurrent
                      ? 'bg-secondary/10 border-secondary/30'
                      : sess.isActive
                      ? 'bg-white/5 border-white/10'
                      : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      sess.isCurrent ? 'bg-secondary/20' : 'bg-white/10'
                    }`}>
                      <DeviceIcon type={sess.deviceType} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white text-sm font-medium truncate">
                          {sess.deviceName || t('unknownDevice')}
                        </h4>
                        {sess.isCurrent && (
                          <span className="px-2 py-0.5 bg-secondary/20 text-secondary text-xs font-medium rounded">
                            {t('thisSession')}
                          </span>
                        )}
                        {!sess.isCurrent && sess.isActive && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                            {t('active')}
                          </span>
                        )}
                        {!sess.isActive && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                            {t('revoked')}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {sess.location && (
                          <p className="text-white/60 text-xs flex items-center gap-1">
                            <MapPin size={12} />
                            {sess.location}
                          </p>
                        )}
                        <p className="text-white/60 text-xs flex items-center gap-1">
                          <Globe size={12} />
                          {sess.ipAddress}
                        </p>
                        <p className="text-white/60 text-xs flex items-center gap-1">
                          <Clock size={12} />
                          {t('lastActivity')}: {formatRelativeTime(sess.lastActivity)}
                        </p>
                        <p className="text-white/50 text-xs flex items-center gap-1">
                          <Calendar size={12} />
                          {t('created')}: {formatDate(sess.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
