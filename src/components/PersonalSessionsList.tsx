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
  AlertCircle,
  Loader2,
  Video,
  UserCheck,
  Clock,
  Eye,
  Radio,
  User,
  Mail,
  ChevronsLeft,
  ChevronsRight,
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
import { format } from 'date-fns';
import { ptBR, it, es } from 'date-fns/locale';
import { useParams } from 'next/navigation';

interface PersonalSessionHost {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
}

interface PersonalSessionStudent {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
}

interface PersonalSessionSettings {
  recordingEnabled: boolean;
  waitingRoomEnabled: boolean;
  chatEnabled: boolean;
  autoStartRecording: boolean;
}

interface PersonalSession {
  id: string;
  title: string;
  description: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED' | 'FAILED';
  host: PersonalSessionHost;
  student: PersonalSessionStudent;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  zoomMeetingId: string | null;
  hasRecording: boolean;
  settings: PersonalSessionSettings;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export default function PersonalSessionsList() {
  const t = useTranslations('Admin.PersonalSessionsList');
  const { toast } = useToast();
  const { token } = useAuth();
  const params = useParams();
  const locale = params.locale as string;

  const [sessions, setSessions] = useState<PersonalSession[]>([]);
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
  const [selectedSession, setSelectedSession] = useState<PersonalSession | null>(null);

  const fetchSessions = useCallback(async () => {
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
        `${API_URL}/api/v1/personal-sessions?${searchParams.toString()}`,
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
      setMeta(data.meta || {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
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
    fetchSessions();
  }, [fetchSessions]);

  const getStatusBadge = (status: PersonalSession['status']) => {
    const statusConfig = {
      SCHEDULED: {
        label: t('status.scheduled'),
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Clock,
      },
      LIVE: {
        label: t('status.live'),
        className: 'bg-secondary/20 text-secondary border-secondary/30 animate-pulse',
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
      FAILED: {
        label: t('status.failed'),
        className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
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

  // Filter sessions by search query (client-side for now)
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      session.student.fullName.toLowerCase().includes(query) ||
      session.student.email.toLowerCase().includes(query) ||
      session.host.fullName.toLowerCase().includes(query)
    );
  });

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
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-secondary" />
          <h2 className="text-xl font-semibold text-white">{t('title')}</h2>
          <Badge variant="outline" className="ml-2 text-gray-400">
            {meta.total} {t('totalSessions')}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
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
            <SelectTrigger className="w-full sm:w-40 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder={t('filterByStatus')} />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="SCHEDULED">{t('status.scheduled')}</SelectItem>
              <SelectItem value="LIVE">{t('status.live')}</SelectItem>
              <SelectItem value="ENDED">{t('status.ended')}</SelectItem>
              <SelectItem value="CANCELLED">{t('status.cancelled')}</SelectItem>
              <SelectItem value="FAILED">{t('status.failed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('noSessions')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-secondary/50 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Session info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{session.title}</h3>
                    {getStatusBadge(session.status)}
                    {session.hasRecording && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <Video size={12} className="mr-1" />
                        {t('hasRecording')}
                      </Badge>
                    )}
                  </div>

                  {session.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">{session.description}</p>
                  )}

                  {/* Date and time */}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={14} />
                    <span>{formatDateTime(session.scheduledStartTime)}</span>
                    <span className="text-gray-600">-</span>
                    <span>{formatDateTime(session.scheduledEndTime)}</span>
                  </div>
                </div>

                {/* Middle: Host and Student info */}
                <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
                  {/* Host */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/20 rounded-full">
                      <User size={16} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('host')}</p>
                      <p className="text-sm text-white font-medium">{session.host.fullName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail size={10} />
                        {session.host.email}
                      </p>
                    </div>
                  </div>

                  {/* Student */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-secondary/20 rounded-full">
                      <UserCheck size={16} className="text-secondary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('student')}</p>
                      <p className="text-sm text-white font-medium">{session.student.fullName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail size={10} />
                        {session.student.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSession(session)}
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

      {/* View Session Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <UserCheck size={24} className="text-secondary" />
                <h2 className="text-xl font-semibold text-white">{t('sessionDetails')}</h2>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Title and Status */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{selectedSession.title}</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedSession.status)}
                  {selectedSession.hasRecording && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      <Video size={12} className="mr-1" />
                      {t('hasRecording')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedSession.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">{t('description')}</h4>
                  <p className="text-white">{selectedSession.description}</p>
                </div>
              )}

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">{t('scheduledStart')}</h4>
                  <p className="text-white">{formatDateTime(selectedSession.scheduledStartTime)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">{t('scheduledEnd')}</h4>
                  <p className="text-white">{formatDateTime(selectedSession.scheduledEndTime)}</p>
                </div>
              </div>

              {/* Actual times if available */}
              {(selectedSession.actualStartTime || selectedSession.actualEndTime) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedSession.actualStartTime && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1">{t('actualStart')}</h4>
                      <p className="text-white">{formatDateTime(selectedSession.actualStartTime)}</p>
                    </div>
                  )}
                  {selectedSession.actualEndTime && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1">{t('actualEnd')}</h4>
                      <p className="text-white">{formatDateTime(selectedSession.actualEndTime)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Host and Student */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-blue-400" />
                    <h4 className="text-sm font-medium text-gray-400">{t('host')}</h4>
                  </div>
                  <p className="text-white font-medium">{selectedSession.host.fullName}</p>
                  <p className="text-sm text-gray-400">{selectedSession.host.email}</p>
                </div>
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck size={16} className="text-secondary" />
                    <h4 className="text-sm font-medium text-gray-400">{t('student')}</h4>
                  </div>
                  <p className="text-white font-medium">{selectedSession.student.fullName}</p>
                  <p className="text-sm text-gray-400">{selectedSession.student.email}</p>
                </div>
              </div>

              {/* Zoom Meeting ID */}
              {selectedSession.zoomMeetingId && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">{t('zoomMeetingId')}</h4>
                  <p className="text-white font-mono">{selectedSession.zoomMeetingId}</p>
                </div>
              )}

              {/* Settings */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">{t('settings')}</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={
                      selectedSession.settings.recordingEnabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }
                  >
                    {t('settingsRecording')}: {selectedSession.settings.recordingEnabled ? t('enabled') : t('disabled')}
                  </Badge>
                  <Badge
                    className={
                      selectedSession.settings.chatEnabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }
                  >
                    {t('settingsChat')}: {selectedSession.settings.chatEnabled ? t('enabled') : t('disabled')}
                  </Badge>
                  <Badge
                    className={
                      selectedSession.settings.waitingRoomEnabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }
                  >
                    {t('settingsWaitingRoom')}: {selectedSession.settings.waitingRoomEnabled ? t('enabled') : t('disabled')}
                  </Badge>
                </div>
              </div>

              {/* Created/Updated */}
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
                <p>{t('createdAt')}: {formatDateTime(selectedSession.createdAt)}</p>
                <p>{t('updatedAt')}: {formatDateTime(selectedSession.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
