'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Loader2,
  Video,
  UserCheck,
  Clock,
  User,
  Play,
  Eye,
  Upload,
  FileVideo,
  HardDrive,
  X,
  Maximize2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface RecordingSession {
  id: string;
  title: string;
  description: string | null;
  scheduledStartTime: string;
  scheduledEndTime: string;
  zoomMeetingId: string | null;
  isManualUpload: boolean;
}

interface RecordingHost {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
}

interface PersonalRecording {
  id: string;
  status: 'AVAILABLE' | 'PROCESSING' | 'FAILED';
  duration: number;
  formattedDuration: string;
  fileSize: string;
  formattedFileSize: string;
  pandaVideoId: string | null;
  pandaVideoExternalId: string | null;
  pandaUploadStatus: string | null;
  thumbnailUrl: string | null;
  streamUrl: string | null;
  viewCount: number;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  session: RecordingSession;
  host: RecordingHost;
}

// Detailed recording response from GET /api/v1/personal-recordings/:id
interface RecordingDetails {
  id: string;
  sessionId: string;
  pandaVideoId: string | null;
  pandaFolderId: string | null;
  status: 'PENDING' | 'PROCESSING' | 'AVAILABLE' | 'ERROR';
  pandaUploadStatus: 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'AVAILABLE' | 'ERROR';
  durationInSeconds: number | null;
  fileSize: number | null;
  formattedDuration: string | null;
  formattedFileSize: string | null;
  canBeWatched: boolean;
  createdAt: string;
  updatedAt: string;
  session: {
    id: string;
    title: string;
    description: string | null;
    scheduledAt: string;
    isManualUpload: boolean;
  };
  host: {
    id: string;
    fullName: string;
    email: string;
  };
  student: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface MyPersonalRecordingsListProps {
  locale: string;
}

export default function MyPersonalRecordingsList({ locale }: MyPersonalRecordingsListProps) {
  const t = useTranslations('LiveSessions.personalRecordings');
  const { toast } = useToast();
  const { token } = useAuth();

  const [recordings, setRecordings] = useState<PersonalRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingRecording, setPlayingRecording] = useState<PersonalRecording | null>(null);
  const [recordingDetails, setRecordingDetails] = useState<RecordingDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchRecordings = useCallback(async () => {
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
      searchParams.append('status', 'AVAILABLE,PROCESSING');

      const response = await fetch(
        `${API_URL}/api/v1/personal-recordings/my-recordings?${searchParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }

      const data = await response.json();
      setRecordings(data.recordings || []);
    } catch (error) {
      console.error('Error fetching personal recordings:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [token, t, toast]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  // Fetch recording details from GET /api/v1/personal-recordings/:id
  const fetchRecordingDetails = useCallback(async (recordingId: string) => {
    if (!token) return null;

    try {
      setLoadingDetails(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(
        `${API_URL}/api/v1/personal-recordings/${recordingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Forbidden');
        }
        if (response.status === 404) {
          throw new Error('Not found');
        }
        throw new Error('Failed to fetch recording details');
      }

      const data = await response.json();
      return data.recording as RecordingDetails;
    } catch (error) {
      console.error('Error fetching recording details:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoadingDetails(false);
    }
  }, [token, t, toast]);

  const getStatusBadge = (status: PersonalRecording['status']) => {
    const statusConfig = {
      AVAILABLE: {
        label: t('status.available'),
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: Video,
      },
      PROCESSING: {
        label: t('status.processing'),
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse',
        icon: Loader2,
      },
      FAILED: {
        label: t('status.failed'),
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: Video,
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon size={12} className={status === 'PROCESSING' ? 'animate-spin' : ''} />
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

    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: dateLocale });
  };

  const handleWatchRecording = async (recording: PersonalRecording) => {
    if (recording.status === 'AVAILABLE' && recording.pandaVideoExternalId) {
      setPlayingRecording(recording);
      // Fetch detailed info
      const details = await fetchRecordingDetails(recording.id);
      if (details) {
        setRecordingDetails(details);
      }
    }
  };

