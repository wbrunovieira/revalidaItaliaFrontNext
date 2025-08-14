'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Clock,
  Calendar,
  Play,
  CheckCircle,
  Loader2,
  Filter,
  Search,
  Sparkles,
  Radio,
  PlayCircle,
  UserCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface Instructor {
  id: string;
  name: string;
  avatarUrl?: string;
  specialty: string;
}

interface LiveSession {
  id: string;
  title: string;
  description: string;
  topic: string;
  instructor: Instructor;
  scheduledAt: string;
  endTime: string;
  duration: number; // in minutes
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  recordingUrl?: string;
  participantsCount: number;
  maxParticipants: number;
  isRegistered?: boolean;
}

interface LiveSessionsProps {
  locale: string;
}

export default function LiveSessions({ locale }: LiveSessionsProps) {
  const t = useTranslations('LiveSessions');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');
  const [joiningSession, setJoiningSession] = useState<string | null>(null);
  const [registeringSession, setRegisteringSession] = useState<string | null>(null);

  // Mock data for demonstration
  const mockSessions: LiveSession[] = [
    {
      id: '1',
      title: 'Revisão de Anatomia Cardiovascular',
      description: 'Sessão completa sobre anatomia e fisiologia do sistema cardiovascular para o Revalida',
      topic: 'Anatomia',
      instructor: {
        id: '1',
        name: 'Dr. Marco Rossi',
        specialty: 'Cardiologia',
      },
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      duration: 60,
      status: 'scheduled',
      zoomMeetingId: '123456789',
      zoomJoinUrl: 'https://zoom.us/j/123456789',
      participantsCount: 15,
      maxParticipants: 50,
      isRegistered: true,
    },
    {
      id: '2',
      title: 'Farmacologia Aplicada',
      description: 'Principais classes de medicamentos e suas aplicações clínicas',
      topic: 'Farmacologia',
      instructor: {
        id: '2',
        name: 'Dra. Giulia Bianchi',
        specialty: 'Farmacologia Clínica',
      },
      scheduledAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Started 30 min ago
      endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      duration: 60,
      status: 'live',
      zoomMeetingId: '987654321',
      zoomJoinUrl: 'https://zoom.us/j/987654321',
      participantsCount: 32,
      maxParticipants: 50,
      isRegistered: true,
    },
    {
      id: '3',
      title: 'Casos Clínicos em Pediatria',
      description: 'Discussão de casos clínicos comuns em pediatria',
      topic: 'Pediatria',
      instructor: {
        id: '3',
        name: 'Dr. Luigi Ferrari',
        specialty: 'Pediatria',
      },
      scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
      duration: 90,
      status: 'ended',
      recordingUrl: 'https://zoom.us/rec/123',
      participantsCount: 45,
      maxParticipants: 50,
    },
    {
      id: '4',
      title: 'Emergências Médicas',
      description: 'Protocolo de atendimento em situações de emergência',
      topic: 'Emergência',
      instructor: {
        id: '4',
        name: 'Dra. Sofia Romano',
        specialty: 'Medicina de Emergência',
      },
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(),
      duration: 120,
      status: 'scheduled',
      zoomMeetingId: '456789123',
      zoomJoinUrl: 'https://zoom.us/j/456789123',
      participantsCount: 8,
      maxParticipants: 50,
      isRegistered: false,
    },
  ];

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would be an actual API call
      console.log('Fetching live sessions from API...');
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: t('error.loadTitle'),
        description: t('error.loadDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleJoinSession = async (sessionId: string) => {
    setJoiningSession(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session?.zoomJoinUrl) {
      toast({
        title: t('error.joinTitle'),
        description: t('error.joinDescription'),
        variant: 'destructive',
      });
      setJoiningSession(null);
      return;
    }

    // Mock joining session
    console.log(`Joining Zoom session: ${session.zoomJoinUrl}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would open the Zoom meeting
    window.open(session.zoomJoinUrl, '_blank');
    
    toast({
      title: 'Entrando na sessão',
      description: `Você está sendo redirecionado para a sessão ao vivo`,
    });
    
    setJoiningSession(null);
  };

  const handleWatchRecording = (recordingUrl: string) => {
    console.log(`Opening recording: ${recordingUrl}`);
    // In production, this would open the recording player
    window.open(recordingUrl, '_blank');
  };

  const handleRegister = async (sessionId: string) => {
    setRegisteringSession(sessionId);
    
    try {
      // Simulate API call
      console.log(`Registering for session: ${sessionId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setSessions(prev =>
        prev.map(s =>
          s.id === sessionId
            ? { ...s, isRegistered: true, participantsCount: s.participantsCount + 1 }
            : s
        )
      );
      
      toast({
        title: 'Inscrição realizada!',
        description: 'Você foi inscrito na sessão com sucesso',
      });
    } catch (error) {
      console.error('Error registering:', error);
      toast({
        title: t('error.registerTitle'),
        description: t('error.registerDescription'),
        variant: 'destructive',
      });
    } finally {
      setRegisteringSession(null);
    }
  };

  const handleUnregister = async (sessionId: string) => {
    try {
      // Simulate API call
      console.log(`Unregistering from session: ${sessionId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setSessions(prev =>
        prev.map(s =>
          s.id === sessionId
            ? { ...s, isRegistered: false, participantsCount: Math.max(0, s.participantsCount - 1) }
            : s
        )
      );
      
      toast({
        title: 'Inscrição cancelada',
        description: 'Sua inscrição foi cancelada',
      });
    } catch (error) {
      console.error('Error unregistering:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === 'pt' ? 'pt-BR' : locale === 'it' ? 'it-IT' : 'es-ES',
      {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  // Filter sessions
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const liveSessions = sessions.filter(s => s.status === 'live');
  const recordedSessions = sessions.filter(s => s.status === 'ended' && s.recordingUrl);

  const getFilteredSessions = (sessionList: LiveSession[]) => {
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-background"
              >
                <option value="all">{t('filters.all')}</option>
                <option value="Anatomia">Anatomia</option>
                <option value="Farmacologia">Farmacologia</option>
                <option value="Pediatria">Pediatria</option>
                <option value="Emergência">Emergência</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 p-1">
          <TabsTrigger value="upcoming" className="relative data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all">
            <Calendar className="mr-2 h-4 w-4" />
            {t('upcoming')}
            {upcomingSessions.length > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white">
                {upcomingSessions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="live" className="relative data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all">
            <Radio className="mr-2 h-4 w-4" />
            {t('live')}
            {liveSessions.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white animate-pulse">
                {liveSessions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recorded" className="data-[state=active]:bg-secondary data-[state=active]:text-primary data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-white transition-all">
            <PlayCircle className="mr-2 h-4 w-4" />
            {t('recorded')}
            {recordedSessions.length > 0 && (
              <Badge className="ml-2 bg-gray-600 text-white">
                {recordedSessions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

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
              {getFilteredSessions(upcomingSessions).map((session, index) => (
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
                            {session.isRegistered && (
                              <Badge className="bg-green-500 text-white">
                                <UserCheck className="mr-1 h-3 w-3" />
                                {t('registered')}
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-semibold mb-2 text-white">{session.title}</h3>
                          <p className="text-gray-400 mb-4">
                            {session.description}
                          </p>

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
                                {t('duration')}: <strong>{formatDuration(session.duration)}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>
                                {session.participantsCount}/{session.maxParticipants} {t('participants')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>{t('scheduledFor')}: {formatDate(session.scheduledAt)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {session.isRegistered ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnregister(session.id)}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              {t('unregister')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleRegister(session.id)}
                              disabled={registeringSession === session.id}
                              className="bg-secondary text-primary hover:bg-secondary/90"
                            >
                              {registeringSession === session.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  {t('registering')}
                                </>
                              ) : (
                                t('register')
                              )}
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
              {getFilteredSessions(liveSessions).map((session, index) => (
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
                            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                          </div>
                          
                          <h3 className="text-xl font-semibold mb-2 text-white">{session.title}</h3>
                          <p className="text-gray-400 mb-4">
                            {session.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>
                                {t('instructor')}: <strong>{session.instructor.name}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-red-500 font-semibold">
                                {session.participantsCount} {t('participants')} online
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
                          disabled={joiningSession === session.id}
                        >
                          {joiningSession === session.id ? (
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

        {/* Recorded Sessions */}
        <TabsContent value="recorded" className="space-y-4">
          {getFilteredSessions(recordedSessions).length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">{t('noRecorded')}</h3>
                <p className="text-gray-400">{t('noRecordedDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {getFilteredSessions(recordedSessions).map((session, index) => (
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
                          <p className="text-gray-400 mb-4">
                            {session.description}
                          </p>

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
                                {t('duration')}: <strong>{formatDuration(session.duration)}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>
                                {session.participantsCount} {t('participants')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span>{t('recordedOn')}: {formatDate(session.scheduledAt)}</span>
                          </div>
                        </div>

                        <Button
                          className="bg-secondary text-primary hover:bg-secondary/90"
                          onClick={() => handleWatchRecording(session.recordingUrl!)}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          {t('watchRecording')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}