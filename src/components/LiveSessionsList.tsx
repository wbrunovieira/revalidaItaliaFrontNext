'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import {
  Radio,
  Calendar,
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  Video,
  UserCheck,
  Clock,
  Eye,
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

interface Host {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
}

interface CoHost {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
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

interface LiveSession {
  id: string;
  title: string;
  description?: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  sessionType: 'MEETING' | 'WEBINAR';
  host: Host;
  coHosts: CoHost[];
  lesson?: Lesson;
  argument?: Argument;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  participantCount: number;
  maxParticipants: number;
  recordingAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export default function LiveSessionsList() {
  const t = useTranslations('Admin.LiveSessionsList');
  const { toast } = useToast();
  const { token } = useAuth();
  const params = useParams();
  const locale = params.locale as string;

  const [sessions, setSessions] = useState<LiveSession[]>([]);
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
  const [sortBy, setSortBy] = useState<string>('scheduledStartTime');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '20');
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      if (sortBy) {
        params.append('orderBy', sortBy);
        params.append('order', sortOrder);
      }

      const response = await fetch(
        `${API_URL}/api/v1/live-sessions?${params.toString()}`,
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
  }, [currentPage, searchQuery, statusFilter, sortBy, sortOrder, token, t, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const getStatusBadge = (status: LiveSession['status']) => {
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

  const getSessionTypeBadge = (type: LiveSession['sessionType']) => {
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setCurrentPage(1);
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Radio className="h-5 w-5 text-purple-400" />
            {t('title')}
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {t('description')}
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {t('showing', { count: sessions.length, total: meta.total })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
        
        <Select value={statusFilter || 'all'} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('filterByStatus')} />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="all" className="text-white hover:bg-gray-600">
              {t('allStatuses')}
            </SelectItem>
            <SelectItem value="SCHEDULED" className="text-white hover:bg-gray-600">
              {t('status.scheduled')}
            </SelectItem>
            <SelectItem value="LIVE" className="text-white hover:bg-gray-600">
              {t('status.live')}
            </SelectItem>
            <SelectItem value="ENDED" className="text-white hover:bg-gray-600">
              {t('status.ended')}
            </SelectItem>
            <SelectItem value="CANCELLED" className="text-white hover:bg-gray-600">
              {t('status.cancelled')}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => handleSort(value)}>
          <SelectTrigger className="w-[200px] bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder={t('sortBy')} />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            <SelectItem value="scheduledStartTime" className="text-white hover:bg-gray-600">
              {t('sortByDate')}
            </SelectItem>
            <SelectItem value="title" className="text-white hover:bg-gray-600">
              {t('sortByTitle')}
            </SelectItem>
            <SelectItem value="createdAt" className="text-white hover:bg-gray-600">
              {t('sortByCreated')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-gray-800/50 rounded-lg p-12 text-center">
          <Radio className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('noSessions')}
          </h3>
          <p className="text-gray-400">
            {t('noSessionsDescription')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">
                        {session.title}
                      </h4>
                      {session.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {session.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(session.status)}
                      {getSessionTypeBadge(session.sessionType)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span>{formatDateTime(session.scheduledStartTime)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <UserCheck className="h-4 w-4 text-cyan-400" />
                      <span>{session.host.fullName}</span>
                    </div>
                    
                    {session.coHosts.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span>+{session.coHosts.length} {t('coHosts')}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="h-4 w-4 text-green-400" />
                      <span>
                        {session.participantCount}/{session.maxParticipants} {t('participants')}
                      </span>
                    </div>
                  </div>

                  {(session.lesson || session.argument) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {session.lesson && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {t('lesson')}: {session.lesson.title}
                        </Badge>
                      )}
                      {session.argument && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {t('argument')}: {session.argument.title}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex lg:flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Eye className="h-4 w-4" />
                    {t('actions.view')}
                  </Button>
                  {session.recordingAvailable && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 justify-center">
                      <Video className="h-3 w-3 mr-1" />
                      {t('recording')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {t('pageOf', { current: meta.page, total: meta.totalPages })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('previous')}
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={
                      page === currentPage
                        ? 'bg-purple-600 text-white'
                        : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(meta.totalPages, currentPage + 1))}
              disabled={currentPage === meta.totalPages}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
            >
              {t('next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}