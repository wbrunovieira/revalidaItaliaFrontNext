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

  // Estados para o modal de visualização
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<
    string | null
  >(null);

  // Estados para o modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] =
    useState<Course | null>(null);

  // Estados para o modal de dependências
  const [dependenciesModalOpen, setDependenciesModalOpen] =
    useState(false);
  const [selectedCourseName, setSelectedCourseName] =
    useState('');
  const [dependenciesData, setDependenciesData] =
    useState<DependenciesData | null>(null);

  // Função auxiliar para obter o token
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

  // Função auxiliar para verificar se é uma resposta de dependências
  const isDependenciesResponse = (
    data: unknown
  ): data is DependenciesData => {
    return (
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      'dependencies' in data &&
      'summary' in data
    );
  };

  // Função auxiliar para verificar se tem erro de dependências
  const hasCourseDependenciesError = (
    data: unknown
  ): boolean => {
    return (
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      (data as { error?: unknown }).error ===
        'COURSE_HAS_DEPENDENCIES'
    );
  };

  // Função auxiliar para obter mensagem de erro
  const getErrorMessage = (
    data: unknown
  ): string | undefined => {
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data
    ) {
      const msg = (data as { message?: unknown }).message;
      return typeof msg === 'string' ? msg : undefined;
    }
    return undefined;
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data: Course[] = await response.json();
      setCourses(data);
    } catch (error) {
      console.error(error);
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

  const handleDelete = async (
    courseId: string,
    skipConfirmation = false
  ) => {
    if (!skipConfirmation && !confirm(t('deleteConfirm')))
      return;

    // Encontrar o nome do curso
    const course = courses.find(c => c.id === courseId);
    const courseName =
      course?.translations.find(tr => tr.locale === locale)
        ?.title ||
      course?.translations[0]?.title ||
      course?.slug ||
      '';

    setDeletingId(courseId);

    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      // Tentar obter dados da resposta
      let responseData: unknown = null;
      try {
        responseData = await response.json();
      } catch {
        // Se não conseguir fazer parse do JSON, continuar sem dados
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Curso não encontrado');
        } else if (response.status === 401) {
          throw new Error(
            'Não autorizado - faça login novamente'
          );
        } else if (
          response.status === 400 &&
          hasCourseDependenciesError(responseData) &&
          isDependenciesResponse(responseData)
        ) {
          // Abrir modal de dependências
          setSelectedCourseName(courseName);
          setDependenciesData(responseData);
          setDependenciesModalOpen(true);
          return; // Não mostrar toast de erro, apenas abrir o modal
        } else if (
          response.status === 400 ||
          response.status === 409
        ) {
          const errorMessage =
            getErrorMessage(responseData) ||
            'Não é possível excluir este curso. Verifique se não há módulos, lições ou se o curso não está sendo usado em alguma trilha.';
          throw new Error(errorMessage);
        } else {
          const errorMessage =
            getErrorMessage(responseData) ||
            'Erro ao excluir curso';
          throw new Error(errorMessage);
        }
      }

      toast({
        title: t('success.deleteTitle'),
        description: t('success.deleteDescription'),
      });

      // Recarregar a lista de cursos
      await fetchCourses();
    } catch (error) {
      console.error('Erro ao deletar curso:', error);

      const message =
        error instanceof Error
          ? error.message
          : t('error.deleteDescription');

      toast({
        title: t('error.deleteTitle'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (courseId: string) => {
    if (deletingId !== null) return; // Não abrir modal durante exclusão
    setSelectedCourseId(courseId);
    setViewModalOpen(true);
  };

  const handleEdit = (course: Course) => {
    if (deletingId !== null) return; // Não abrir modal durante exclusão
    setEditingCourse(course);
    setEditModalOpen(true);
  };

  const filteredCourses = courses.filter(course => {
    const tr =
      course.translations.find(
        tr => tr.locale === locale
      ) ?? course.translations[0];
    return (
      course.slug
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      tr.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      tr.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-24 bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
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
            />
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
              disabled={deletingId !== null}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Estatísticas */}
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

        {/* Lista */}
        {filteredCourses.length > 0 ? (
          <div className="space-y-4">
            {filteredCourses.map(course => {
              const tr =
                course.translations.find(
                  tr => tr.locale === locale
                ) ?? course.translations[0];
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
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white">
                      {tr.title}
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-1">
                      {tr.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Slug: {course.slug}</span>
                      <span>
                        ID: {course.id.slice(0, 8)}…
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe size={12} />
                        {course.translations.length}/3{' '}
                        {t('languages')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(course.id)}
                      disabled={deletingId !== null}
                      title={t('actions.view')}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(course)}
                      disabled={deletingId !== null}
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

      {/* Modal de visualização */}
      <CourseViewModal
        courseId={selectedCourseId}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCourseId(null);
        }}
      />

      {/* Modal de edição */}
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
          fetchCourses(); // Recarregar a lista
        }}
      />

      {/* Modal de dependências */}
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
