'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';
import { useLiveSessionJoin } from '@/hooks/useLiveSessionJoin';
import { Users, Clock, Calendar, Play, CheckCircle, Loader2, Radio, X, UserCheck, Video } from 'lucide-react';
import AccessibleRecordingLessons from '@/components/AccessibleRecordingLessons';
import MyStudentSessionsList from '@/components/MyStudentSessionsList';
import MyPersonalRecordingsList from '@/components/MyPersonalRecordingsList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

// API interfaces matching backend response
interface Host {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

interface CoHost {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
}

interface Argument {
  id: string;
  title: string;
  slug: string;
}

interface Settings {
  maxParticipants: number;
  recordingEnabled: boolean;
  waitingRoomEnabled: boolean;
  chatEnabled: boolean;
  qnaEnabled: boolean;
  autoStartRecording: boolean;
  muteParticipantsOnEntry: boolean;
  allowParticipantsUnmute: boolean;
  allowRaiseHand: boolean;
  allowParticipantScreenShare: boolean;
}

interface LiveSessionAPI {
  id: string;
  title: string;
  description?: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  sessionType: 'MEETING' | 'WEBINAR';
  host: Host;
  coHosts?: CoHost[];
  lesson?: Lesson;
  argument?: Argument;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  settings: Settings;
  joinUrl?: string;
  passcode?: string;
  participantCount?: number;
  recordingAvailable: boolean;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface LiveSessionsResponse {
  sessions: LiveSessionAPI[];
  meta: PaginationMeta;
}

interface Course {
  id: string;
  slug: string;
}

interface Module {
  id: string;
  slug: string;
}

interface LiveSessionsProps {
  locale: string;
  courses: Course[];
  modules: Module[];
}

export default function LiveSessions({ locale, courses, modules }: LiveSessionsProps) {
  const t = useTranslations('LiveSessions');
  const { toast } = useToast();
  const { token } = useAuth();
  const { generateToken, joinWithToken, isGenerating, isJoining } = useLiveSessionJoin();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<LiveSessionAPI[]>([]);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [joiningSession, setJoiningSession] = useState<string | null>(null);

  // Debug: Log environment variables
  console.log('🌍 [LiveSessions] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

  // Fetch sessions from API
  const fetchSessions = useCallback(async () => {
    if (!token) {
      console.log('No token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // Fetch all sessions with pagination
      const response = await fetch(`${API_URL}/api/v1/live-sessions?page=1&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data: LiveSessionsResponse = await response.json();
      console.log('Fetched live sessions from API:', data);

      // Set sessions from API response
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions from API:', error);
      toast({
        title: t('error.loadTitle'),
        description: t('error.loadDescription'),
        variant: 'destructive',
      });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [token, t, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleJoinSession = async (sessionId: string) => {
    console.log('🖱️ [LiveSessions] CLICK DETECTADO! sessionId:', sessionId);

    setJoiningSession(sessionId);

    // Debug: Log session details
    const session = sessions.find(s => s.id === sessionId);
    console.log('🔐 [LiveSessions] Iniciando fluxo de entrada na sessão:', sessionId);
    console.log('📋 [LiveSessions] Detalhes da sessão:', {
      id: session?.id,
      title: session?.title,
      status: session?.status,
      lesson: session?.lesson,
      argument: session?.argument,
    });

    // Step 1: Generate JWT token
    const tokenResponse = await generateToken(sessionId);
    console.log('🔐 [LiveSessions] Token gerado:', tokenResponse);

    if (!tokenResponse) {
      console.error('❌ [LiveSessions] Falha ao gerar token');
      console.error('❌ [LiveSessions] SessionId enviado:', sessionId);
      console.error('❌ [LiveSessions] Sessão existe na lista?', !!session);
      setJoiningSession(null);
      return;
    }

    console.log('✅ [LiveSessions] Token gerado, iniciando validação e redirecionamento');

    // Step 2: Validate token and redirect to Zoom
    await joinWithToken(tokenResponse.joinUrl);

    setJoiningSession(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale === 'it' ? 'it-IT' : 'es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      LIVE: 'live',
      SCHEDULED: 'scheduled',
      ENDED: 'ended',
      CANCELLED: 'cancelled',
      live: 'live',
      scheduled: 'scheduled',
      ended: 'ended',
      cancelled: 'cancelled',
    };

    const mappedStatus = statusMap[status as keyof typeof statusMap] || status;

    switch (mappedStatus) {
      case 'live':
        return (
          <Badge className="bg-red-500 text-white animate-pulse">
            <Radio className="mr-1 h-3 w-3" />
            {t('status.live')}
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="secondary">
            <Calendar className="mr-1 h-3 w-3" />
            {t('status.scheduled')}
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="outline" className="text-gray-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t('status.ended')}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <X className="mr-1 h-3 w-3" />
            {t('status.cancelled')}
          </Badge>
        );
      default:
        return null;
    }
  };

  // Convert API sessions to display format
  const displaySessions = sessions.map(session => {
    return {
      id: session.id,
      title: session.title,
      description: session.description || '',
      topic: session.lesson?.title || session.argument?.title || 'Geral',
      instructor: {
        id: session.host.id,
        name: session.host.fullName || 'Host',
        specialty: session.host.email,
      },
      scheduledAt: session.scheduledStartTime,
      endTime: session.scheduledEndTime,
      status: session.status.toLowerCase(),
      joinUrl: session.joinUrl,
      recordingUrl: session.recordingUrl || (session.recordingAvailable ? '#' : undefined),
      participantsCount: session.participantCount || 0,
      maxParticipants: session.settings?.maxParticipants || 100,
      isRegistered: false, // Would need API endpoint
    };
  });

  interface DisplaySession {
    id: string;
    title: string;
    description: string;
    topic: string;
    instructor: {
      id: string;
      name: string;
      specialty: string;
    };
    scheduledAt: string;
    endTime: string;
    status: string;
    joinUrl?: string;
    recordingUrl?: string;
    participantsCount: number;
    maxParticipants: number;
    isRegistered?: boolean;
  }

  const upcomingSessions = displaySessions.filter(
    (s: DisplaySession) => s.status === 'scheduled' || s.status === 'SCHEDULED'
  );
  const liveSessions = displaySessions.filter((s: DisplaySession) => s.status === 'live' || s.status === 'LIVE');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-secondary mx-auto mb-4" />
          <p className="text-gray-400">Carregando sessões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sessions Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex w-max sm:w-full sm:grid sm:grid-cols-3 bg-white/5 border border-white/10 p-1 gap-1 min-w-full">
            <TabsTrigger
              value="upcoming"
              className="flex-1 sm:flex-none relative data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{t('upcoming')}</span>
              {upcomingSessions.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-blue-500 text-white text-[10px] sm:text-xs px-1">
                  {upcomingSessions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="live"
              className="flex-1 sm:flex-none relative data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              <Radio className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{t('live')}</span>
              {liveSessions.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-red-500 text-white animate-pulse text-[10px] sm:text-xs px-1">
                  {liveSessions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="allSessions"
              className="flex-1 sm:flex-none data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              <Radio className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{t('allSessions')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Upcoming Sessions */}
        <TabsContent value="upcoming" className="space-y-8">
          {/* Group Sessions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Users size={20} className="text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{t('personalSessions.groupSessions')}</h2>
                <p className="text-sm text-white/60">{t('personalSessions.groupSessionsDescription')}</p>
              </div>
            </div>

            {upcomingSessions.length === 0 ? (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-white">{t('noUpcoming')}</h3>
                  <p className="text-white/60">{t('noUpcomingDescription')}</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {upcomingSessions.map((session: DisplaySession, index: number) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div
                      className="relative bg-white/5 rounded-xl overflow-hidden border-l-[8px] border-secondary hover:border-l-[10px] hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-500 hover:-translate-y-1 group"
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
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>

                      <div className="p-6">
                        {/* Header with badges */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            {getStatusBadge(session.status)}
                            <Badge variant="outline" className="bg-white/5 border-white/20">{session.topic}</Badge>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight tracking-tight group-hover:text-secondary transition-colors duration-300">
                          {session.title}
                        </h3>

                        {/* Divider Line with Dot */}
                        <div className="relative my-4">
                          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-secondary/40 transition-colors duration-300"></div>
                          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-secondary/40 rounded-full group-hover:scale-150 group-hover:bg-secondary transition-all duration-300"></div>
                        </div>

                        {/* Description */}
                        {session.description && (
                          <p className="text-white/70 mb-6 line-clamp-2 leading-relaxed">{session.description}</p>
                        )}

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {/* Instructor */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors duration-300">
                              <Users size={18} className="text-secondary" />
                            </div>
                            <div>
                              <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('instructor')}</p>
                              <p className="text-sm font-semibold text-white">{session.instructor.name}</p>
                            </div>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors duration-300">
                              <Clock size={18} className="text-secondary" />
                            </div>
                            <div>
                              <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('duration')}</p>
                              <p className="text-sm font-semibold text-white">{formatDuration(session.scheduledAt, session.endTime)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Scheduled Date */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                              <Calendar size={14} className="text-white/60" />
                            </div>
                            <div>
                              <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('scheduledFor')}</p>
                              <p className="text-sm font-medium text-white/90">{formatDate(session.scheduledAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hover Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                      {/* Hover Ring */}
                      <div className="absolute inset-0 rounded-xl ring-1 ring-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Glow Effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-secondary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Individual Sessions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <UserCheck size={20} className="text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{t('personalSessions.title')}</h2>
                <p className="text-sm text-white/60">{t('personalSessions.description')}</p>
              </div>
            </div>

            <MyStudentSessionsList locale={locale} showOnlyUpcoming={true} />
          </div>
        </TabsContent>

        {/* Live Sessions */}
        <TabsContent value="live" className="space-y-4">
          {liveSessions.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="text-center py-12">
                <Radio className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">{t('noLive')}</h3>
                <p className="text-white/60">{t('noLiveDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {liveSessions.map((session: DisplaySession, index: number) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className="relative bg-white/5 rounded-xl overflow-hidden border-l-[8px] border-red-500 hover:border-l-[12px] hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-500 hover:-translate-y-1 group animate-pulse-subtle"
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.08) 1px, transparent 1px),
                        radial-gradient(circle at 80% 80%, rgba(220, 38, 38, 0.08) 1px, transparent 1px),
                        radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.04) 0.8px, transparent 0.8px)
                      `,
                      backgroundSize: '20px 20px, 18px 18px, 30px 30px',
                      backgroundPosition: '0 0, 10px 10px, 5px 5px'
                    }}
                  >
                    {/* Top gradient line with pulse */}
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-pulse"></div>

                    {/* Live indicator badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider">AO VIVO</span>
                    </div>

                    <div className="p-6">
                      {/* Header with badges */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          {getStatusBadge(session.status)}
                          <Badge variant="outline" className="bg-white/5 border-white/20">{session.topic}</Badge>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight tracking-tight group-hover:text-red-400 transition-colors duration-300">
                        {session.title}
                      </h3>

                      {/* Divider Line with Dot */}
                      <div className="relative my-4">
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-red-500/40 transition-colors duration-300"></div>
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500/40 rounded-full group-hover:scale-150 group-hover:bg-red-500 transition-all duration-300 animate-pulse"></div>
                      </div>

                      {/* Description */}
                      {session.description && (
                        <p className="text-white/70 mb-6 line-clamp-2 leading-relaxed">{session.description}</p>
                      )}

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Instructor */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors duration-300">
                            <Users size={18} className="text-red-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('instructor')}</p>
                            <p className="text-sm font-semibold text-white">{session.instructor.name}</p>
                          </div>
                        </div>

                        {/* End Time */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors duration-300">
                            <Clock size={18} className="text-red-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('endTime')}</p>
                            <p className="text-sm font-semibold text-white">{new Date(session.endTime).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Join Button */}
                      <div className="flex items-center justify-end pt-4 border-t border-white/10">
                        <Button
                          className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300"
                          onClick={() => {
                            console.log('🔴 [LiveSessions] onClick triggered! session.id:', session.id);
                            handleJoinSession(session.id);
                          }}
                          disabled={joiningSession === session.id || isGenerating || isJoining}
                        >
                          {joiningSession === session.id || isGenerating || isJoining ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('joining')}
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              {t('joinNow')}
                            </>
                            )}
                        </Button>
                      </div>
                    </div>

                    {/* Hover Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    {/* Hover Ring */}
                    <div className="absolute inset-0 rounded-xl ring-1 ring-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Glow Effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        {/* All Recordings */}
        <TabsContent value="allSessions" className="space-y-8">
          {/* Group Recordings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-secondary/20 rounded-lg">
                <Users size={20} className="text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{t('personalRecordings.groupRecordings')}</h2>
                <p className="text-sm text-white/60">{t('personalRecordings.groupRecordingsDescription')}</p>
              </div>
            </div>

            <AccessibleRecordingLessons locale={locale} courses={courses} modules={modules} />
          </div>

          {/* Individual Recordings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Video size={20} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{t('personalRecordings.title')}</h2>
                <p className="text-sm text-white/60">{t('personalRecordings.description')}</p>
              </div>
            </div>

            <MyPersonalRecordingsList locale={locale} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
