'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileQuestion,
  FileText,
  Filter,
  X,
  BookOpen,
  Package,
  Play,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type AssessmentType = 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
type QuizPosition = 'BEFORE_LESSON' | 'AFTER_LESSON' | null;

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: AssessmentType;
  quizPosition: QuizPosition;
  passingScore?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  lessonId?: string;
  lesson?: {
    id: string;
    title: string;
    module?: {
      id: string;
      title: string;
      course?: {
        id: string;
        title: string;
      };
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
}

interface Module {
  id: string;
  title: string;
  slug: string;
  order: number;
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  order: number;
}

export default function AssessmentsList() {
  const t = useTranslations('Admin.assessmentsList');
  const { toast } = useToast();
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<AssessmentType | 'ALL'>('ALL');
  const [lessonFilter, setLessonFilter] = useState<string>('');
  const [showLessonFilter, setShowLessonFilter] = useState(false);
  
  // Progressive loading states for lesson filter
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Load assessments
  const loadAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (typeFilter !== 'ALL') {
        params.append('type', typeFilter);
      }
      
      if (lessonFilter) {
        params.append('lessonId', lessonFilter);
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assessments?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load assessments');
      }

      const data = await response.json();
      setAssessments(data.assessments || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, typeFilter, lessonFilter, t, toast]);

  // Load courses when lesson filter is opened
  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load courses');
      }

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: t('error.loadCoursesTitle'),
        description: t('error.loadCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [t, toast]);

  // Load modules when course is selected
  const loadModules = async (courseId: string) => {
    setLoadingModules(true);
    setModules([]);
    setLessons([]);
    setSelectedModule('');
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/modules`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load modules');
      }

      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error('Error loading modules:', error);
      toast({
        title: t('error.loadModulesTitle'),
        description: t('error.loadModulesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingModules(false);
    }
  };

  // Load lessons when module is selected
  const loadLessons = async (courseId: string, moduleId: string) => {
    setLoadingLessons(true);
    setLessons([]);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/modules/${moduleId}/lessons`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load lessons');
      }

      const data = await response.json();
      console.log('Lessons response:', data);
      // Check if data is an array or wrapped in an object
      const lessonsArray = Array.isArray(data) ? data : (data.lessons || []);
      setLessons(lessonsArray);
    } catch (error) {
      console.error('Error loading lessons:', error);
      toast({
        title: t('error.loadLessonsTitle'),
        description: t('error.loadLessonsDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingLessons(false);
    }
  };

  // Load assessments when component mounts or filters change
  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  // Load courses when lesson filter is opened
  useEffect(() => {
    if (showLessonFilter && courses.length === 0) {
      loadCourses();
    }
  }, [showLessonFilter, courses.length, loadCourses]);

  // Handle course selection
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    if (courseId) {
      loadModules(courseId);
    } else {
      setModules([]);
      setLessons([]);
      setSelectedModule('');
    }
  };

  // Handle module selection
  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId);
    if (moduleId && selectedCourse) {
      loadLessons(selectedCourse, moduleId);
    } else {
      setLessons([]);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: string) => {
    setPagination(prev => ({ ...prev, limit: parseInt(newLimit), page: 1 }));
  };

  // Clear lesson filter
  const clearLessonFilter = () => {
    setLessonFilter('');
    setSelectedCourse('');
    setSelectedModule('');
    setModules([]);
    setLessons([]);
    setShowLessonFilter(false);
  };

  // Get icon for assessment type
  const getAssessmentIcon = (type: AssessmentType) => {
    switch (type) {
      case 'QUIZ':
        return <ClipboardList size={16} className="text-blue-400" />;
      case 'SIMULADO':
        return <FileQuestion size={16} className="text-green-400" />;
      case 'PROVA_ABERTA':
        return <FileText size={16} className="text-purple-400" />;
    }
  };

  // Get badge color for assessment type
  const getTypeBadgeColor = (type: AssessmentType) => {
    switch (type) {
      case 'QUIZ':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'SIMULADO':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PROVA_ABERTA':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get Portuguese title for course/module/lesson
  const getPortugueseTitle = (translations: Course['translations']) => {
    const pt = translations.find(t => t.locale === 'pt');
    return pt?.title || translations[0]?.title || '';
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-gray-300">{t('filters.type')}</Label>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as AssessmentType | 'ALL');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="ALL" className="text-white hover:bg-gray-600">
                  {t('filters.allTypes')}
                </SelectItem>
                <SelectItem value="QUIZ" className="text-white hover:bg-gray-600">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} />
                    {t('types.quiz')}
                  </div>
                </SelectItem>
                <SelectItem value="SIMULADO" className="text-white hover:bg-gray-600">
                  <div className="flex items-center gap-2">
                    <FileQuestion size={16} />
                    {t('types.simulado')}
                  </div>
                </SelectItem>
                <SelectItem value="PROVA_ABERTA" className="text-white hover:bg-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    {t('types.provaAberta')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lesson Filter Toggle */}
          <button
            onClick={() => setShowLessonFilter(!showLessonFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showLessonFilter 
                ? 'bg-secondary text-primary font-semibold' 
                : 'border border-gray-600 text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Filter size={16} />
            {t('filters.byLesson')}
          </button>

          {/* Clear Filters */}
          {(typeFilter !== 'ALL' || lessonFilter) && (
            <button
              onClick={() => {
                setTypeFilter('ALL');
                clearLessonFilter();
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X size={16} />
              {t('filters.clear')}
            </button>
          )}
        </div>

        {/* Lesson Filter Section */}
        {showLessonFilter && (
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">{t('filters.lessonFilter')}</h3>
              <button
                onClick={clearLessonFilter}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              {/* Course Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <BookOpen size={16} />
                  {t('filters.course')}
                </Label>
                <Select
                  value={selectedCourse}
                  onValueChange={handleCourseChange}
                  disabled={loadingCourses}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder={loadingCourses ? t('loading') : t('filters.selectCourse')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {courses.map(course => (
                      <SelectItem
                        key={course.id}
                        value={course.id}
                        className="text-white hover:bg-gray-600"
                      >
                        {getPortugueseTitle(course.translations)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Module Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Package size={16} />
                  {t('filters.module')}
                </Label>
                <Select
                  value={selectedModule}
                  onValueChange={handleModuleChange}
                  disabled={!selectedCourse || loadingModules}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder={
                      !selectedCourse ? t('filters.selectCourseFirst') :
                      loadingModules ? t('loading') :
                      t('filters.selectModule')
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {modules.map(module => (
                      <SelectItem
                        key={module.id}
                        value={module.id}
                        className="text-white hover:bg-gray-600"
                      >
                        {module.order}. {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lesson Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Play size={16} />
                  {t('filters.lesson')}
                </Label>
                <Select
                  value={lessonFilter}
                  onValueChange={(value) => {
                    setLessonFilter(value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  disabled={!selectedModule || loadingLessons}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder={
                      !selectedModule ? t('filters.selectModuleFirst') :
                      loadingLessons ? t('loading') :
                      t('filters.selectLesson')
                    } />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {lessons.map(lesson => (
                      <SelectItem
                        key={lesson.id}
                        value={lesson.id}
                        className="text-white hover:bg-gray-600"
                      >
                        {lesson.order}. {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-gray-400">
        {t('showing', { count: assessments.length, total: pagination.total })}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.title')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.type')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.passingScore')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.lesson')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.createdAt')}
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-secondary"></div>
                      {t('loading')}
                    </div>
                  </td>
                </tr>
              ) : assessments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    {t('noAssessments')}
                  </td>
                </tr>
              ) : (
                assessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getAssessmentIcon(assessment.type)}
                        <div>
                          <div className="text-white font-medium">{assessment.title}</div>
                          {assessment.description && (
                            <div className="text-gray-400 text-sm truncate max-w-xs">
                              {assessment.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(assessment.type)}`}>
                        {t(`types.${assessment.type.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {assessment.passingScore ? `${assessment.passingScore}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {assessment.lesson ? (
                        <div className="text-sm">
                          <div>{assessment.lesson.title}</div>
                          {assessment.lesson.module && (
                            <div className="text-gray-500 text-xs">
                              {assessment.lesson.module.title}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {formatDate(assessment.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            // TODO: Implement view modal
                            toast({
                              title: t('comingSoon'),
                              description: t('viewFeature'),
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title={t('actions.view')}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement edit modal
                            toast({
                              title: t('comingSoon'),
                              description: t('editFeature'),
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          title={t('actions.edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement delete
                            toast({
                              title: t('comingSoon'),
                              description: t('deleteFeature'),
                            });
                          }}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t('actions.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-800/50 rounded-lg">
          {/* Page Info */}
          <div className="text-sm text-gray-400">
            {t('pagination.pageOf', { current: pagination.page, total: pagination.totalPages })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Limit Selector */}
            <div className="flex items-center gap-2">
              <Label className="text-gray-400 text-sm">{t('pagination.perPage')}</Label>
              <Select
                value={pagination.limit.toString()}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="w-20 bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="5" className="text-white hover:bg-gray-600">5</SelectItem>
                  <SelectItem value="10" className="text-white hover:bg-gray-600">10</SelectItem>
                  <SelectItem value="20" className="text-white hover:bg-gray-600">20</SelectItem>
                  <SelectItem value="50" className="text-white hover:bg-gray-600">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={!pagination.hasPrevious}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('pagination.first')}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevious}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('pagination.previous')}
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.page;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-secondary text-primary font-semibold'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {pagination.totalPages > 5 && (
                  <span className="text-gray-500 px-2">...</span>
                )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('pagination.next')}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={!pagination.hasNext}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('pagination.last')}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}