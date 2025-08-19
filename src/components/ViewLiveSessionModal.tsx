'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, Users, Video, Radio, Link, Lock, MessageSquare, HelpCircle, User, Mic, MicOff, Hand, Monitor, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Host {
  id: string;
  name: string;
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

interface LiveSessionDetails {
  sessionId: string;
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
  joinUrl?: string;
  passcode?: string;
  participantCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ViewLiveSessionModalProps {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewLiveSessionModal({
  sessionId,
  open,
  onOpenChange,
}: ViewLiveSessionModalProps) {
  const t = useTranslations('Admin.ViewLiveSession');
  const { toast } = useToast();
  const { token } = useAuth();
  const params = useParams();
  const locale = params.locale as string;
  
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<LiveSessionDetails | null>(null);

  const fetchSessionDetails = useCallback(async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(
        `${API_URL}/api/v1/live-sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch session details');
      }

      const data = await response.json();
      setSession(data);
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [sessionId, token, t, toast, onOpenChange]);

  useEffect(() => {
    if (open && sessionId) {
      fetchSessionDetails();
    }
  }, [open, sessionId, fetchSessionDetails]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const localeMap = {
      pt: ptBR,
      it: it,
      es: es,
    };
    const dateLocale = localeMap[locale as keyof typeof localeMap] || ptBR;
    
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: dateLocale });
  };

  const getStatusBadge = (status: LiveSessionDetails['status']) => {
    const statusConfig = {
      SCHEDULED: {
        label: t('status.scheduled'),
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Clock,
      },
      LIVE: {
        label: t('status.live'),
        className: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse',
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
        icon: Calendar,
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

  const getSessionTypeBadge = (type: LiveSessionDetails['sessionType']) => {
    const typeConfig = {
      MEETING: {
        label: t('sessionType.meeting'),
        className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      },
      WEBINAR: {
        label: t('sessionType.webinar'),
        className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      },
    };

    const config = typeConfig[type];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('copied.title'),
      description: t(`copied.${type}`),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Radio className="h-5 w-5 text-purple-400" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('title')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : session ? (
          <div className="space-y-6">
            {/* Header with Status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {session.title}
                </h3>
                {session.description && (
                  <p className="text-gray-400 text-sm">
                    {session.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(session.status)}
                {getSessionTypeBadge(session.sessionType)}
              </div>
            </div>

            {/* Session Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Host Information */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('host.title')}
                </h4>
                <div className="flex items-center gap-3">
                  {session.host.avatar && (
                    <img 
                      src={session.host.avatar} 
                      alt={session.host.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">{session.host.name}</p>
                    <p className="text-gray-400 text-sm">{session.host.email}</p>
                  </div>
                </div>
              </div>

              {/* Co-Hosts */}
              {session.coHosts && session.coHosts.length > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t('coHosts.title')}
                  </h4>
                  <div className="space-y-2">
                    {session.coHosts.map((coHost) => (
                      <div key={coHost.id} className="flex items-center gap-2">
                        {coHost.avatar && (
                          <img 
                            src={coHost.avatar} 
                            alt={coHost.name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <p className="text-white text-sm">{coHost.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule Information */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('schedule.title')}
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">{t('schedule.start')}:</span>
                    <span className="text-white ml-2">
                      {formatDateTime(session.scheduledStartTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('schedule.end')}:</span>
                    <span className="text-white ml-2">
                      {formatDateTime(session.scheduledEndTime)}
                    </span>
                  </div>
                  {session.actualStartTime && (
                    <div>
                      <span className="text-gray-400">{t('schedule.actualStart')}:</span>
                      <span className="text-white ml-2">
                        {formatDateTime(session.actualStartTime)}
                      </span>
                    </div>
                  )}
                  {session.actualEndTime && (
                    <div>
                      <span className="text-gray-400">{t('schedule.actualEnd')}:</span>
                      <span className="text-white ml-2">
                        {formatDateTime(session.actualEndTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="bg-gray-700/50 rounded-lg p-4 md:col-span-2">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  {t('settings.title')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{t('settings.maxParticipants')}:</span>
                    <span className="text-white text-sm font-medium">{session.maxParticipants}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      {t('settings.recording')}:
                    </span>
                    <Badge className={session.recordingEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}>
                      {session.recordingEnabled ? t('enabled') : t('disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <PlayCircle className="h-3 w-3" />
                      {t('settings.autoStartRecording')}:
                    </span>
                    <Badge className={session.autoStartRecording ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}>
                      {session.autoStartRecording ? t('enabled') : t('disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      {t('settings.waitingRoom')}:
                    </span>
                    <Badge className={session.waitingRoomEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}>
                      {session.waitingRoomEnabled ? t('enabled') : t('disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {t('settings.chat')}:
                    </span>
                    <Badge className={session.chatEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}>
                      {session.chatEnabled ? t('enabled') : t('disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      {t('settings.qna')}:
                    </span>
                    <Badge className={session.qnaEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}>
                      {session.qnaEnabled ? t('enabled') : t('disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <MicOff className="h-3 w-3" />
                      {t('settings.muteOnEntry')}:
                    </span>
                    <Badge className={session.muteParticipantsOnEntry ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-600 text-gray-400'}>
                      {session.muteParticipantsOnEntry ? t('enabled') : t('disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      {t('settings.allowUnmute')}:
                    </span>
                    <Badge className={session.allowParticipantsUnmute ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}>
                      {session.allowParticipantsUnmute ? t('enabled') : t('disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Hand className="h-3 w-3" />
                      {t('settings.allowRaiseHand')}:
                    </span>
                    <Badge className={session.allowRaiseHand ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}>
                      {session.allowRaiseHand ? t('enabled') : t('disabled')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {t('settings.allowScreenShare')}:
                    </span>
                    <Badge className={session.allowParticipantScreenShare ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'}>
                      {session.allowParticipantScreenShare ? t('enabled') : t('disabled')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Content */}
            {(session.lesson || session.argument) && (
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  {t('linkedContent.title')}
                </h4>
                {session.lesson && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {t('linkedContent.lesson')}: {session.lesson.title}
                  </Badge>
                )}
                {session.argument && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {t('linkedContent.argument')}: {session.argument.title}
                  </Badge>
                )}
              </div>
            )}

            {/* Live Session Info */}
            {session.status === 'LIVE' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                  <Radio className="h-4 w-4 animate-pulse" />
                  {t('liveInfo.title')}
                </h4>
                <div className="space-y-3">
                  {session.participantCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{t('liveInfo.participants')}:</span>
                      <Badge className="bg-green-500/20 text-green-400">
                        {session.participantCount} / {session.maxParticipants}
                      </Badge>
                    </div>
                  )}
                  {session.joinUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm flex items-center gap-1">
                          <Link className="h-3 w-3" />
                          {t('liveInfo.joinUrl')}:
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(session.joinUrl!, 'url')}
                          className="text-green-400 border-green-500/50 hover:bg-green-500/20"
                        >
                          {t('copy')}
                        </Button>
                      </div>
                      <input 
                        type="text" 
                        value={session.joinUrl} 
                        readOnly
                        className="w-full bg-gray-900 text-gray-300 text-xs p-2 rounded border border-gray-700"
                      />
                    </div>
                  )}
                  {session.passcode && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">{t('liveInfo.passcode')}:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-900 px-3 py-1 rounded text-green-400">
                          {session.passcode}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(session.passcode!, 'passcode')}
                          className="text-green-400 hover:bg-green-500/20"
                        >
                          {t('copy')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer with timestamps */}
            <div className="text-xs text-gray-500 flex justify-between">
              <span>{t('createdAt')}: {formatDateTime(session.createdAt)}</span>
              <span>{t('updatedAt')}: {formatDateTime(session.updatedAt)}</span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}