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
  Clock,
  MapPin,
  Calendar,
  Globe,
  Shield,
  Activity,
} from 'lucide-react';

export default function SessionCard() {
  const t = useTranslations('Profile.sessions');
  const session = useAuthStore((state) => state.session);
  const deviceInfo = useAuthStore((state) => state.deviceInfo);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingOtherSessions, setIsLoadingOtherSessions] = useState(false);

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
  const DeviceIcon = () => {
    switch (deviceInfo.deviceType) {
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

  // Calcular tempo até expirar
  const getExpirationTime = () => {
    const now = new Date();
    const expiration = new Date(session.expiresAt);
    const diffMs = expiration.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return t('expiresInDays', { days: diffDays });
    } else if (diffHours > 0) {
      return t('expiresInHours', { hours: diffHours });
    } else {
      return t('expiresSoon');
    }
  };

  const handleToggleExpand = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setIsLoadingOtherSessions(true);

      // TODO: Quando a rota estiver pronta, fazer:
      // try {
      //   const response = await fetch('/api/v1/sessions');
      //   const data = await response.json();
      //   setOtherSessions(data.revoked || []);
      // } catch (error) {
      //   console.error('Error fetching sessions:', error);
      // } finally {
      //   setIsLoadingOtherSessions(false);
      // }

      // Por enquanto, simular que não há outras sessões
      setTimeout(() => {
        setIsLoadingOtherSessions(false);
      }, 500);
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
            <DeviceIcon />
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

          <div className="flex items-center gap-2 text-sm text-white/70">
            <Clock size={16} className="text-white/40" />
            <span>{t('expires')}:</span>
            <span className="text-white font-medium">{getExpirationTime()}</span>
          </div>

          {deviceInfo.screenResolution && (
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Monitor size={16} className="text-white/40" />
              <span>{t('resolution')}:</span>
              <span className="text-white font-medium">{deviceInfo.screenResolution}</span>
            </div>
          )}
        </div>
      </div>

      {/* Botão Ver Outras Sessões */}
      <button
        onClick={handleToggleExpand}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
      >
        <span className="text-white text-sm font-medium">
          {isExpanded ? t('hideOtherSessions') : t('viewOtherSessions')}
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
          ) : (
            <div className="text-center py-8">
              <Shield size={48} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/60 text-sm mb-2">{t('noOtherSessions')}</p>
              <p className="text-white/40 text-xs">{t('onlyOneSessionAllowed')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
