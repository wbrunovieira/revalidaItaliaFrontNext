'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';
import {
  Users,
  Clock,
  Calendar,
  CheckCircle,
  Loader2,
  Radio,
  PlayCircle,
  AlertCircle,
  Database,
  Cloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// API interfaces
interface Host {
  id: string;
  fullName: string;
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
  coHosts?: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }>;
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

interface LiveSessionsWithAPIProps {
  locale: string;
}

export default function LiveSessionsWithAPI({ locale }: LiveSessionsWithAPIProps) {
  const t = useTranslations('LiveSessions');
  const { toast } = useToast();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<LiveSessionAPI[]>([]);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch real data from API
  const fetchSessions = useCallback(async () => {
    if (!token) {
      setApiError('No authentication token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setApiError(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      const response = await fetch(
        `${API_URL}/api/v1/live-sessions?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        setApiError(`API Error: ${response.status}`);
        return;
      }

      const data: LiveSessionsResponse = await response.json();
      console.log('API Response:', data);
      
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === 'pt' ? 'pt-BR' : locale === 'it' ? 'it-IT' : 'es-ES',
      {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}min` : ''}` : `${mins}min`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return (
          <Badge className="bg-red-500 text-white animate-pulse">
            <Radio className="mr-1 h-3 w-3" />
            Ao Vivo
          </Badge>
        );
      case 'SCHEDULED':
        return (
          <Badge className="bg-blue-500 text-white">
            <Calendar className="mr-1 h-3 w-3" />
            Agendada
          </Badge>
        );
      case 'ENDED':
        return (
          <Badge variant="outline" className="text-gray-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Finalizada
          </Badge>
        );
      default:
        return null;
    }
  };

  // Filter sessions by status
  const upcomingSessions = sessions.filter(s => s.status === 'SCHEDULED');
  const liveSessions = sessions.filter(s => s.status === 'LIVE');
  const recordedSessions = sessions.filter(s => s.status === 'ENDED' && (s.recordingUrl || s.recordingAvailable));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Carregando sessões da API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* API Status Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Sessões da API Real</h3>
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            {sessions.length} sessões
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchSessions}
          className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Recarregar
        </Button>
      </div>

      {/* Error Alert */}
      {apiError && (
        <Alert className="bg-red-500/10 border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertTitle>Erro ao carregar sessões</AlertTitle>
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}

      {/* Sessions Tabs */}
      {sessions.length > 0 ? (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 p-1">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Calendar className="mr-2 h-4 w-4" />
              Próximas ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Radio className="mr-2 h-4 w-4" />
              Ao Vivo ({liveSessions.length})
            </TabsTrigger>
            <TabsTrigger value="recorded" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <PlayCircle className="mr-2 h-4 w-4" />
              Gravadas ({recordedSessions.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Sessions */}
          <TabsContent value="upcoming" className="space-y-3">
            {upcomingSessions.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="text-center py-8">
                  <Calendar className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Nenhuma sessão agendada</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {upcomingSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(session.status)}
                              {session.lesson && (
                                <Badge variant="outline" className="text-gray-400">
                                  {session.lesson.title}
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-1">{session.title}</h4>
                            {session.description && (
                              <p className="text-gray-400 text-sm mb-3">{session.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {session.host.fullName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(session.scheduledStartTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(session.scheduledStartTime, session.scheduledEndTime)}
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
          <TabsContent value="live" className="space-y-3">
            {liveSessions.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="text-center py-8">
                  <Radio className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Nenhuma sessão ao vivo</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {liveSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-gray-800/50 border-red-500/50 shadow-lg shadow-red-500/10">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(session.status)}
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-1">{session.title}</h4>
                            {session.description && (
                              <p className="text-gray-400 text-sm mb-3">{session.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {session.host.fullName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Termina às {new Date(session.scheduledEndTime).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          {session.joinUrl && (
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => window.open(session.joinUrl, '_blank')}
                            >
                              Entrar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Recorded Sessions */}
          <TabsContent value="recorded" className="space-y-3">
            {recordedSessions.length === 0 ? (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="text-center py-8">
                  <PlayCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Nenhuma gravação disponível</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {recordedSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700 hover:border-green-500/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(session.status)}
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                Gravação disponível
                              </Badge>
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-1">{session.title}</h4>
                            {session.description && (
                              <p className="text-gray-400 text-sm mb-3">{session.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {session.host.fullName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(session.scheduledStartTime)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setViewingSession(session.id)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {session.recordingUrl && (
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white"
                                onClick={() => window.open(session.recordingUrl, '_blank')}
                              >
                                <PlayCircle className="h-4 w-4 mr-1" />
                                Assistir
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        !apiError && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="text-center py-12">
              <Database className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhuma sessão encontrada</h3>
              <p className="text-gray-400">Não há sessões disponíveis no momento.</p>
            </CardContent>
          </Card>
        )
      )}

    </div>
  );
}