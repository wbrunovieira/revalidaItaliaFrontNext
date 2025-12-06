'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Video,
  UserCheck,
  Clock,
  Eye,
  Mail,
  ChevronsLeft,
  ChevronsRight,
  HardDrive,
  Play,
  Upload,
  FileVideo,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { useParams } from 'next/navigation';

interface RecordingSession {
  id: string;
  title: string;
  description: string | null;
  scheduledStartTime: string;
  scheduledEndTime: string;
  zoomMeetingId: string | null;
  isManualUpload: boolean;
}

interface RecordingStudent {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
}

interface MyCreatedRecording {
  id: string;
  status: 'AVAILABLE' | 'PROCESSING' | 'FAILED';
  duration: number | null;
  formattedDuration: string | null;
  fileSize: string | null;
  formattedFileSize: string | null;
  pandaVideoId: string | null;
  pandaVideoExternalId: string | null;
  pandaUploadStatus: 'NONE' | 'UPLOADING' | 'PROCESSING' | 'AVAILABLE' | 'FAILED';
  thumbnailUrl: string | null;
  streamUrl: string | null;
  viewCount: number;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  session: RecordingSession;
  student: RecordingStudent;
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export default function MyCreatedRecordingsList() {
  const t = useTranslations('Admin.MyCreatedRecordingsList');
  const { toast } = useToast();
  const { token } = useAuth();
  const params = useParams();
  const locale = params.locale as string;

  const [recordings, setRecordings] = useState<MyCreatedRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecording, setSelectedRecording] = useState<MyCreatedRecording | null>(null);
  const [playingRecording, setPlayingRecording] = useState<MyCreatedRecording | null>(null);

  const fetchRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const searchParams = new URLSearchParams();
      searchParams.append('page', currentPage.toString());
      searchParams.append('limit', '20');

      if (statusFilter) {
        searchParams.append('status', statusFilter);
      }

