'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';
import {
  PlayCircle,
  Download,
  Clock,
  Calendar,
  Users,
  Eye,
  Search,
  Filter,
  Loader2,
  FileVideo,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// API interfaces
interface Host {
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

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Recording {
  sessionId: string;
  title: string;
  description?: string;
  status: 'AVAILABLE' | 'PROCESSING' | 'FAILED' | 'EXPIRED';
  duration?: number;
  formattedDuration?: string;
  fileSize?: string;
  recordingUrl?: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  recordedAt?: string;
  availableUntil?: string;
  viewCount: number;
  participantCount: number;
  host: Host;
  lesson?: Lesson;
  argument?: Argument;
  course?: Course;
}

interface Meta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface RecordingsResponse {
  recordings: Recording[];
  meta: Meta;
}

interface RecordingsListProps {
  locale: string;
  translations?: any;
}

export default function RecordingsList({ locale, translations }: RecordingsListProps) {
  const defaultT = useTranslations('LiveSessions');
  const t = translations || defaultT;
  const { toast } = useToast();
  const { token } = useAuth();
  
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recordedAt');
  const [sortOrder, setSortOrder] = useState<string>('DESC');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecordings, setTotalRecordings] = useState(0);
  const [playingSession, setPlayingSession] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    if (!token) {
      console.log('No token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        orderBy: sortBy,
        order: sortOrder,
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `${API_URL}/api/v1/recordings?${params}`,
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
        
        if (response.status === 404) {
          setRecordings([]);
          return;
        }
        
        throw new Error(`Failed to fetch recordings: ${response.status}`);
      }

      const data: RecordingsResponse = await response.json();
      console.log('Fetched recordings:', data);
      
      setRecordings(data.recordings || []);
      if (data.meta) {
        setTotalPages(data.meta.totalPages);
        setTotalRecordings(data.meta.total);
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      toast({
        title: t('error.loadTitle'),
        description: t('error.loadDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, searchTerm, statusFilter, sortBy, sortOrder, t, toast]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setCurrentPage(1);
  }, [sortBy, sortOrder]);

  const handlePlay = (recording: Recording) => {
    if (recording.streamUrl) {
      setPlayingSession(recording.sessionId);
      window.open(recording.streamUrl, '_blank');
    } else {
      toast({
        title: t('error.noStreamTitle'),
        description: t('error.noStreamDescription'),
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (recording: Recording) => {
    if (recording.recordingUrl) {
      window.open(recording.recordingUrl, '_blank');
    } else {
      toast({
        title: t('error.noDownloadTitle'),
        description: t('error.noDownloadDescription'),
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === 'pt' ? 'pt-BR' : locale === 'it' ? 'it-IT' : 'es-ES',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {t('recordingStatus.available')}
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse">
            {t('recordingStatus.processing')}
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            {t('recordingStatus.failed')}
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            {t('recordingStatus.expired')}
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading && recordings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-secondary mx-auto mb-4" />
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px] bg-gray-900 border-gray-700 text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t('filterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('recordingStatus.all')}</SelectItem>
                <SelectItem value="AVAILABLE">{t('recordingStatus.available')}</SelectItem>
                <SelectItem value="PROCESSING">{t('recordingStatus.processing')}</SelectItem>
                <SelectItem value="FAILED">{t('recordingStatus.failed')}</SelectItem>
                <SelectItem value="EXPIRED">{t('recordingStatus.expired')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={(value) => handleSort(value)}>
              <SelectTrigger className="w-full lg:w-[200px] bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder={t('sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recordedAt">{t('sort.date')}</SelectItem>
                <SelectItem value="title">{t('sort.title')}</SelectItem>
                <SelectItem value="duration">{t('sort.duration')}</SelectItem>
                <SelectItem value="viewCount">{t('sort.views')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {t('showing', { count: recordings.length, total: totalRecordings })}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchRecordings()}
              className="text-gray-400 border-gray-700 hover:bg-gray-800"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              {t('refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recordings Grid */}
      {recordings.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="text-center py-12">
            <FileVideo className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">{t('noRecordings')}</h3>
            <p className="text-gray-400">{t('noRecordingsDescription')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="wait">
            {recordings.map((recording, index) => (
              <motion.div
                key={recording.sessionId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-gray-800/50 border-gray-700 hover:border-secondary/50 transition-all h-full">
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-900">
                      {recording.thumbnailUrl ? (
                        <img
                          src={recording.thumbnailUrl}
                          alt={recording.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileVideo className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                      
                      {/* Duration Badge */}
                      {recording.formattedDuration && (
                        <Badge className="absolute top-2 right-2 bg-black/80 text-white">
                          {recording.formattedDuration}
                        </Badge>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        {getStatusBadge(recording.status)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-white line-clamp-2 mb-1">
                          {recording.title}
                        </h3>
                        {recording.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {recording.description}
                          </p>
                        )}
                      </div>

                      {/* Meta Info */}
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>{recording.host.name}</span>
                        </div>
                        {recording.recordedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(recording.recordedAt)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {recording.viewCount} {t('views')}
                          </span>
                          {recording.fileSize && (
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {recording.fileSize}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Topic Badge */}
                      {(recording.lesson || recording.argument) && (
                        <div className="flex gap-2">
                          {recording.lesson && (
                            <Badge variant="outline" className="text-xs">
                              {recording.lesson.title}
                            </Badge>
                          )}
                          {recording.argument && (
                            <Badge variant="outline" className="text-xs">
                              {recording.argument.title}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      {recording.status === 'AVAILABLE' && (
                        <div className="flex gap-2 pt-2">
                          {recording.streamUrl && (
                            <Button
                              size="sm"
                              className="flex-1 bg-secondary hover:bg-secondary/90 text-primary"
                              onClick={() => handlePlay(recording)}
                              disabled={playingSession === recording.sessionId}
                            >
                              {playingSession === recording.sessionId ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {t('opening')}
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  {t('watch')}
                                </>
                              )}
                            </Button>
                          )}
                          {recording.recordingUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => handleDownload(recording)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Expiration Warning */}
                      {recording.availableUntil && (
                        <div className="text-xs text-yellow-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {t('availableUntil', { date: formatDate(recording.availableUntil) })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                {t('page', { current: currentPage, total: totalPages })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('previous')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}