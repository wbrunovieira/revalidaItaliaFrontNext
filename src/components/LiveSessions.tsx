'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';
import { useLiveSessionJoin } from '@/hooks/useLiveSessionJoin';
import { Users, Clock, Calendar, Play, CheckCircle, Loader2, Filter, Search, Radio, PlayCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import RecordingsList from '@/components/RecordingsList';

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

interface LiveSessionsProps {
  locale: string;
}

export default function LiveSessions({ locale }: LiveSessionsProps) {
  const t = useTranslations('LiveSessions');
  const { toast } = useToast();
  const { token } = useAuth();
  const { generateToken, joinWithToken, isGenerating, isJoining } = useLiveSessionJoin();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<LiveSessionAPI[]>([]);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');
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

  const handleWatchRecording = (recordingUrl: string) => {
    console.log(`Opening recording: ${recordingUrl}`);
    window.open(recordingUrl, '_blank');
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

  const getFilteredSessions = (sessionList: DisplaySession[]) => {
    return sessionList.filter(session => {
      const matchesSearch =
        searchTerm === '' ||
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.instructor.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTopic = filterTopic === 'all' || session.topic === filterTopic;

      return matchesSearch && matchesTopic;
    });
  };

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
      {/* Search and Filters */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar sessões..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterTopic}
                onChange={e => setFilterTopic(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-background"
              >
                <option value="all">{t('filters.all')}</option>
                <option value="Anatomia">Anatomia</option>
                <option value="Farmacologia">Farmacologia</option>
                <option value="Pediatria">Pediatria</option>
                <option value="Emergência">Emergência</option>
                <option value="Geral">Geral</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex w-max sm:w-full sm:grid sm:grid-cols-3 bg-gray-800 p-1 gap-1 min-w-full">
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
              value="allRecordings"
              className="flex-1 sm:flex-none data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all text-xs sm:text-sm px-3 py-2 whitespace-nowrap"
            >
              <PlayCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{t('allRecordings')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Upcoming Sessions */}
        <TabsContent value="upcoming" className="space-y-4">
          {getFilteredSessions(upcomingSessions).length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noUpcoming')}</h3>
                <p className="text-gray-500">{t('noUpcomingDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {getFilteredSessions(upcomingSessions).map((session: DisplaySession, index: number) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-secondary/20 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getStatusBadge(session.status)}
                            <Badge variant="outline">{session.topic}</Badge>
                          </div>

                          <h3 className="text-xl font-semibold mb-2 text-white">{session.title}</h3>
                          <p className="text-gray-400 mb-4">{session.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>
                                {t('instructor')}: <strong>{session.instructor.name}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>
                                {t('duration')}: <strong>{formatDuration(session.scheduledAt, session.endTime)}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {t('scheduledFor')}: {formatDate(session.scheduledAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        {/* Live Sessions */}
        <TabsContent value="live" className="space-y-4">
          {getFilteredSessions(liveSessions).length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">{t('noLive')}</h3>
                <p className="text-gray-400">{t('noLiveDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {getFilteredSessions(liveSessions).map((session: DisplaySession, index: number) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-gray-800 border-red-500/50 shadow-lg shadow-red-500/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getStatusBadge(session.status)}
                            <Badge variant="outline">{session.topic}</Badge>
                          </div>

                          <h3 className="text-xl font-semibold mb-2 text-white">{session.title}</h3>
                          <p className="text-gray-400 mb-4">{session.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>
                                {t('instructor')}: <strong>{session.instructor.name}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>
                                {t('endTime')}: {new Date(session.endTime).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          className="bg-red-500 hover:bg-red-600 text-white animate-pulse"
                          onClick={() => handleJoinSession(session.id)}
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
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>

        {/* All Recordings from API */}
        <TabsContent value="allRecordings" className="space-y-4">
          <RecordingsList locale={locale} translations={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
