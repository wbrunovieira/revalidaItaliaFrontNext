'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  Edit,
  Trash2,
  Eye,
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Video,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import LessonViewModal from './LessonViewModal';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  imageUrl?: string;
  videoId?: string;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface Module {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
  lessons?: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
  modules?: Module[];
}

export default function LessonsList() {
  const t = useTranslations('Admin.lessonsList');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [coursesWithLessons, setCoursesWithLessons] =
    useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<
    Set<string>
  >(new Set());
  const [expandedModules, setExpandedModules] = useState<
    Set<string>
  >(new Set());

  // Estados para o modal de visualização
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<
    string | null
  >(null);
  const [selectedModuleId, setSelectedModuleId] = useState<
    string | null
  >(null);
  const [selectedLessonId, setSelectedLessonId] = useState<
    string | null
  >(null);

  // Função para tratamento centralizado de erros
  const handleApiError = useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);

      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
      }
    },
    []
  );

  // Função para buscar aulas de um módulo específico
  const fetchLessonsForModule = useCallback(
    async (
      courseId: string,
      moduleId: string
    ): Promise<Lesson[]> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/modules/${moduleId}/lessons`
        );

        if (!response.ok) {
          return [];
        }

        const lessonsData = await response.json();
        // Garantir que as aulas estejam ordenadas por order
        const lessons = lessonsData.lessons || [];
        return lessons.sort(
          (a: Lesson, b: Lesson) => a.order - b.order
        );
      } catch (error) {
        handleApiError(
          error,
          `Error fetching lessons for module ${moduleId}`
        );
        return [];
      }
    },
    [handleApiError]
  );

  // Função para buscar módulos de um curso específico
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<Module[]> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/modules`
        );

        if (!response.ok) {
          return [];
        }

        const modules: Module[] = await response.json();

        // Buscar aulas para cada módulo
        const modulesWithLessons = await Promise.all(
          modules.map(async module => {
            const lessons = await fetchLessonsForModule(
              courseId,
              module.id
            );
            return { ...module, lessons };
          })
        );

        // Garantir que os módulos estejam ordenados
        return modulesWithLessons.sort(
          (a, b) => a.order - b.order
        );
      } catch (error) {
        handleApiError(
          error,
          `Error fetching modules for course ${courseId}`
        );
        return [];
      }
    },
    [handleApiError, fetchLessonsForModule]
  );

  // Função principal para buscar todos os dados
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const coursesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`
      );

      if (!coursesResponse.ok) {
        throw new Error(
          `Failed to fetch courses: ${coursesResponse.status}`
        );
      }

      const courses: Course[] =
        await coursesResponse.json();

      const coursesWithData = await Promise.all(
        courses.map(async course => {
          const modules = await fetchModulesForCourse(
            course.id
          );
          return { ...course, modules };
        })
      );

      setCoursesWithLessons(coursesWithData);
    } catch (error) {
      handleApiError(error, 'Courses fetch error');
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t, handleApiError, fetchModulesForCourse]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função para abrir o modal de visualização
  const handleView = useCallback(
    (
      courseId: string,
      moduleId: string,
      lessonId: string
    ): void => {
      setSelectedCourseId(courseId);
      setSelectedModuleId(moduleId);
      setSelectedLessonId(lessonId);
      setViewModalOpen(true);
    },
    []
  );

  const handleDelete = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string
    ) => {
      if (!confirm(t('deleteConfirm'))) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete lesson: ${response.status}`
          );
        }

        toast({
          title: t('success.deleteTitle'),
          description: t('success.deleteDescription'),
        });

        await fetchData();
      } catch (error) {
        handleApiError(error, 'Lesson deletion error');
        toast({
          title: t('error.deleteTitle'),
          description: t('error.deleteDescription'),
          variant: 'destructive',
        });
      }
    },
    [t, toast, fetchData, handleApiError]
  );

  const toggleCourse = useCallback((courseId: string) => {
    setExpandedCourses(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(courseId)) {
        newExpanded.delete(courseId);
      } else {
        newExpanded.add(courseId);
      }
      return newExpanded;
    });
  }, []);

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(moduleId)) {
        newExpanded.delete(moduleId);
      } else {
        newExpanded.add(moduleId);
      }
      return newExpanded;
    });
  }, []);

  const getTranslationByLocale = useCallback(
    (translations: Translation[], targetLocale: string) => {
      return (
        translations.find(
          tr => tr.locale === targetLocale
        ) || translations[0]
      );
    },
    []
  );

  // Filtrar baseado na busca
  const filteredCourses = coursesWithLessons.filter(
    course => {
      const courseTranslation = getTranslationByLocale(
        course.translations,
        locale
      );
      const courseMatches =
        course.slug
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        courseTranslation?.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      if (courseMatches) return true;

      return course.modules?.some(module => {
        const moduleTranslation = getTranslationByLocale(
          module.translations,
          locale
        );
        const moduleMatches =
          module.slug
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          moduleTranslation?.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        if (moduleMatches) return true;

        return module.lessons?.some(lesson => {
          const lessonTranslation = getTranslationByLocale(
            lesson.translations,
            locale
          );
          return (
            lessonTranslation?.title
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            lessonTranslation?.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          );
        });
      });
    }
  );

  // Estatísticas
  const totalCourses = coursesWithLessons.length;
  const totalModules = coursesWithLessons.reduce(
    (sum, course) => sum + (course.modules?.length || 0),
    0
  );
  const totalLessons = coursesWithLessons.reduce(
    (sum, course) =>
      sum +
      (course.modules?.reduce(
        (moduleSum, module) =>
          moduleSum + (module.lessons?.length || 0),
        0
      ) || 0),
    0
  );

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
    <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <Play size={24} className="text-secondary" />
          {t('title')}
        </h3>

        {/* Barra de busca */}
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
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {totalCourses}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalCourses')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {totalModules}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalModules')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {totalLessons}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalLessons')}
          </p>
        </div>
      </div>

      {/* Lista hierárquica */}
      {filteredCourses.length > 0 ? (
        <div className="space-y-4">
          {filteredCourses.map(course => {
            const courseTranslation =
              getTranslationByLocale(
                course.translations,
                locale
              );
            const isCourseExpanded = expandedCourses.has(
              course.id
            );
            const moduleCount = course.modules?.length || 0;

            return (
              <div
                key={course.id}
                className="border border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Cabeçalho do curso */}
                <div
                  onClick={() => toggleCourse(course.id)}
                  className="flex items-center gap-4 p-4 bg-gray-700/50 hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <button
                    type="button"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {isCourseExpanded ? (
                      <ChevronDown size={20} />
                    ) : (
                      <ChevronRight size={20} />
                    )}
                  </button>

                  <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={course.imageUrl}
                      alt={courseTranslation?.title || ''}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white">
                      {courseTranslation?.title ||
                        'Sem título'}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Slug: {course.slug}</span>
                      <span className="flex items-center gap-1">
                        <Package size={12} />
                        {moduleCount} {t('modules')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Módulos do curso */}
                {isCourseExpanded && (
                  <div className="bg-gray-800/50 p-4">
                    {moduleCount > 0 ? (
                      <div className="space-y-3">
                        {course.modules?.map(module => {
                          const moduleTranslation =
                            getTranslationByLocale(
                              module.translations,
                              locale
                            );
                          const isModuleExpanded =
                            expandedModules.has(module.id);
                          const lessonCount =
                            module.lessons?.length || 0;

                          return (
                            <div
                              key={module.id}
                              className="border border-gray-600 rounded-lg overflow-hidden"
                            >
                              {/* Cabeçalho do módulo */}
                              <div
                                onClick={() =>
                                  toggleModule(module.id)
                                }
                                className="flex items-center gap-4 p-3 bg-gray-700/30 hover:bg-gray-700/50 transition-colors cursor-pointer"
                              >
                                <button
                                  type="button"
                                  className="text-gray-400 hover:text-white transition-colors"
                                >
                                  {isModuleExpanded ? (
                                    <ChevronDown
                                      size={16}
                                    />
                                  ) : (
                                    <ChevronRight
                                      size={16}
                                    />
                                  )}
                                </button>

                                <div className="flex items-center justify-center w-8 h-8 bg-secondary/20 text-secondary rounded-full font-bold text-sm">
                                  {module.order}
                                </div>

                                {module.imageUrl ? (
                                  <div className="relative w-10 h-6 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={module.imageUrl}
                                      alt={
                                        moduleTranslation?.title ||
                                        ''
                                      }
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-6 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                                    <Package
                                      size={12}
                                      className="text-gray-400"
                                    />
                                  </div>
                                )}

                                <div className="flex-1">
                                  <h5 className="text-white font-medium">
                                    {moduleTranslation?.title ||
                                      'Sem título'}
                                  </h5>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>
                                      Slug: {module.slug}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Play size={10} />
                                      {lessonCount}{' '}
                                      {t('lessons')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Aulas do módulo */}
                              {isModuleExpanded && (
                                <div className="bg-gray-800/30 p-4">
                                  {lessonCount > 0 ? (
                                    <div className="space-y-3">
                                      {module.lessons?.map(
                                        lesson => {
                                          const lessonTranslation =
                                            getTranslationByLocale(
                                              lesson.translations,
                                              locale
                                            );

                                          return (
                                            <div
                                              key={
                                                lesson.id
                                              }
                                              className="flex items-center gap-4 p-3 bg-gray-700/30 border border-gray-700/50 rounded hover:bg-gray-700/50 transition-colors"
                                            >
                                              <div className="flex items-center justify-center w-8 h-8 bg-secondary/20 text-secondary rounded-full font-bold text-sm">
                                                {
                                                  lesson.order
                                                }
                                              </div>

                                              {lesson.imageUrl ? (
                                                <div className="relative w-10 h-6 rounded overflow-hidden flex-shrink-0">
                                                  <Image
                                                    src={
                                                      lesson.imageUrl
                                                    }
                                                    alt={
                                                      lessonTranslation?.title ||
                                                      ''
                                                    }
                                                    fill
                                                    className="object-cover"
                                                  />
                                                </div>
                                              ) : (
                                                <div className="w-10 h-6 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                                                  <Play
                                                    size={
                                                      14
                                                    }
                                                    className="text-gray-400"
                                                  />
                                                </div>
                                              )}

                                              <div className="flex-1">
                                                <h6 className="text-white text-base font-medium">
                                                  {lessonTranslation?.title ||
                                                    'Sem título'}
                                                </h6>
                                                <p className="text-sm text-gray-400 line-clamp-1">
                                                  {lessonTranslation?.description ||
                                                    'Sem descrição'}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                  {lesson.videoId && (
                                                    <span className="flex items-center gap-1.5">
                                                      <Video
                                                        size={
                                                          12
                                                        }
                                                      />
                                                      {t(
                                                        'hasVideo'
                                                      )}
                                                    </span>
                                                  )}
                                                  <span className="flex items-center gap-1.5">
                                                    <Clock
                                                      size={
                                                        12
                                                      }
                                                    />
                                                    {new Date(
                                                      lesson.createdAt
                                                    ).toLocaleDateString()}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Ações */}
                                              <div className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    handleView(
                                                      course.id,
                                                      module.id,
                                                      lesson.id
                                                    );
                                                  }}
                                                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                                                  title={t(
                                                    'actions.view'
                                                  )}
                                                >
                                                  <Eye
                                                    size={
                                                      16
                                                    }
                                                  />
                                                </button>
                                                <button
                                                  type="button"
                                                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                                                  title={t(
                                                    'actions.edit'
                                                  )}
                                                >
                                                  <Edit
                                                    size={
                                                      16
                                                    }
                                                  />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    handleDelete(
                                                      course.id,
                                                      module.id,
                                                      lesson.id
                                                    );
                                                  }}
                                                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
                                                  title={t(
                                                    'actions.delete'
                                                  )}
                                                >
                                                  <Trash2
                                                    size={
                                                      16
                                                    }
                                                  />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4">
                                      <Play
                                        size={32}
                                        className="text-gray-500 mx-auto mb-2"
                                      />
                                      <p className="text-gray-400 text-sm">
                                        {t('noLessons')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package
                          size={48}
                          className="text-gray-500 mx-auto mb-2"
                        />
                        <p className="text-gray-400">
                          {t('noModules')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Play
            size={64}
            className="text-gray-500 mx-auto mb-4"
          />
          <p className="text-gray-400">
            {searchTerm ? t('noResults') : t('noCourses')}
          </p>
        </div>
      )}

      {/* Modal de Visualização da Lição */}
      <LessonViewModal
        courseId={selectedCourseId}
        moduleId={selectedModuleId}
        lessonId={selectedLessonId}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCourseId(null);
          setSelectedModuleId(null);
          setSelectedLessonId(null);
        }}
      />
    </div>
  );
}
