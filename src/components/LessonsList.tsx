// /src/components/LessonsList.tsx
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
  ChevronLeft,
  Package,
  Video,
  Clock,
  BookOpen,
  ListOrdered,
  FileText,
  MessageSquare,
  CreditCard,
  Radio,
  Music,
  Gamepad2,
  Box,
} from 'lucide-react';
import Image from 'next/image';
import LessonViewModal from './LessonViewModal';
import LessonEditModal from './LessonEditModal';
import ConvertToLiveModal from './ConvertToLiveModal';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface VideoData {
  id: string;
  slug: string;
  providerVideoId: string;
  durationInSeconds: number;
  isSeen: boolean;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface AudioData {
  id: string;
  order: number;
}

interface AnimationData {
  id: string;
  type: 'CompleteSentence' | 'MultipleChoice';
  enabled: boolean;
}

interface Lesson {
  id: string;
  moduleId: string;
  courseId?: string;
  order: number;
  imageUrl?: string;
  videoId?: string;
  flashcardIds: string[];
  quizIds: string[];
  commentIds: string[];
  translations: Translation[];
  video?: VideoData;
  createdAt: string;
  updatedAt: string;
  // Interactive Lessons fields - from list route (booleans)
  type?: 'STANDARD' | 'ENVIRONMENT_3D';
  hasAudios?: boolean;
  hasAnimations?: boolean;
  environment3dId?: string | null;
  // From detail route (arrays) - optional for view modal
  audios?: AudioData[];
  animations?: AnimationData[];
}

interface LessonForEdit {
  id: string;
  moduleId: string;
  order: number;
  videoId?: string;
  flashcardIds: string[];
  quizIds: string[];
  commentIds: string[];
  imageUrl: string;
  translations: Translation[];
  video?: VideoData;
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

  // Estados para paginação de aulas por módulo
  const [modulePagination, setModulePagination] = useState<
    Record<string, { page: number; totalPages: number; total: number }>
  >({});

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

  // Estados para o modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLessonForEdit, setSelectedLessonForEdit] =
    useState<LessonForEdit | null>(null);
  const [selectedCourseForEdit, setSelectedCourseForEdit] =
    useState<string | null>(null);
  const [selectedModuleForEdit, setSelectedModuleForEdit] =
    useState<string | null>(null);

  // Estados para o modal de conversão
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [selectedLessonForConvert, setSelectedLessonForConvert] =
    useState<Lesson | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333';

  // 1. Função auxiliar para obter tradução por locale
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

  // 2. Função para tratamento centralizado de erros
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

  // 3. Função para buscar aulas de um módulo específico
  const fetchLessonsForModule = useCallback(
    async (
      courseId: string,
      moduleId: string,
      page: number = 1
    ): Promise<Lesson[]> => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons?page=${page}&limit=10`
        );

        if (!response.ok) {
          return [];
        }

        const lessonsData = await response.json();

        // Atualizar informações de paginação para este módulo
        if (lessonsData.pagination) {
          setModulePagination(prev => ({
            ...prev,
            [moduleId]: {
              page: lessonsData.pagination.page,
              totalPages: lessonsData.pagination.totalPages,
              total: lessonsData.pagination.total,
            }
          }));
        }

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
    [handleApiError, apiUrl]
  );

  // 4. Função para buscar módulos de um curso específico
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<Module[]> => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules`
        );

        if (!response.ok) {
          return [];
        }

        const modules: Module[] = await response.json();

        // Buscar aulas para cada módulo
        const modulesWithLessons = await Promise.all(
          modules.map(async moduleItem => {
            const lessons = await fetchLessonsForModule(
              courseId,
              moduleItem.id
            );
            return { ...moduleItem, lessons };
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
    [handleApiError, fetchLessonsForModule, apiUrl]
  );

  // 5. Função principal para buscar todos os dados
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const coursesResponse = await fetch(
        `${apiUrl}/api/v1/courses`
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
  }, [
    toast,
    t,
    handleApiError,
    fetchModulesForCourse,
    apiUrl,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 6. Função para deletar lição após confirmação
  const deleteLesson = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string
    ) => {
      try {
        // Primeiro, buscar os dados da lição para obter a URL da imagem
        const course = coursesWithLessons.find(c => c.id === courseId);
        const foundModule = course?.modules?.find(m => m.id === moduleId);
        const lesson = foundModule?.lessons?.find(l => l.id === lessonId);
        
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          const errorData = await response.json();

          // Se for erro 409 (conflito de dependências)
          if (
            response.status === 409 &&
            errorData.dependencyInfo
          ) {
            const { summary, dependencies } =
              errorData.dependencyInfo;

            toast({
              title: t('error.deleteDependencyTitle'),
              description: (
                <div className="space-y-3">
                  <p className="text-sm">
                    {t('error.deleteDependencyMessage')}
                  </p>

                  {/* Resumo das dependências */}
                  <div className="bg-gray-700/50 p-3 rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-gray-200">
                      {t('dependencies.total', {
                        count:
                          errorData.dependencyInfo
                            .totalDependencies,
                      })}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {summary.videos > 0 && (
                        <div className="flex items-center gap-1">
                          <Video size={12} />
                          <span>
                            {t('dependencies.videos', {
                              count: summary.videos,
                            })}
                          </span>
                        </div>
                      )}
                      {summary.documents > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText size={12} />
                          <span>
                            {t('dependencies.documents', {
                              count: summary.documents,
                            })}
                          </span>
                        </div>
                      )}
                      {summary.flashcards > 0 && (
                        <div className="flex items-center gap-1">
                          <CreditCard size={12} />
                          <span>
                            {t('dependencies.flashcards', {
                              count: summary.flashcards,
                            })}
                          </span>
                        </div>
                      )}
                      {summary.quizzes > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText size={12} />
                          <span>
                            {t('dependencies.quizzes', {
                              count: summary.quizzes,
                            })}
                          </span>
                        </div>
                      )}
                      {summary.comments > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare size={12} />
                          <span>
                            {t('dependencies.comments', {
                              count: summary.comments,
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Lista de dependências */}
                    <div className="mt-2 space-y-1">
                      {dependencies.slice(0, 3).map(
                        (
                          dep: {
                            name: string;
                            type: string;
                          },
                          index: number
                        ) => (
                          <div
                            key={index}
                            className="text-xs text-gray-300"
                          >
                            • {dep.name} (
                            {t(
                              `dependencies.type.${dep.type}`
                            )}
                            )
                          </div>
                        )
                      )}
                      {dependencies.length > 3 && (
                        <div className="text-xs text-gray-400">
                          {t('dependencies.andMore', {
                            count: dependencies.length - 3,
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-red-300 font-medium">
                    ⚠️ {t('error.deleteDependencyWarning')}
                  </p>
                </div>
              ),
              variant: 'destructive',
            });
            return;
          }

          throw new Error(
            `Failed to delete lesson: ${response.status}`
          );
        }

        // Se a lição foi deletada com sucesso e tem uma imagem, tentar deletar a imagem
        if (lesson?.imageUrl && lesson.imageUrl.startsWith('/uploads/')) {
          try {
            // Extrair o path relativo da imagem
            const imagePath = lesson.imageUrl.replace('/uploads/', '');
            
            const deleteImageResponse = await fetch(`/api/upload?path=${encodeURIComponent(imagePath)}`, {
              method: 'DELETE',
            });
            
            if (!deleteImageResponse.ok) {
              console.error('Failed to delete lesson image:', imagePath);
            }
          } catch (imageError) {
            console.error('Error deleting lesson image:', imageError);
            // Não falhar a operação toda se a imagem não puder ser deletada
          }
        }

        toast({
          title: t('success.deleteTitle'),
          description: t('success.deleteDescription'),
          variant: 'default',
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
    [t, toast, fetchData, handleApiError, apiUrl, coursesWithLessons]
  );

  // 7. Função para mostrar confirmação personalizada usando toast
  const handleDelete = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string
    ) => {
      // Encontrar o curso, módulo e lição
      const course = coursesWithLessons.find(
        c => c.id === courseId
      );
      if (!course) return;

      const moduleItem = course.modules?.find(
        m => m.id === moduleId
      );
      if (!moduleItem) return;

      const lesson = moduleItem.lessons?.find(
        l => l.id === lessonId
      );
      if (!lesson) return;

      const courseTranslation = getTranslationByLocale(
        course.translations,
        locale
      );
      const moduleTranslation = getTranslationByLocale(
        moduleItem.translations,
        locale
      );
      const lessonTranslation = getTranslationByLocale(
        lesson.translations,
        locale
      );

      // Toast de confirmação personalizado
      toast({
        title: t('deleteConfirmation.title'),
        description: (
          <div className="space-y-3">
            <p className="text-sm">
              {t('deleteConfirmation.message', {
                lessonName:
                  lessonTranslation?.title || 'Sem título',
              })}
            </p>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <Play size={14} />
                  {t('deleteConfirmation.lesson')}:{' '}
                  {lessonTranslation?.title || 'Sem título'}
                </div>
                <div className="flex items-center gap-2">
                  <Package size={14} />
                  {t('deleteConfirmation.module')}:{' '}
                  {moduleTranslation?.title || 'Sem título'}
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} />
                  {t('deleteConfirmation.course')}:{' '}
                  {courseTranslation?.title || 'Sem título'}
                </div>
                <div className="flex items-center gap-2">
                  <ListOrdered size={14} />
                  {t('deleteConfirmation.order')}:{' '}
                  {lesson.order}
                </div>
                {lesson.videoId && (
                  <div className="flex items-center gap-2">
                    <Video size={14} />
                    {t('deleteConfirmation.hasVideo')}
                  </div>
                )}
                {lessonTranslation?.description && (
                  <div className="mt-2 p-2 bg-gray-600/30 rounded text-xs">
                    &ldquo;
                    {lessonTranslation.description.substring(
                      0,
                      100
                    )}
                    {lessonTranslation.description.length >
                    100
                      ? '...'
                      : ''}
                    &rdquo;
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-red-300 font-medium">
              ⚠️ {t('deleteConfirmation.warning')}
            </p>
          </div>
        ),
        variant: 'destructive',
        action: (
          <div className="flex gap-2">
            <button
              onClick={() =>
                deleteLesson(courseId, moduleId, lessonId)
              }
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-red-600 bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              {t('deleteConfirmation.confirm')}
            </button>
          </div>
        ),
      });
    },
    [
      toast,
      deleteLesson,
      coursesWithLessons,
      t,
      locale,
      getTranslationByLocale,
    ]
  );

  // 8. Função para abrir o modal de visualização
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

  // 9. Função para editar lição
  const handleEdit = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string
    ): Promise<void> => {
      try {
        // Buscar detalhes completos da lição
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
        );

        if (!response.ok) {
          throw new Error(
            'Erro ao buscar detalhes da lição'
          );
        }

        const lessonData: LessonForEdit =
          await response.json();
        console.log(
          'Dados da lição para edição:',
          lessonData
        );

        // Processar os dados para garantir que tenham o formato correto
        const processedLesson: LessonForEdit = {
          ...lessonData,
          imageUrl: lessonData.imageUrl || '',
          flashcardIds: lessonData.flashcardIds || [],
          quizIds: lessonData.quizIds || [],
          commentIds: lessonData.commentIds || [],
        };

        setSelectedLessonForEdit(processedLesson);
        setSelectedCourseForEdit(courseId);
        setSelectedModuleForEdit(moduleId);
        setEditModalOpen(true);
      } catch (error) {
        console.error(
          'Erro ao carregar lição para edição:',
          error
        );
        toast({
          title: t('error.editLoadTitle'),
          description: t('error.editLoadDescription'),
          variant: 'destructive',
        });
      }
    },
    [toast, t, apiUrl]
  );

  // 10. Função para abrir modal de conversão
  const handleConvert = useCallback(
    async (
      courseId: string,
      moduleId: string,
      lessonId: string
    ): Promise<void> => {
      try {
        // Buscar detalhes completos da lição incluindo dados do vídeo
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
        );

        if (!response.ok) {
          throw new Error('Erro ao buscar detalhes da lição');
        }

        const lessonData: Lesson = await response.json();

        // Adicionar courseId à lesson para uso no modal
        setSelectedLessonForConvert({ ...lessonData, courseId });
        setConvertModalOpen(true);
      } catch (error) {
        console.error('Erro ao carregar lição para conversão:', error);
        toast({
          title: t('error.convertLoadTitle'),
          description: t('error.convertLoadDescription'),
          variant: 'destructive',
        });
      }
    },
    [toast, t, apiUrl]
  );

  // 11. Função para expandir/contrair curso
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

  // 11. Função para expandir/contrair módulo
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

  // 12. Função para navegar entre páginas de aulas
  const handlePageChange = useCallback(
    async (courseId: string, moduleId: string, newPage: number) => {
      const paginationInfo = modulePagination[moduleId];
      if (!paginationInfo) return;

      // Validar página
      if (newPage < 1 || newPage > paginationInfo.totalPages) return;

      // Buscar aulas da nova página
      const lessons = await fetchLessonsForModule(courseId, moduleId, newPage);

      // Atualizar o módulo com as novas aulas
      setCoursesWithLessons(prev =>
        prev.map(course => {
          if (course.id !== courseId) return course;

          return {
            ...course,
            modules: course.modules?.map(module => {
              if (module.id !== moduleId) return module;
              return { ...module, lessons };
            }),
          };
        })
      );
    },
    [modulePagination, fetchLessonsForModule]
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
                            modulePagination[module.id]?.total || module.lessons?.length || 0;

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
                                    <>
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
                                                  {/* Type badge for 3D Environment */}
                                                  {lesson.type === 'ENVIRONMENT_3D' && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                                                      <Box size={10} />
                                                      3D
                                                    </span>
                                                  )}
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
                                                  {/* Audio badge */}
                                                  {lesson.hasAudios && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                                                      <Music size={10} />
                                                    </span>
                                                  )}
                                                  {/* Animation badge */}
                                                  {lesson.hasAnimations && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                                                      <Gamepad2 size={10} />
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
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    handleEdit(
                                                      course.id,
                                                      module.id,
                                                      lesson.id
                                                    );
                                                  }}
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
                                                {/* Botão de conversão - mostrar se tem vídeo */}
                                                {lesson.videoId && (
                                                  <button
                                                    type="button"
                                                    onClick={e => {
                                                      e.stopPropagation();
                                                      handleConvert(
                                                        course.id,
                                                        module.id,
                                                        lesson.id
                                                      );
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded transition-all"
                                                    title={t(
                                                      'actions.convertToLive'
                                                    )}
                                                  >
                                                    <Radio
                                                      size={
                                                        16
                                                      }
                                                    />
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>

                                    {/* Controles de paginação */}
                                    {modulePagination[module.id] && modulePagination[module.id].totalPages > 1 && (
                                      <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
                                        <div className="text-xs text-gray-400">
                                          {t('pagination.showing')} {module.lessons?.length || 0} {t('pagination.of')} {modulePagination[module.id].total} {t('lessons')}
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {/* Botão anterior */}
                                          <button
                                            type="button"
                                            onClick={() => handlePageChange(
                                              course.id,
                                              module.id,
                                              modulePagination[module.id].page - 1
                                            )}
                                            disabled={modulePagination[module.id].page === 1}
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                            title={t('pagination.previous')}
                                          >
                                            <ChevronLeft size={16} />
                                          </button>

                                          {/* Input de página */}
                                          <div className="flex items-center gap-1 text-xs">
                                            <span className="text-gray-400">{t('pagination.page')}</span>
                                            <input
                                              type="number"
                                              min="1"
                                              max={modulePagination[module.id].totalPages}
                                              value={modulePagination[module.id].page}
                                              onChange={(e) => {
                                                const page = parseInt(e.target.value);
                                                if (page >= 1 && page <= modulePagination[module.id].totalPages) {
                                                  handlePageChange(course.id, module.id, page);
                                                }
                                              }}
                                              className="w-12 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                                            />
                                            <span className="text-gray-400">{t('pagination.of')} {modulePagination[module.id].totalPages}</span>
                                          </div>

                                          {/* Botão próximo */}
                                          <button
                                            type="button"
                                            onClick={() => handlePageChange(
                                              course.id,
                                              module.id,
                                              modulePagination[module.id].page + 1
                                            )}
                                            disabled={modulePagination[module.id].page === modulePagination[module.id].totalPages}
                                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                            title={t('pagination.next')}
                                          >
                                            <ChevronRight size={16} />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    </>
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

      {/* Modal de Edição da Lição */}
      <LessonEditModal
        lesson={selectedLessonForEdit}
        courseId={selectedCourseForEdit || ''}
        moduleId={selectedModuleForEdit || ''}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedLessonForEdit(null);
          setSelectedCourseForEdit(null);
          setSelectedModuleForEdit(null);
        }}
        onSave={() => {
          setEditModalOpen(false);
          setSelectedLessonForEdit(null);
          setSelectedCourseForEdit(null);
          setSelectedModuleForEdit(null);
          fetchData();
        }}
      />

      <ConvertToLiveModal
        open={convertModalOpen}
        onClose={() => {
          setConvertModalOpen(false);
          setSelectedLessonForConvert(null);
        }}
        lesson={selectedLessonForConvert}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
