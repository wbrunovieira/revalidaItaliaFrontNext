'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Video,
  Calendar,
  BookOpen,
  TrendingUp,
  Play,
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

  // Recording Card Component
  const RecordingCard = ({ lesson }: { lesson: RecordingLesson }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const gradientRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || !gradientRef.current) return;

      const card = cardRef.current;
      const gradient = gradientRef.current;
      const rect = card.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 40;
      const rotateY = (centerX - x) / 40;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
      gradient.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      if (!cardRef.current || !gradientRef.current) return;

      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      gradientRef.current.style.opacity = '0';
    };

    return (
      <Link
        href={getLessonUrl(lesson)}
        className="group block"
      >
        <div
          ref={cardRef}
          className="relative bg-white/5 rounded-xl overflow-hidden border-l-[8px] border-secondary hover:border-l-[10px] hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-500 hover:-translate-y-1 h-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(56, 135, 166, 0.08) 1px, transparent 1px),
              radial-gradient(circle at 80% 80%, rgba(12, 53, 89, 0.08) 1px, transparent 1px),
              radial-gradient(circle at 50% 50%, rgba(56, 135, 166, 0.04) 0.8px, transparent 0.8px)
            `,
            backgroundSize: '20px 20px, 18px 18px, 30px 30px',
            backgroundPosition: '0 0, 10px 10px, 5px 5px'
          }}
        >
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>

          {/* Header Section with Icon */}
          <div className="relative p-6 pb-4">
            {/* Video Icon Badge */}
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-secondary/10 backdrop-blur-sm flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <Video size={20} className="text-secondary" />
            </div>

            {/* Status and Progress Badges */}
            <div className="flex items-center gap-2 mb-4">
              {getStatusBadge(lesson.recordingStatus)}
              {getProgressBadge(lesson.userProgress)}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight tracking-tight group-hover:text-secondary transition-colors duration-300 pr-14">
              {lesson.title}
            </h3>

            {/* Divider Line with Dot */}
            <div className="relative my-3">
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-secondary/40 transition-colors duration-300"></div>
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-secondary/40 rounded-full group-hover:scale-150 group-hover:bg-secondary transition-all duration-300"></div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4">
            {/* Course and Module */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors duration-300">
                  <BookOpen size={12} className="text-white/70 group-hover:text-secondary transition-colors duration-300" />
                </div>
                <span className="text-white/80 font-medium truncate">{lesson.courseName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                  <Calendar size={10} className="text-white/60" />
                </div>
                <span className="text-white/60 truncate">{lesson.moduleName}</span>
              </div>
            </div>

            {/* Description */}
            {lesson.description && (
              <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                {lesson.description}
              </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              {/* Duration */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors duration-300">
                  <Clock size={14} className="text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('duration')}</p>
                  <p className="text-xs font-semibold text-white">{lesson.formattedDuration}</p>
                </div>
              </div>

              {/* Views */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors duration-300">
                  <Eye size={14} className="text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">{t('viewsLabel')}</p>
                  <p className="text-xs font-semibold text-white">{lesson.viewCount || 0}</p>
                </div>
              </div>
            </div>

            {/* Action Badge */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-xs text-white/50">
                {new Date(lesson.recordedAt).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale === 'it' ? 'it-IT' : 'es-ES', {
                  day: '2-digit',
                  month: 'short'
                })}
              </div>
              <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 font-semibold">
                <Play size={12} />
                {t('watch')}
              </div>
            </div>
          </div>

          {/* Hover Gradient Overlay */}
          <div
            ref={gradientRef}
            className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-secondary/10 opacity-0 transition-opacity duration-500 pointer-events-none"
          ></div>

          {/* Hover Ring */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-secondary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </Link>
    );
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <RecordingCard key={lesson.lessonId} lesson={lesson} />
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
