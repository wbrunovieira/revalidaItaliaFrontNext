'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  Edit,
  Trash2,
  Eye,
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Play,
  Clock,
} from 'lucide-react';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface VideoItem {
  id: string;
  slug: string;
  providerVideoId: string;
  durationInSeconds: number;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  imageUrl?: string;
  translations: Translation[];
  videos?: VideoItem[];
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

export default function VideosList() {
  const t = useTranslations('Admin.videosList');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [coursesWithVideos, setCoursesWithVideos] =
    useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<
    Set<string>
  >(new Set());
  const [expandedModules, setExpandedModules] = useState<
    Set<string>
  >(new Set());
  const [expandedLessons, setExpandedLessons] = useState<
    Set<string>
  >(new Set());

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

  // Função para buscar vídeos de uma aula específica
  const fetchVideosForLesson = useCallback(
    async (
      courseId: string,
      lessonId: string
    ): Promise<VideoItem[]> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/lessons/${lessonId}/videos`
        );

        if (!response.ok) {
          return [];
        }

        return await response.json();
      } catch (error) {
        handleApiError(
          error,
          `Error fetching videos for lesson ${lessonId}`
        );
        return [];
      }
    },
    [handleApiError]
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
        const lessons = lessonsData.lessons || [];

        // Buscar vídeos para cada aula
        const lessonsWithVideos = await Promise.all(
          lessons.map(async (lesson: Lesson) => {
            const videos = await fetchVideosForLesson(
              courseId,
              lesson.id
            );
            return { ...lesson, videos };
          })
        );

        return lessonsWithVideos;
      } catch (error) {
        handleApiError(
          error,
          `Error fetching lessons for module ${moduleId}`
        );
        return [];
      }
    },
    [handleApiError, fetchVideosForLesson]
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

        // Buscar aulas e vídeos para cada módulo
        const modulesWithData = await Promise.all(
          modules.map(async module => {
            const lessons = await fetchLessonsForModule(
              courseId,
              module.id
            );
            return { ...module, lessons };
          })
        );

        return modulesWithData;
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

      setCoursesWithVideos(coursesWithData);
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

  const handleDelete = useCallback(
    async (
      courseId: string,
      lessonId: string,
      videoId: string
    ) => {
      if (!confirm(t('deleteConfirm'))) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/lessons/${lessonId}/videos/${videoId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete video: ${response.status}`
          );
        }

        toast({
          title: t('success.deleteTitle'),
          description: t('success.deleteDescription'),
        });

        await fetchData();
      } catch (error) {
        handleApiError(error, 'Video deletion error');
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

  const toggleLesson = useCallback((lessonId: string) => {
    setExpandedLessons(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(lessonId)) {
        newExpanded.delete(lessonId);
      } else {
        newExpanded.add(lessonId);
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

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes
        .toString()
        .padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  }, []);

  // Filtrar baseado na busca
  const filteredCourses = coursesWithVideos.filter(
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
          const lessonMatches =
            lessonTranslation?.title
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            lessonTranslation?.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase());

          if (lessonMatches) return true;

          return lesson.videos?.some(video => {
            const videoTranslation = getTranslationByLocale(
              video.translations,
              locale
            );
            return (
              video.slug
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              videoTranslation?.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              videoTranslation?.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            );
          });
        });
      });
    }
  );

  // Estatísticas
  const totalCourses = coursesWithVideos.length;
  const totalModules = coursesWithVideos.reduce(
    (sum, course) => sum + (course.modules?.length || 0),
    0
  );
  const totalLessons = coursesWithVideos.reduce(
    (sum, course) =>
      sum +
      (course.modules?.reduce(
        (moduleSum, module) =>
          moduleSum + (module.lessons?.length || 0),
        0
      ) || 0),
    0
  );
  const totalVideos = coursesWithVideos.reduce(
    (sum, course) =>
      sum +
      (course.modules?.reduce(
        (moduleSum, module) =>
          moduleSum +
          (module.lessons?.reduce(
            (lessonSum, lesson) =>
              lessonSum + (lesson.videos?.length || 0),
            0
          ) || 0),
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
          <Video size={24} className="text-secondary" />
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
      <div className="grid grid-cols-4 gap-4 mb-6">
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
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {totalVideos}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalVideos')}
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
                            const isModuleExpanded =
                              expandedModules.has(
                                module.id
                              );
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
                                        src={
                                          module.imageUrl
                                        }
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
                                  <div className="bg-gray-800/30 p-3">
                                    {lessonCount > 0 ? (
                                      <div className="space-y-2">
                                        {module.lessons
                                          ?.sort(
                                            (a, b) =>
                                              a.order -
                                              b.order
                                          )
                                          .map(lesson => {
                                            const lessonTranslation =
                                              getTranslationByLocale(
                                                lesson.translations,
                                                locale
                                              );
                                            const isLessonExpanded =
                                              expandedLessons.has(
                                                lesson.id
                                              );
                                            const videoCount =
                                              lesson.videos
                                                ?.length ||
                                              0;

                                            return (
                                              <div
                                                key={
                                                  lesson.id
                                                }
                                                className="border border-gray-600 rounded-lg overflow-hidden"
                                              >
                                                {/* Cabeçalho da aula */}
                                                <div
                                                  onClick={() =>
                                                    toggleLesson(
                                                      lesson.id
                                                    )
                                                  }
                                                  className="flex items-center gap-3 p-2 bg-gray-700/20 hover:bg-gray-700/40 transition-colors cursor-pointer"
                                                >
                                                  <button
                                                    type="button"
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                  >
                                                    {isLessonExpanded ? (
                                                      <ChevronDown
                                                        size={
                                                          14
                                                        }
                                                      />
                                                    ) : (
                                                      <ChevronRight
                                                        size={
                                                          14
                                                        }
                                                      />
                                                    )}
                                                  </button>

                                                  <div className="flex items-center justify-center w-6 h-6 bg-primary/20 text-primary rounded-full font-bold text-xs">
                                                    {
                                                      lesson.order
                                                    }
                                                  </div>

                                                  {lesson.imageUrl ? (
                                                    <div className="relative w-8 h-5 rounded overflow-hidden flex-shrink-0">
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
                                                    <div className="w-8 h-5 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                                                      <Play
                                                        size={
                                                          10
                                                        }
                                                        className="text-gray-400"
                                                      />
                                                    </div>
                                                  )}

                                                  <div className="flex-1">
                                                    <h6 className="text-white text-sm font-medium">
                                                      {lessonTranslation?.title ||
                                                        'Sem título'}
                                                    </h6>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                      <span className="flex items-center gap-1">
                                                        <Video
                                                          size={
                                                            10
                                                          }
                                                        />
                                                        {
                                                          videoCount
                                                        }{' '}
                                                        {t(
                                                          'videos'
                                                        )}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Vídeos da aula */}
                                                {isLessonExpanded && (
                                                  <div className="bg-gray-800/20 p-2">
                                                    {videoCount >
                                                    0 ? (
                                                      <div className="space-y-1">
                                                        {lesson.videos?.map(
                                                          video => {
                                                            const videoTranslation =
                                                              getTranslationByLocale(
                                                                video.translations,
                                                                locale
                                                              );

                                                            return (
                                                              <div
                                                                key={
                                                                  video.id
                                                                }
                                                                className="flex items-center gap-2 p-2 bg-gray-700/10 rounded hover:bg-gray-700/30 transition-colors"
                                                              >
                                                                <div className="w-6 h-4 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                                                                  <Play
                                                                    size={
                                                                      8
                                                                    }
                                                                    className="text-white"
                                                                  />
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                  <p className="text-white text-xs font-medium truncate">
                                                                    {videoTranslation?.title ||
                                                                      'Sem título'}
                                                                  </p>
                                                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    <span>
                                                                      Slug:{' '}
                                                                      {
                                                                        video.slug
                                                                      }
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                      <Clock
                                                                        size={
                                                                          8
                                                                        }
                                                                      />
                                                                      {formatDuration(
                                                                        video.durationInSeconds
                                                                      )}
                                                                    </span>
                                                                    <span>
                                                                      ID:{' '}
                                                                      {
                                                                        video.providerVideoId
                                                                      }
                                                                    </span>
                                                                  </div>
                                                                </div>

                                                                {/* Ações */}
                                                                <div className="flex items-center gap-1">
                                                                  <button
                                                                    type="button"
                                                                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                                                                    title={t(
                                                                      'actions.view'
                                                                    )}
                                                                  >
                                                                    <Eye
                                                                      size={
                                                                        12
                                                                      }
                                                                    />
                                                                  </button>
                                                                  <button
                                                                    type="button"
                                                                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                                                                    title={t(
                                                                      'actions.edit'
                                                                    )}
                                                                  >
                                                                    <Edit
                                                                      size={
                                                                        12
                                                                      }
                                                                    />
                                                                  </button>
                                                                  <button
                                                                    type="button"
                                                                    onClick={e => {
                                                                      e.stopPropagation();
                                                                      handleDelete(
                                                                        course.id,
                                                                        lesson.id,
                                                                        video.id
                                                                      );
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
                                                                    title={t(
                                                                      'actions.delete'
                                                                    )}
                                                                  >
                                                                    <Trash2
                                                                      size={
                                                                        12
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
                                                      <div className="text-center py-2">
                                                        <Video
                                                          size={
                                                            24
                                                          }
                                                          className="text-gray-500 mx-auto mb-1"
                                                        />
                                                        <p className="text-gray-400 text-xs">
                                                          {t(
                                                            'noVideos'
                                                          )}
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
          <Video
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