  const handleCloseModal = () => {
    setPlayingRecording(null);
    setRecordingDetails(null);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        <span className="ml-2 text-white/60">{t('loading')}</span>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="text-center py-8">
          <Video className="h-12 w-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-white">{t('noRecordings')}</h3>
          <p className="text-white/60">{t('noRecordingsDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {recordings.map((recording, index) => (
          <motion.div
            key={recording.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className="relative bg-white/5 rounded-xl overflow-hidden border-l-[8px] border-purple-500 hover:border-l-[10px] hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-1 group"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.08) 1px, transparent 1px),
                  radial-gradient(circle at 80% 80%, rgba(126, 34, 206, 0.08) 1px, transparent 1px),
                  radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.04) 0.8px, transparent 0.8px)
                `,
                backgroundSize: '20px 20px, 18px 18px, 30px 30px',
                backgroundPosition: '0 0, 10px 10px, 5px 5px'
              }}
            >
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

              <div className="p-6">
                {/* Header with badges */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {getStatusBadge(recording.status)}
                    <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400">
                      <UserCheck size={12} className="mr-1" />
                      {t('individualSession')}
                    </Badge>
                    {recording.session.isManualUpload ? (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <Upload size={12} className="mr-1" />
                        {t('manualUpload')}
                      </Badge>
                    ) : (
                      <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                        <FileVideo size={12} className="mr-1" />
                        {t('zoomRecording')}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3 line-clamp-2 leading-tight tracking-tight group-hover:text-purple-400 transition-colors duration-300">
                  {recording.session.title}
                </h3>

                {/* Divider Line with Dot */}
                <div className="relative my-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-purple-500/40 transition-colors duration-300"></div>
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-500/40 rounded-full group-hover:scale-150 group-hover:bg-purple-500 transition-all duration-300"></div>
                </div>

                {/* Description */}
                {recording.session.description && (
                  <p className="text-white/70 mb-6 line-clamp-2 leading-relaxed">{recording.session.description}</p>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Host/Tutor */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors duration-300">
                      <User size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('tutor')}</p>
                      <p className="text-sm font-semibold text-white">{recording.host.fullName}</p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors duration-300">
                      <Clock size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('duration')}</p>
                      <p className="text-sm font-semibold text-white">{recording.formattedDuration}</p>
                    </div>
                  </div>

                  {/* File Size */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors duration-300">
                      <HardDrive size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('fileSize')}</p>
                      <p className="text-sm font-semibold text-white">{recording.formattedFileSize}</p>
                    </div>
                  </div>
                </div>

                {/* Date and Watch Button */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <Calendar size={14} className="text-white/60" />
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('recordedOn')}</p>
                        <p className="text-sm font-medium text-white/90">{formatDateTime(recording.session.scheduledStartTime)}</p>
                      </div>
                    </div>

                    {/* View count */}
                    <div className="flex items-center gap-1 text-white/50">
                      <Eye size={14} />
                      <span className="text-sm">{recording.viewCount} {t('views')}</span>
                    </div>
                  </div>

                  {/* Watch Button */}
                  {recording.status === 'AVAILABLE' && (
                    <Button
                      className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300"
                      onClick={() => handleWatchRecording(recording)}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {t('watch')}
                    </Button>
                  )}

                  {recording.status === 'PROCESSING' && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-4 py-2">
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      {t('processingVideo')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Hover Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              {/* Hover Ring */}
              <div className="absolute inset-0 rounded-xl ring-1 ring-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Modern Video Player Modal */}
      <AnimatePresence>
        {playingRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`w-full ${isFullscreen ? 'max-w-7xl' : 'max-w-5xl'} bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-purple-500/20`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-4 sm:p-6 border-b border-white/10">
                {/* Gradient line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <Video size={12} className="mr-1" />
                        {t('individualSession')}
                      </Badge>
                      {playingRecording.session.isManualUpload ? (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          <Upload size={12} className="mr-1" />
                          {t('manualUpload')}
                        </Badge>
                      ) : (
                        <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                          <FileVideo size={12} className="mr-1" />
                          {t('zoomRecording')}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white truncate">
                      {playingRecording.session.title}
                    </h3>
                    {playingRecording.session.description && (
                      <p className="text-white/60 mt-1 text-sm line-clamp-1">
                        {playingRecording.session.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleFullscreen}
                      className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 text-white/70 hover:text-white group"
                      title={isFullscreen ? t('modal.exitFullscreen') : t('modal.fullscreen')}
                    >
                      <Maximize2 size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="p-2.5 bg-white/5 hover:bg-red-500/20 rounded-lg transition-all duration-200 text-white/70 hover:text-red-400 group"
                    >
                      <X size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Player */}
              <div className={`relative bg-black ${isFullscreen ? 'aspect-video' : 'aspect-video max-h-[60vh]'}`}>
                {playingRecording.pandaVideoExternalId ? (
                  <iframe
                    src={`https://player-vz-cb4ade65-255.tv.pandavideo.com.br/embed/?v=${playingRecording.pandaVideoExternalId}`}
                    className="w-full h-full"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/40 gap-4">
                    <Video size={48} />
                    <p>{t('videoNotAvailable')}</p>
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="p-4 sm:p-6 bg-black/40">
                {loadingDetails ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                    <span className="ml-2 text-white/60">{t('modal.loadingDetails')}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Tutor */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('tutor')}</p>
                        <p className="text-sm font-medium text-white truncate">
                          {recordingDetails?.host.fullName || playingRecording.host.fullName}
                        </p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock size={18} className="text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('duration')}</p>
                        <p className="text-sm font-medium text-white">
                          {recordingDetails?.formattedDuration || playingRecording.formattedDuration}
                        </p>
                      </div>
                    </div>

                    {/* File Size */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <HardDrive size={18} className="text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('fileSize')}</p>
                        <p className="text-sm font-medium text-white">
                          {recordingDetails?.formattedFileSize || playingRecording.formattedFileSize}
                        </p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Calendar size={18} className="text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('recordedOn')}</p>
                        <p className="text-sm font-medium text-white">
                          {formatDateTime(recordingDetails?.session.scheduledAt || playingRecording.session.scheduledStartTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* View Count Badge */}
                <div className="flex items-center justify-center mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-white/50 bg-white/5 px-4 py-2 rounded-full">
                    <Eye size={16} />
                    <span className="text-sm">{playingRecording.viewCount} {t('views')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
