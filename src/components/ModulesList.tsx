'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  Edit,
  Trash2,
  Eye,
  Search,
  ChevronDown,
  ChevronRight,
  Play,
  BookOpen,
} from 'lucide-react';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Module {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
  modules?: Module[];
}

export default function ModulesList() {
  const t = useTranslations('Admin.modulesList');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [coursesWithModules, setCoursesWithModules] =
    useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<
    Set<string>
  >(new Set());

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333';

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

  // Função para buscar módulos de um curso específico
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<Module[]> => {
      try {
        const response = await fetch(
          `${apiUrl}/courses/${courseId}/modules`
        );

        if (!response.ok) {
          return [];
        }

        return await response.json();
      } catch (error) {
        handleApiError(
          error,
          `Error fetching modules for course ${courseId}`
        );
        return [];
      }
    },
    [handleApiError, apiUrl]
  );

  // Função principal para buscar todos os dados
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const coursesResponse = await fetch(
        `${apiUrl}/courses`
      );

      if (!coursesResponse.ok) {
        throw new Error(
          `Failed to fetch courses: ${coursesResponse.status}`
        );
      }

      const courses: Course[] =
        await coursesResponse.json();

      const coursesWithModulesData = await Promise.all(
        courses.map(async course => {
          const modules = await fetchModulesForCourse(
            course.id
          );
          return { ...course, modules };
        })
      );

      setCoursesWithModules(coursesWithModulesData);
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

  // Função para deletar módulo após confirmação
  const deleteModule = useCallback(
    async (courseId: string, moduleId: string) => {
      try {
        const response = await fetch(
          `${apiUrl}/courses/${courseId}/modules/${moduleId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete module: ${response.status}`
          );
        }

        toast({
          title: t('success.deleteTitle'),
          description: t('success.deleteDescription'),
          variant: 'default',
        });

        await fetchData();
      } catch (error) {
        handleApiError(error, 'Module deletion error');
        toast({
          title: t('error.deleteTitle'),
          description: t('error.deleteDescription'),
          variant: 'destructive',
        });
      }
    },
    [t, toast, fetchData, handleApiError, apiUrl]
  );

  // Função para mostrar confirmação personalizada usando toast
  const handleDelete = useCallback(
    async (courseId: string, moduleId: string) => {
      // Encontrar o curso e o módulo
      const course = coursesWithModules.find(
        c => c.id === courseId
      );
      if (!course) return;

      const module = course.modules?.find(
        m => m.id === moduleId
      );
      if (!module) return;

      const courseTranslation = getTranslationByLocale(
        course.translations,
        locale
      );
      const moduleTranslation = getTranslationByLocale(
        module.translations,
        locale
      );

      // Toast de confirmação personalizado
      toast({
        title: t('deleteConfirmation.title'),
        description: (
          <div className="space-y-3">
            <p className="text-sm">
              {t('deleteConfirmation.message', {
                moduleName:
                  moduleTranslation?.title || 'Sem título',
              })}
            </p>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <Package size={14} />
                  {t('deleteConfirmation.module')}:{' '}
                  {module.slug}
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} />
                  {t('deleteConfirmation.course')}:{' '}
                  {courseTranslation?.title || 'Sem título'}
                </div>
                <div className="flex items-center gap-2">
                  <Play size={14} />
                  {t('deleteConfirmation.order')}:{' '}
                  {module.order}
                </div>
                {moduleTranslation?.description && (
                  <div className="mt-2 p-2 bg-gray-600/30 rounded text-xs">
                    "
                    {moduleTranslation.description.substring(
                      0,
                      100
                    )}
                    {moduleTranslation.description.length >
                    100
                      ? '...'
                      : ''}
                    "
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
                deleteModule(courseId, moduleId)
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
      deleteModule,
      coursesWithModules,
      t,
      locale,
      getTranslationByLocale,
    ]
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

  // Filtrar cursos e módulos baseado na busca
  const filteredCourses = coursesWithModules.filter(
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

      // Verificar se algum módulo corresponde
      return course.modules?.some(module => {
        const moduleTranslation = getTranslationByLocale(
          module.translations,
          locale
        );
        return (
          module.slug
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          moduleTranslation?.title
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          moduleTranslation?.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      });
    }
  );

  // Estatísticas
  const totalCourses = coursesWithModules.length;
  const totalModules = coursesWithModules.reduce(
    (sum, course) => sum + (course.modules?.length || 0),
    0
  );
  const coursesWithModulesCount = coursesWithModules.filter(
    course => (course.modules?.length || 0) > 0
  ).length;

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
          <Package size={24} className="text-secondary" />
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
            {coursesWithModulesCount}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.coursesWithModules')}
          </p>
        </div>
      </div>

      {/* Lista de cursos com módulos */}
      {filteredCourses.length > 0 ? (
        <div className="space-y-4">
          {filteredCourses.map(course => {
            const courseTranslation =
              getTranslationByLocale(
                course.translations,
                locale
              );
            const isExpanded = expandedCourses.has(
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
                    {isExpanded ? (
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

                  <div className="text-sm text-gray-400">
                    ID: {course.id.slice(0, 8)}...
                  </div>
                </div>

                {/* Lista de módulos */}
                {isExpanded && (
                  <div className="bg-gray-800/50 p-4">
                    {moduleCount > 0 ? (
                      <div className="space-y-3">
                        {course.modules
                          ?.sort(
                            (a, b) => a.order - b.order
                          )
                          .map(module => {
                            const moduleTranslation =
                              getTranslationByLocale(
                                module.translations,
                                locale
                              );

                            return (
                              <div
                                key={module.id}
                                className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                              >
                                {/* Ordem do módulo */}
                                <div className="flex items-center justify-center w-10 h-10 bg-secondary/20 text-secondary rounded-full font-bold">
                                  {module.order}
                                </div>

                                {/* Imagem do módulo */}
                                {module.imageUrl ? (
                                  <div className="relative w-12 h-8 rounded overflow-hidden flex-shrink-0">
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
                                  <div className="w-12 h-8 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                                    <Package
                                      size={16}
                                      className="text-gray-400"
                                    />
                                  </div>
                                )}

                                {/* Informações do módulo */}
                                <div className="flex-1">
                                  <h5 className="text-white font-medium">
                                    {moduleTranslation?.title ||
                                      'Sem título'}
                                  </h5>
                                  <p className="text-xs text-gray-400 line-clamp-1">
                                    {moduleTranslation?.description ||
                                      'Sem descrição'}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                    <span>
                                      Slug: {module.slug}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Play size={10} />
                                      {t('lessonsCount', {
                                        count: 0,
                                      })}
                                    </span>
                                  </div>
                                </div>

                                {/* Ações */}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                                    title={t(
                                      'actions.view'
                                    )}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                                    title={t(
                                      'actions.edit'
                                    )}
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDelete(
                                        course.id,
                                        module.id
                                      );
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
                                    title={t(
                                      'actions.delete'
                                    )}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
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
          <Package
            size={64}
            className="text-gray-500 mx-auto mb-4"
          />
          <p className="text-gray-400">
            {searchTerm ? t('noResults') : t('noCourses')}
          </p>
        </div>
      )}
    </div>
  );
}
