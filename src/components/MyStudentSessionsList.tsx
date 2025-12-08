'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  AlertCircle,
  Loader2,
  Video,
  UserCheck,
  Clock,
  Radio,
  User,
  Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface MySessionHost {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
}

interface MySessionSettings {
  recordingEnabled: boolean;
  waitingRoomEnabled: boolean;
  chatEnabled: boolean;
  autoStartRecording: boolean;
}

interface MySession {
  id: string;
  title: string;
  description: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  host: MySessionHost;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  zoomMeetingId: string | null;
  participantJoinUrl: string | null;
  hasRecording: boolean;
  settings: MySessionSettings;
  createdAt: string;
  updatedAt: string;
}

interface MyStudentSessionsListProps {
  locale: string;
  showOnlyUpcoming?: boolean;
}

export default function MyStudentSessionsList({ locale, showOnlyUpcoming = false }: MyStudentSessionsListProps) {
  const t = useTranslations('LiveSessions.personalSessions');
  const { toast } = useToast();
  const { token } = useAuth();

  const [sessions, setSessions] = useState<MySession[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-refresh interval for live sessions (every 30 seconds)
  const REFRESH_INTERVAL = 30000;

  const fetchSessions = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const searchParams = new URLSearchParams();
      searchParams.append('page', '1');
      searchParams.append('limit', '20');

      if (showOnlyUpcoming) {
        searchParams.append('status', 'SCHEDULED,LIVE');
      }

      const response = await fetch(
        `${API_URL}/api/v1/personal-sessions/my-sessions?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching student sessions:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [token, showOnlyUpcoming, t, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-refresh when there are LIVE sessions to catch status changes
  useEffect(() => {
    const hasLiveSessions = sessions.some(s => s.status === 'LIVE');

    if (hasLiveSessions && token) {
      console.log('[MyStudentSessionsList] 🔄 Starting auto-refresh for live sessions');
      const intervalId = setInterval(() => {
        console.log('[MyStudentSessionsList] 🔄 Auto-refreshing sessions...');
        fetchSessions();
      }, REFRESH_INTERVAL);

      return () => {
        console.log('[MyStudentSessionsList] 🛑 Stopping auto-refresh');
        clearInterval(intervalId);
      };
    }
  }, [sessions, token, fetchSessions, REFRESH_INTERVAL]);

  const getStatusBadge = (status: MySession['status']) => {
    const statusConfig = {
      SCHEDULED: {
        label: t('status.scheduled'),
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Clock,
      },
      LIVE: {
        label: t('status.live'),
        className: 'bg-red-500 text-white animate-pulse',
        icon: Radio,
      },
      ENDED: {
        label: t('status.ended'),
        className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: Video,
      },
      CANCELLED: {
        label: t('status.cancelled'),
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertCircle,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon size={12} />
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const localeMap = {
      pt: ptBR,
      it: it,
      es: es,
    };
    const dateLocale = localeMap[locale as keyof typeof localeMap] || ptBR;

    return format(date, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: dateLocale });
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const handleJoinSession = (session: MySession) => {
    console.log('🔗 [MyStudentSessionsList] Attempting to join session:', {
      sessionId: session.id,
      status: session.status,
      participantJoinUrl: session.participantJoinUrl,
    });

    // Validate session status before joining
    if (session.status !== 'SCHEDULED' && session.status !== 'LIVE') {
      console.error('❌ [MyStudentSessionsList] Cannot join session with status:', session.status);
      toast({
        title: t('error.unavailableTitle'),
        description: session.status === 'ENDED'
          ? t('error.sessionEndedDescription')
          : t('error.unavailableDescription'),
        variant: 'destructive',
      });
      // Refresh the list to get updated statuses
      fetchSessions();
      return;
    }

    // PersonalSessions use participantJoinUrl directly (no token generation needed)
    if (!session.participantJoinUrl || session.participantJoinUrl.trim() === '') {
      console.error('❌ [MyStudentSessionsList] No participantJoinUrl available');
      toast({
        title: t('error.joinTitle'),
        description: t('error.noUrlDescription'),
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ [MyStudentSessionsList] Redirecting to Zoom:', session.participantJoinUrl);

    // Show success toast
    toast({
      title: t('success.joiningTitle'),
      description: t('success.joiningDescription', { title: session.title }),
    });

    // Open Zoom URL directly
    window.open(session.participantJoinUrl, '_blank', 'noopener,noreferrer');
  };

  // Filter sessions based on showOnlyUpcoming
  const displaySessions = showOnlyUpcoming
    ? sessions.filter((s) => s.status === 'SCHEDULED' || s.status === 'LIVE')
    : sessions;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        <span className="ml-2 text-white/60">{t('loading')}</span>
      </div>
    );
  }

  if (displaySessions.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="text-center py-8">
          <UserCheck className="h-12 w-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-white">{t('noSessions')}</h3>
          <p className="text-white/60">{t('noSessionsDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {displaySessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={`relative bg-white/5 rounded-xl overflow-hidden border-l-[8px] ${
                session.status === 'LIVE'
                  ? 'border-red-500 hover:border-l-[12px] hover:shadow-2xl hover:shadow-red-500/30'
                  : 'border-secondary hover:border-l-[10px] hover:shadow-2xl hover:shadow-secondary/20'
              } transition-all duration-500 hover:-translate-y-1 group`}
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 20%, rgba(56, 135, 166, 0.08) 1px, transparent 1px),
                  radial-gradient(circle at 80% 80%, rgba(12, 53, 89, 0.08) 1px, transparent 1px),
                  radial-gradient(circle at 50% 50%, rgba(56, 135, 166, 0.04) 0.8px, transparent 0.8px)
                `,
                backgroundSize: '20px 20px, 18px 18px, 30px 30px',
                backgroundPosition: '0 0, 10px 10px, 5px 5px'
              }}
            >
              {/* Top gradient line */}
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent ${
                session.status === 'LIVE' ? 'via-red-500/50' : 'via-secondary/30'
              } to-transparent ${session.status === 'LIVE' ? 'animate-pulse' : ''}`}></div>

              {/* Live indicator badge */}
              {session.status === 'LIVE' && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{t('status.live')}</span>
                </div>
              )}

              <div className="p-6">
                {/* Header with badges */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {getStatusBadge(session.status)}
                    <Badge variant="outline" className="bg-secondary/10 border-secondary/30 text-secondary">
                      <UserCheck size={12} className="mr-1" />
                      {t('individualSession')}
                    </Badge>
                    {session.hasRecording && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <Video size={12} className="mr-1" />
                        {t('hasRecording')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className={`text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight tracking-tight ${
                  session.status === 'LIVE' ? 'group-hover:text-red-400' : 'group-hover:text-secondary'
                } transition-colors duration-300`}>
                  {session.title}
                </h3>

                {/* Divider Line with Dot */}
                <div className="relative my-4">
                  <div className={`h-px bg-gradient-to-r from-transparent via-white/20 to-transparent ${
                    session.status === 'LIVE' ? 'group-hover:via-red-500/40' : 'group-hover:via-secondary/40'
                  } transition-colors duration-300`}></div>
                  <div className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 ${
                    session.status === 'LIVE' ? 'bg-red-500/40 group-hover:bg-red-500' : 'bg-secondary/40 group-hover:bg-secondary'
                  } rounded-full group-hover:scale-150 transition-all duration-300 ${session.status === 'LIVE' ? 'animate-pulse' : ''}`}></div>
                </div>

                {/* Description */}
                {session.description && (
                  <p className="text-white/70 mb-6 line-clamp-2 leading-relaxed">{session.description}</p>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Host/Tutor */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ${
                      session.status === 'LIVE' ? 'group-hover:bg-red-500/20' : 'group-hover:bg-secondary/20'
                    } transition-colors duration-300`}>
                      <User size={18} className={session.status === 'LIVE' ? 'text-red-400' : 'text-secondary'} />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('tutor')}</p>
                      <p className="text-sm font-semibold text-white">{session.host.fullName}</p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ${
                      session.status === 'LIVE' ? 'group-hover:bg-red-500/20' : 'group-hover:bg-secondary/20'
                    } transition-colors duration-300`}>
                      <Clock size={18} className={session.status === 'LIVE' ? 'text-red-400' : 'text-secondary'} />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('duration')}</p>
                      <p className="text-sm font-semibold text-white">{formatDuration(session.scheduledStartTime, session.scheduledEndTime)}</p>
                    </div>
                  </div>
                </div>

                {/* Scheduled Date and Join Button */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <Calendar size={14} className="text-white/60" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('scheduledFor')}</p>
                      <p className="text-sm font-medium text-white/90">{formatDateTime(session.scheduledStartTime)}</p>
                    </div>
                  </div>

                  {/* Join Button for SCHEDULED or LIVE sessions */}
                  {(session.status === 'SCHEDULED' || session.status === 'LIVE') && (
                    <Button
                      className={`${
                        session.status === 'LIVE'
                          ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/40'
                          : 'bg-secondary hover:bg-secondary/80 shadow-lg shadow-secondary/20 hover:shadow-secondary/40'
                      } text-white font-bold px-6 py-2.5 rounded-lg transition-all duration-300 z-10 relative`}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🔴 [MyStudentSessionsList] CLICK no botão! session:', session.id, session.status);
                        handleJoinSession(session);
                      }}
                    >
                      {session.status === 'LIVE' ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          {t('joinNow')}
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          {t('joinSession')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Hover Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${
                session.status === 'LIVE'
                  ? 'from-red-500/5 via-transparent to-red-500/10'
                  : 'from-secondary/5 via-transparent to-secondary/10'
              } opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

              {/* Hover Ring */}
              <div className={`absolute inset-0 rounded-xl ring-1 ${
                session.status === 'LIVE' ? 'ring-red-500/20' : 'ring-secondary/20'
              } opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
