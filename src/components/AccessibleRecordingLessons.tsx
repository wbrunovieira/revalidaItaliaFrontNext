'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface RecordingLesson {
  lessonId: string;
  slug: string;
  title: string;
  description: string | null;
  courseId: string;
  courseName: string;
  moduleId: string;
  moduleName: string;
  recordingId: string;
  recordingUrl: string;
  downloadUrl: string | null;
  thumbnailUrl: string | null;
  duration: number;
  formattedDuration: string;
  fileSize: string;
  recordedAt: string;
  viewCount: number;
  recordingStatus: 'PROCESSING' | 'AVAILABLE' | 'EXPIRED';
  availableUntil: string | null;
  daysUntilExpiration: number | null;
  userProgress: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    progress: number;
    completed: boolean;
    completedAt: string | null;
    lastAccess: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface RecordingLessonsResponse {
  lessons: RecordingLesson[];
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

interface AccessibleRecordingLessonsProps {
  locale: string;
  courses: Course[];
  modules: Module[];
}

export default function AccessibleRecordingLessons({ locale, courses, modules }: AccessibleRecordingLessonsProps) {
  const t = useTranslations('AccessibleRecordingLessons');
  const { toast } = useToast();

  const [lessons, setLessons] = useState<RecordingLesson[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [orderBy, setOrderBy] = useState<'recordedAt' | 'title' | 'duration' | 'viewCount'>('recordedAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [courseFilter, setCourseFilter] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('');

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search && search.length >= 2) params.append('search', search);
      if (courseFilter) params.append('courseId', courseFilter);
      if (moduleFilter) params.append('moduleId', moduleFilter);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('orderBy', orderBy);
      params.append('order', order);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/v1/accessible-recording-lessons?${params}`, {
        headers: {
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recording lessons');
      }

      const data: RecordingLessonsResponse = await response.json();
      setLessons(data.lessons);
      setMeta(data.meta);
    } catch (error) {
      console.error('Error fetching recording lessons:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [search, page, limit, orderBy, order, courseFilter, moduleFilter, t, toast]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page on search
  };

  // Helper function to get course and module slugs from IDs
  const getLessonUrl = (lesson: RecordingLesson) => {
    const course = courses.find(c => c.id === lesson.courseId);
    const module = modules.find(m => m.id === lesson.moduleId);

    if (!course || !module) {
      console.warn('Could not find course or module for lesson:', lesson);
      return '#';
    }

    return `/${locale}/courses/${course.slug}/modules/${module.slug}/lessons/${lesson.lessonId}`;
  };

  const getStatusBadge = (status: RecordingLesson['recordingStatus']) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            {t('status.available')}
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
            {t('status.processing')}
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
            {t('status.expired')}
          </Badge>
        );
    }
  };

  const getProgressBadge = (userProgress: RecordingLesson['userProgress']) => {
    if (userProgress.completed) {
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t('progress.completed')}
        </Badge>
      );
    }
    if (userProgress.status === 'IN_PROGRESS') {
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          <PlayCircle className="h-3 w-3 mr-1" />
          {userProgress.progress}%
        </Badge>
      );
    }
    return null;
  };

  if (loading && lessons.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Card */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6 space-y-6">
          {/* Search Bar */}
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">{t('searchLabel')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-secondary/50 h-11"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* Filters and Sorting - Grouped */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-0">
            {/* Filters Group */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:pr-6">
              {/* Course Filter */}
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm font-medium text-white/80">{t('filter.courseLabel')}</label>
                <Select
                  value={courseFilter}
                  onValueChange={(value) => {
                    setCourseFilter(value === 'all' ? '' : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-secondary/50 h-11">
                    <SelectValue placeholder={t('filter.selectCourse')} />
                  </SelectTrigger>
                  <SelectContent className="bg-primary border-white/10">
                    <SelectItem value="all">{t('filter.allCourses')}</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Module Filter */}
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm font-medium text-white/80">{t('filter.moduleLabel')}</label>
                <Select
                  value={moduleFilter}
                  onValueChange={(value) => {
                    setModuleFilter(value === 'all' ? '' : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-secondary/50 h-11">
                    <SelectValue placeholder={t('filter.selectModule')} />
                  </SelectTrigger>
                  <SelectContent className="bg-primary border-white/10">
                    <SelectItem value="all">{t('filter.allModules')}</SelectItem>
                    {modules.map((moduleItem) => (
                      <SelectItem key={moduleItem.id} value={moduleItem.id}>
                        {moduleItem.slug}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vertical Divider - Desktop only */}
            <div className="hidden lg:block w-px bg-white/10 mx-6" />

            {/* Sorting Group */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:pl-6">
              {/* Order By */}
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm font-medium text-white/80">{t('sort.orderByLabel')}</label>
                <Select value={orderBy} onValueChange={(value) => setOrderBy(value as any)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-secondary/50 h-11">
                    <SelectValue placeholder={t('sortBy')} />
                  </SelectTrigger>
                  <SelectContent className="bg-primary border-white/10">
                    <SelectItem value="recordedAt">{t('sort.recordedAt')}</SelectItem>
                    <SelectItem value="title">{t('sort.title')}</SelectItem>
                    <SelectItem value="duration">{t('sort.duration')}</SelectItem>
                    <SelectItem value="viewCount">{t('sort.viewCount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order Direction */}
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-sm font-medium text-white/80">{t('sort.orderDirectionLabel')}</label>
                <Select value={order} onValueChange={(value) => setOrder(value as any)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-secondary/50 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-primary border-white/10">
                    <SelectItem value="DESC">{t('sort.desc')}</SelectItem>
                    <SelectItem value="ASC">{t('sort.asc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count and Per Page Selector */}
      {meta && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-sm text-white/60">
            {t('showing', { count: lessons.length, total: meta.total })}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-white/60">{t('pagination.perPage')}</label>
            <Select value={limit.toString()} onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1); // Reset to first page when changing limit
            }}>
              <SelectTrigger className="w-[100px] bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-secondary/50 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-primary border-white/10">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Lessons Grid */}
      {lessons.length === 0 ? (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="text-center py-12">
            <PlayCircle className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">{t('noLessons')}</h3>
            <p className="text-white/60">{t('noLessonsDescription')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <Link
              key={lesson.lessonId}
              href={getLessonUrl(lesson)}
              className="block h-full"
            >
              <Card className="bg-white/5 border-white/10 hover:border-secondary/50 hover:bg-white/10 transition-all cursor-pointer h-full">
                <CardContent className="p-4">
                  {/* Header with Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    {getStatusBadge(lesson.recordingStatus)}
                    {getProgressBadge(lesson.userProgress)}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {lesson.title}
                  </h3>

                  {/* Course/Module */}
                  <div className="text-sm text-white/70 mb-3">
                    <p className="truncate">{lesson.courseName}</p>
                    <p className="truncate text-xs">{lesson.moduleName}</p>
                  </div>

                  {/* Description */}
                  {lesson.description && (
                    <p className="text-sm text-white/60 mb-4 line-clamp-2">
                      {lesson.description}
                    </p>
                  )}

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-xs text-white/50 pt-3 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lesson.formattedDuration}
                    </span>
                    {lesson.viewCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {lesson.viewCount} {t('views')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-white/60">
            {t('pagination.pageOf', { current: meta.page, total: meta.totalPages })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-secondary/50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('pagination.previous')}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-secondary/50 disabled:opacity-50"
            >
              {t('pagination.next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