      const response = await fetch(
        `${API_URL}/api/v1/personal-recordings/my-created?${searchParams.toString()}`,
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
      setMeta(data.meta || {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, token, t, toast]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const getStatusBadge = (status: MyCreatedRecording['status']) => {
    const statusConfig = {
      AVAILABLE: {
        label: t('status.available'),
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle,
      },
      PROCESSING: {
        label: t('status.processing'),
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse',
        icon: Loader2,
      },
      FAILED: {
        label: t('status.failed'),
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: XCircle,
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

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  // Filter recordings by search query (client-side)
  const filteredRecordings = recordings.filter((recording) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      recording.session.title.toLowerCase().includes(query) ||
      recording.student.fullName.toLowerCase().includes(query) ||
      recording.student.email.toLowerCase().includes(query)
    );
  });

  const handleWatchRecording = (recording: MyCreatedRecording) => {
    if (recording.status === 'AVAILABLE' && recording.pandaVideoExternalId) {
      setPlayingRecording(recording);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        <span className="ml-2 text-gray-400">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Video className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">{t('title')}</h2>
          <Badge variant="outline" className="ml-2 text-gray-400">
            {meta.total} {t('totalRecordings')}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Status filter */}
          <Select value={statusFilter || 'all'} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder={t('filterByStatus')} />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="AVAILABLE">{t('status.available')}</SelectItem>
              <SelectItem value="PROCESSING">{t('status.processing')}</SelectItem>
              <SelectItem value="FAILED">{t('status.failed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Recordings List */}
      {filteredRecordings.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('noRecordings')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecordings.map((recording) => (
            <div
              key={recording.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Recording info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">{recording.session.title}</h3>
                    {getStatusBadge(recording.status)}
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

                  {recording.session.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">{recording.session.description}</p>
                  )}

                  {/* Date, Duration and Size */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDateTime(recording.createdAt)}
                    </span>
                    {recording.formattedDuration && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {recording.formattedDuration}
                      </span>
                    )}
                    {recording.formattedFileSize && (
                      <span className="flex items-center gap-1">
                        <HardDrive size={14} />
                        {recording.formattedFileSize}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {recording.viewCount} {t('views')}
                    </span>
                  </div>
                </div>

                {/* Middle: Student info */}
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/20 rounded-full">
                    <UserCheck size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('student')}</p>
                    <p className="text-sm text-white font-medium">{recording.student.fullName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Mail size={10} />
                      {recording.student.email}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {recording.status === 'AVAILABLE' && recording.pandaVideoExternalId && (
                    <Button
                      onClick={() => handleWatchRecording(recording)}
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                      size="sm"
                    >
                      <Play size={16} className="mr-1" />
                      {t('watch')}
                    </Button>
                  )}
                  <button
                    onClick={() => setSelectedRecording(recording)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    title={t('viewDetails')}
                  >
                    <Eye size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-400">
            {t('showing', {
              from: (currentPage - 1) * meta.perPage + 1,
              to: Math.min(currentPage * meta.perPage, meta.total),
              total: meta.total,
            })}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-sm text-gray-400 px-3">
              {t('pageOf', { current: currentPage, total: meta.totalPages })}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(meta.totalPages, prev + 1))}
              disabled={currentPage === meta.totalPages}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(meta.totalPages)}
              disabled={currentPage === meta.totalPages}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* View Recording Details Modal */}
      {selectedRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Video size={24} className="text-purple-400" />
                <h2 className="text-xl font-semibold text-white">{t('recordingDetails')}</h2>
              </div>
              <button
                onClick={() => setSelectedRecording(null)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title and Status */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{selectedRecording.session.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedRecording.status)}
                  {selectedRecording.session.isManualUpload ? (
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

              {/* Description */}
              {selectedRecording.session.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">{t('description')}</h4>
                  <p className="text-white">{selectedRecording.session.description}</p>
                </div>
              )}

              {/* Video Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">{t('duration')}</h4>
                  <p className="text-white">{selectedRecording.formattedDuration || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">{t('fileSize')}</h4>
                  <p className="text-white">{selectedRecording.formattedFileSize || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">{t('viewCount')}</h4>
                  <p className="text-white">{selectedRecording.viewCount}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">{t('processedAt')}</h4>
                  <p className="text-white">
                    {selectedRecording.processedAt ? formatDateTime(selectedRecording.processedAt) : '-'}
                  </p>
                </div>
              </div>

              {/* Student */}
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck size={16} className="text-purple-400" />
                  <h4 className="text-sm font-medium text-gray-400">{t('student')}</h4>
                </div>
                <p className="text-white font-medium">{selectedRecording.student.fullName}</p>
                <p className="text-sm text-gray-400">{selectedRecording.student.email}</p>
              </div>

              {/* Watch Button */}
              {selectedRecording.status === 'AVAILABLE' && selectedRecording.pandaVideoExternalId && (
                <Button
                  onClick={() => {
                    setSelectedRecording(null);
                    handleWatchRecording(selectedRecording);
                  }}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Play size={18} className="mr-2" />
                  {t('watchRecording')}
                </Button>
              )}

              {/* Created/Updated */}
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
                <p>{t('createdAt')}: {formatDateTime(selectedRecording.createdAt)}</p>
                <p>{t('updatedAt')}: {formatDateTime(selectedRecording.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {playingRecording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-white">{playingRecording.session.title}</h3>
                <p className="text-sm text-gray-400">
                  {t('student')}: {playingRecording.student.fullName}
                </p>
              </div>
              <button
                onClick={() => setPlayingRecording(null)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="aspect-video bg-black">
              {playingRecording.pandaVideoExternalId ? (
                <iframe
                  src={`https://player-vz-cb4ade65-255.tv.pandavideo.com.br/embed/?v=${playingRecording.pandaVideoExternalId}`}
                  className="w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {t('videoNotAvailable')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
