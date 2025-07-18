// /src/components/CoursesList.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen,
  Edit,
  Trash2,
  Eye,
  Search,
  Globe,
} from 'lucide-react';
import Image from 'next/image';
import CourseViewModal from './CourseViewModal';
import CourseEditModal from './CourseEditModal';
import CourseDependenciesModal from './CourseDependenciesModal';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}

interface DependencyEntity {
  type: 'module' | 'track';
  id: string;
  name: string;
  description: string;
  actionRequired: string;
  relatedEntities?: {
    lessons?: number;
    videos?: number;
  };
}

interface DependenciesData {
  error: string;
  message: string;
  canDelete: boolean;
  dependencies: DependencyEntity[];
  summary: {
    modules: number;
    tracks: number;
    lessons: number;
    videos: number;
  };
  totalDependencies: number;
  actionRequired: string;
}

// Type guard for fetch errors
interface FetchError {
  status: number;
  data: unknown;
}

export default function CoursesList() {
  const t = useTranslations('Admin.coursesList');
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as string;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<
    string | null
  >(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<
    string | null
  >(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] =
    useState<Course | null>(null);

  const [dependenciesModalOpen, setDependenciesModalOpen] =
    useState(false);
  const [selectedCourseName, setSelectedCourseName] =
    useState('');
  const [dependenciesData, setDependenciesData] =
    useState<DependenciesData | null>(null);

  const getAuthToken = () => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2)
        return parts.pop()?.split(';').shift() || null;
      return null;
    };
    return (
      getCookie('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken')
    );
  };

  const isDependenciesResponse = (
    data: unknown
  ): data is DependenciesData =>
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    'dependencies' in data &&
    'summary' in data;

  const hasCourseDependenciesError = (
    data: unknown
  ): boolean =>
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    (data as Record<string, unknown>).error ===
      'COURSE_HAS_DEPENDENCIES';

  const getErrorMessage = (
    data: unknown
  ): string | undefined =>
    typeof data === 'object' &&
    data !== null &&
    'message' in data
      ? String((data as Record<string, unknown>).message)
      : undefined;

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token)
        headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        { headers }
      );

      if (!res.ok) throw new Error('fetch');

      const data: Course[] = await res.json();
      setCourses(data);
    } catch {
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const deleteCourse = useCallback(
    async (courseId: string) => {
      setDeletingId(courseId);
      try {
        const token = getAuthToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token)
          headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`,
          { method: 'DELETE', headers }
        );
        let data: unknown = null;
        try {
          data = await res.json();
        } catch {}

        if (!res.ok) throw { status: res.status, data };

        toast({
          title: t('success.deleteTitle'),
          description: t('success.deleteDescription'),
          variant: 'success',
        });
        fetchCourses();
      } catch (err: unknown) {
        const fetchError = err as FetchError;
        if (
          fetchError.status === 400 &&
          hasCourseDependenciesError(fetchError.data) &&
          isDependenciesResponse(fetchError.data)
        ) {
          const course = courses.find(
            c => c.id === deletingId
          );
          setSelectedCourseName(
            course?.translations.find(
              tr => tr.locale === locale
            )?.title ||
              course?.slug ||
              ''
          );
          setDependenciesData(fetchError.data);
          setDependenciesModalOpen(true);
        } else {
          const msg =
            fetchError.data &&
            typeof fetchError.data === 'object' &&
            'message' in fetchError.data
              ? getErrorMessage(fetchError.data)
              : err instanceof Error
              ? err.message
              : t('error.deleteDescription');
          toast({
            title: t('error.deleteTitle'),
            description: msg,
            variant: 'destructive',
          });
        }
      } finally {
        setDeletingId(null);
      }
    },
    [courses, deletingId, fetchCourses, locale, t, toast]
  );

  const handleDelete = useCallback(
    (courseId: string) => {
      const course = courses.find(c => c.id === courseId);
      const name =
        course?.translations.find(
          tr => tr.locale === locale
        )?.title ||
        course?.slug ||
        '';
      const total =
        dependenciesData?.totalDependencies ?? 0;

      toast({
        title: t('deleteConfirmation.title'),
        description: (
          <div className="space-y-2">
            <p>
              {t('deleteConfirmation.message', {
                courseName: name,
              })}
            </p>
            <div className="p-3 bg-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} />
                  {t('deleteConfirmation.slug')}:{' '}
                  <span className="font-medium">
                    {course?.slug}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} />
                  {t(
                    'deleteConfirmation.dependencies'
                  )}:{' '}
                  <span className="font-medium">
                    {total}
                  </span>
                </div>
                <div className="text-red-300 font-medium">
                  {t('deleteConfirmation.warning')}
                </div>
              </div>
            </div>
          </div>
        ),
        variant: 'destructive',
        action: (
          <button
            onClick={() => deleteCourse(courseId)}
            className="inline-flex h-8 items-center px-3 bg-red-600 text-white rounded"
          >
            {t('deleteConfirmation.confirm')}
          </button>
        ),
      });
    },
    [
      courses,
      deleteCourse,
      dependenciesData,
      locale,
      t,
      toast,
    ]
  );

  const handleView = (id: string) => {
    if (deletingId) return;
    setSelectedCourseId(id);
    setViewModalOpen(true);
  };

  const handleEdit = (course: Course) => {
    if (deletingId) return;
    setEditingCourse(course);
    setEditModalOpen(true);
  };

  const filtered = courses.filter(c => {
    const tr =
      c.translations.find(tr => tr.locale === locale) ||
      c.translations[0];
    return (
      c.slug
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      tr.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        {/* skeleton placeholder */}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <BookOpen
              size={24}
              className="text-secondary"
            />{' '}
            {t('title')}
          </h3>
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              disabled={!!deletingId}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-white">
              {courses.length}
            </p>
            <p className="text-sm text-gray-400">
              {t('stats.total')}
            </p>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(course => {
              const tr =
                course.translations.find(
                  tr => tr.locale === locale
                ) || course.translations[0];
              return (
                <div
                  key={course.id}
                  className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="relative w-24 h-16 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={course.imageUrl}
                      alt={tr.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-white truncate">
                      {tr.title}
                    </h4>
                    <p className="text-sm text-gray-400 truncate line-clamp-1">
                      {tr.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Slug: {course.slug}</span>
                      <span>
                        ID: {course.id.slice(0, 8)}…
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe size={12} />{' '}
                        {course.translations.length}/3{' '}
                        {t('languages')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(course.id)}
                      disabled={!!deletingId}
                      title={t('actions.view')}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(course)}
                      disabled={!!deletingId}
                      title={t('actions.edit')}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(course.id)
                      }
                      disabled={deletingId === course.id}
                      title={t('actions.delete')}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === course.id ? (
                        <div className="animate-spin h-[18px] w-[18px] border-2 border-red-400 border-t-transparent rounded-full" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen
              size={64}
              className="text-gray-500 mx-auto mb-4"
            />
            <p className="text-gray-400">
              {searchTerm ? t('noResults') : t('noCourses')}
            </p>
          </div>
        )}
      </div>

      <CourseViewModal
        courseId={selectedCourseId}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCourseId(null);
        }}
      />
      <CourseEditModal
        course={editingCourse}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCourse(null);
        }}
        onSave={() => {
          setEditModalOpen(false);
          setEditingCourse(null);
          fetchCourses();
        }}
      />
      <CourseDependenciesModal
        isOpen={dependenciesModalOpen}
        onClose={() => {
          setDependenciesModalOpen(false);
          setDependenciesData(null);
        }}
        courseName={selectedCourseName}
        dependenciesData={dependenciesData}
      />
    </>
  );
}
