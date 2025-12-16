// /src/components/ListAudios.tsx
'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Music,
  Loader2,
  Eye,
  X,
  Calendar,
  Globe,
  Clock,
  FileAudio,
  Layers,
  Play,
  HardDrive,
  Hash,
  Search,
  ChevronDown,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import Image from 'next/image';
import EditAudioModal from './EditAudioModal';

interface AudioTranslation {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description?: string;
}

interface Audio {
  id: string;
  lessonId: string;
  filename: string;
  url: string;
  durationInSeconds: number;
  formattedDuration: string;
  fileSize: number;
  mimeType: string;
  order: number;
  transcription?: string;
  translations: AudioTranslation[];
  createdAt: string;
  updatedAt: string;
}

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
  translations: Translation[];
  audios?: Audio[];
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

interface CourseStats {
  moduleCount: number;
  lessonCount: number;
  audioCount: number;
}

interface ModuleStats {
  lessonCount: number;
  audioCount: number;
}

export default function ListAudios() {
  const t = useTranslations('Admin.listAudios');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [coursesWithAudios, setCoursesWithAudios] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // Modal de visualização
  const [selectedAudio, setSelectedAudio] = useState<Audio | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAudioDetails, setLoadingAudioDetails] = useState(false);

  // Modal de edição
  const [editingAudio, setEditingAudio] = useState<Audio | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Função para tratamento de erros
  const handleApiError = useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);
    },
    []
  );

  // Função para obter token do cookie
  const getToken = useCallback(() => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
  }, []);

  // Buscar áudios de uma aula específica
  const fetchAudiosForLesson = useCallback(
    async (lessonId: string): Promise<Audio[]> => {
      try {
        const token = getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const url = `${apiUrl}/api/v1/audios?lessonId=${lessonId}`;

        const response = await fetch(url, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
        });

        if (!response.ok) {
          return [];
        }

        const data = await response.json();
        return data.audios || [];
      } catch (error) {
        handleApiError(error, `Error fetching audios for lesson ${lessonId}`);
        return [];
      }
    },
    [handleApiError, getToken]
  );

  // Buscar aulas de um módulo
  const fetchLessonsForModule = useCallback(
    async (courseId: string, moduleId: string): Promise<Lesson[]> => {
      try {
        const token = getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons?limit=100`,
          {
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          return [];
        }

        const lessonsData = await response.json();
        const lessons = lessonsData.lessons || [];

        // Buscar áudios para cada aula
        const lessonsWithAudios = await Promise.all(
          lessons.map(async (lesson: Lesson) => {
            const audios = await fetchAudiosForLesson(lesson.id);
            return { ...lesson, audios };
          })
        );

        return lessonsWithAudios.sort((a: Lesson, b: Lesson) => a.order - b.order);
      } catch (error) {
        handleApiError(error, `Error fetching lessons for module ${moduleId}`);
        return [];
      }
    },
    [handleApiError, fetchAudiosForLesson, getToken]
  );

  // Buscar módulos de um curso
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<Module[]> => {
      try {
        const token = getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules`,
          {
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          return [];
        }

        const modules: Module[] = await response.json();

        // Buscar aulas e áudios para cada módulo
        const modulesWithData = await Promise.all(
          modules.map(async moduleItem => {
            const lessons = await fetchLessonsForModule(courseId, moduleItem.id);
            return { ...moduleItem, lessons };
          })
        );

        return modulesWithData.sort((a, b) => a.order - b.order);
      } catch (error) {
        handleApiError(error, `Error fetching modules for course ${courseId}`);
        return [];
      }
    },
    [handleApiError, fetchLessonsForModule, getToken]
  );

  // Buscar todos os dados
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const token = getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/courses`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const courses: Course[] = await response.json();

      const coursesWithData = await Promise.all(
        courses.map(async course => {
          const modules = await fetchModulesForCourse(course.id);
          return { ...course, modules };
        })
      );

      setCoursesWithAudios(coursesWithData);
    } catch (error) {
      handleApiError(error, 'Courses fetch error');
      toast({
        title: t('error.fetchCoursesTitle'),
        description: t('error.fetchCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t, handleApiError, fetchModulesForCourse, getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Obter tradução por locale
  const getTranslationByLocale = useCallback(
    (translations: Translation[], targetLocale: string) => {
      return (
        translations.find(tr => tr.locale === targetLocale) ||
        translations.find(tr => tr.locale === 'pt') ||
        translations[0]
      );
    },
    []
  );

  // Obter tradução de áudio por locale
  const getAudioTranslation = useCallback(
    (translations: AudioTranslation[]) => {
      return (
        translations.find(tr => tr.locale === locale) ||
        translations.find(tr => tr.locale === 'pt') ||
        translations[0]
      );
    },
    [locale]
  );

  // Toggle funções
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

  // Calcular estatísticas de curso
  const getCourseStats = useCallback(
    (course: Course): CourseStats => {
      const moduleCount = course.modules?.length || 0;
      const lessonCount = course.modules?.reduce(
        (sum, module) => sum + (module.lessons?.length || 0),
        0
      ) || 0;
      const audioCount = course.modules?.reduce(
        (sum, module) =>
          sum + (module.lessons?.reduce(
            (lessonSum, lesson) => lessonSum + (lesson.audios?.length || 0),
            0
          ) || 0),
        0
      ) || 0;

      return { moduleCount, lessonCount, audioCount };
    },
    []
  );

  // Calcular estatísticas de módulo
  const getModuleStats = useCallback(
    (module: Module): ModuleStats => {
      const lessonCount = module.lessons?.length || 0;
      const audioCount = module.lessons?.reduce(
        (sum, lesson) => sum + (lesson.audios?.length || 0),
        0
      ) || 0;

      return { lessonCount, audioCount };
    },
    []
  );

  // Formatar tamanho de arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Buscar detalhes do áudio por ID
  const fetchAudioById = useCallback(
    async (audioId: string): Promise<Audio | null> => {
      try {
        const token = getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const url = `${apiUrl}/api/v1/audios/${audioId}`;

        const response = await fetch(url, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        // A API retorna { audio: {...} }, extrair o objeto audio
        return data.audio || data;
      } catch (error) {
        handleApiError(error, `Error fetching audio ${audioId}`);
        return null;
      }
    },
    [handleApiError, getToken]
  );

  // Abrir modal de visualização
  const openViewModal = async (audio: Audio) => {
    setIsModalOpen(true);
    setLoadingAudioDetails(true);

    // Buscar detalhes completos do áudio (inclui transcription)
    const audioDetails = await fetchAudioById(audio.id);

    if (audioDetails) {
      // Mesclar dados: usar transcription do detalhe mas manter translations da lista
      // pois a API de detalhe pode não retornar translations no mesmo formato
      setSelectedAudio({
        ...audio,
        ...audioDetails,
        translations: audioDetails.translations || audio.translations,
      });
    } else {
      // Fallback para dados da lista se falhar
      setSelectedAudio(audio);
    }

    setLoadingAudioDetails(false);
  };

  // Fechar modal de visualização
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAudio(null);
  };

  // Abrir modal de edição
  const openEditModal = (audio: Audio, lessonId: string) => {
    setEditingAudio(audio);
    setEditingLessonId(lessonId);
    setIsEditModalOpen(true);
  };

  // Fechar modal de edição
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingAudio(null);
    setEditingLessonId('');
  };

  // Callback após salvar edição
  const handleEditSave = () => {
    fetchData();
  };

  // Filtrar cursos
  const filteredCourses = useMemo(() => {
    return coursesWithAudios.filter(course => {
      const courseTranslation = getTranslationByLocale(course.translations, locale);
      const courseMatches =
        course.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        courseTranslation?.title.toLowerCase().includes(searchTerm.toLowerCase());

      if (courseMatches) return true;

      return course.modules?.some(module => {
        const moduleTranslation = getTranslationByLocale(module.translations, locale);
        const moduleMatches =
          module.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          moduleTranslation?.title.toLowerCase().includes(searchTerm.toLowerCase());

        if (moduleMatches) return true;

        return module.lessons?.some(lesson => {
          const lessonTranslation = getTranslationByLocale(lesson.translations, locale);
          const lessonMatches =
            lessonTranslation?.title.toLowerCase().includes(searchTerm.toLowerCase());

          if (lessonMatches) return true;

          return lesson.audios?.some(audio => {
            const audioTranslation = getAudioTranslation(audio.translations);
            return (
              audio.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
              audioTranslation?.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
          });
        });
      });
    });
  }, [coursesWithAudios, searchTerm, getTranslationByLocale, getAudioTranslation, locale]);

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    const totalCourses = coursesWithAudios.length;
    const totalModules = coursesWithAudios.reduce(
      (sum, course) => sum + (course.modules?.length || 0),
      0
    );
    const totalLessons = coursesWithAudios.reduce(
      (sum, course) =>
        sum + (course.modules?.reduce(
          (moduleSum, module) => moduleSum + (module.lessons?.length || 0),
          0
        ) || 0),
      0
    );
    const totalAudios = coursesWithAudios.reduce(
      (sum, course) =>
        sum + (course.modules?.reduce(
          (moduleSum, module) =>
            moduleSum + (module.lessons?.reduce(
              (lessonSum, lesson) => lessonSum + (lesson.audios?.length || 0),
              0
            ) || 0),
          0
        ) || 0),
      0
    );

    return { totalCourses, totalModules, totalLessons, totalAudios };
  }, [coursesWithAudios]);

  if (loading) {
    return (
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-secondary animate-spin" />
          <span className="ml-3 text-gray-400">{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
          <Music size={24} className="text-secondary" />
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
          <p className="text-3xl font-bold text-white">{totalStats.totalCourses}</p>
          <p className="text-sm text-gray-400">{t('stats.courses')}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{totalStats.totalModules}</p>
          <p className="text-sm text-gray-400">{t('stats.modules')}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{totalStats.totalLessons}</p>
          <p className="text-sm text-gray-400">{t('stats.lessons')}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{totalStats.totalAudios}</p>
          <p className="text-sm text-gray-400">{t('stats.audios')}</p>
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="space-y-4">
          {filteredCourses.map(course => {
            const courseTranslation = getTranslationByLocale(course.translations, locale);
            const isCourseExpanded = expandedCourses.has(course.id);
            const courseStats = getCourseStats(course);

            return (
              <div key={course.id} className="border border-gray-700 rounded-lg overflow-hidden">
                {/* Cabeçalho do curso */}
                <div
                  onClick={() => toggleCourse(course.id)}
                  className="flex items-center gap-4 p-4 bg-gray-700/50 hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <button type="button" className="text-gray-400 hover:text-white transition-colors">
                    {isCourseExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
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
                      {courseTranslation?.title || t('noTitle')}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{t('slug')}: {course.slug}</span>
                      <span className="flex items-center gap-1">
                        <Layers size={12} />
                        {courseStats.moduleCount} {t('modules')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Play size={12} />
                        {courseStats.lessonCount} {t('lessons')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Music size={12} />
                        {courseStats.audioCount} {t('audios')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Módulos do curso */}
                {isCourseExpanded && (
                  <div className="bg-gray-800/50 p-4">
                    {courseStats.moduleCount > 0 ? (
                      <div className="space-y-3">
                        {course.modules?.map(module => {
                          const moduleTranslation = getTranslationByLocale(module.translations, locale);
                          const isModuleExpanded = expandedModules.has(module.id);
                          const moduleStats = getModuleStats(module);

                          return (
                            <div key={module.id} className="border border-gray-600 rounded-lg overflow-hidden">
                              {/* Cabeçalho do módulo */}
                              <div
                                onClick={() => toggleModule(module.id)}
                                className="flex items-center gap-4 p-3 bg-gray-700/30 hover:bg-gray-700/50 transition-colors cursor-pointer"
                              >
                                <button type="button" className="text-gray-400 hover:text-white transition-colors">
                                  {isModuleExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>

                                <div className="flex items-center justify-center w-8 h-8 bg-secondary/20 text-secondary rounded-full font-bold text-sm">
                                  {module.order}
                                </div>

                                {module.imageUrl ? (
                                  <div className="relative w-10 h-6 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={module.imageUrl}
                                      alt={moduleTranslation?.title || ''}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-6 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                                    <Layers size={12} className="text-gray-400" />
                                  </div>
                                )}

                                <div className="flex-1">
                                  <h5 className="text-white font-medium">
                                    {moduleTranslation?.title || t('noTitle')}
                                  </h5>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>{t('slug')}: {module.slug}</span>
                                    <span className="flex items-center gap-1">
                                      <Play size={10} />
                                      {moduleStats.lessonCount} {t('lessons')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Music size={10} />
                                      {moduleStats.audioCount} {t('audios')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Aulas do módulo */}
                              {isModuleExpanded && (
                                <div className="bg-gray-800/30 p-4">
                                  {moduleStats.lessonCount > 0 ? (
                                    <div className="space-y-3 pl-2">
                                      {module.lessons?.map(lesson => {
                                        const lessonTranslation = getTranslationByLocale(lesson.translations, locale);
                                        const isLessonExpanded = expandedLessons.has(lesson.id);
                                        const audioCount = lesson.audios?.length || 0;

                                        return (
                                          <div key={lesson.id} className="border border-gray-600 rounded-lg overflow-hidden">
                                            {/* Cabeçalho da aula */}
                                            <div
                                              onClick={() => toggleLesson(lesson.id)}
                                              className="flex items-center gap-4 p-3 bg-gray-700/30 border border-gray-700/50 rounded hover:bg-gray-700/50 transition-colors cursor-pointer"
                                            >
                                              <button type="button" className="text-gray-400 hover:text-white transition-colors">
                                                {isLessonExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                              </button>

                                              <div className="flex items-center justify-center w-8 h-8 bg-secondary/20 text-secondary rounded-full font-bold text-sm">
                                                {lesson.order}
                                              </div>

                                              {lesson.imageUrl ? (
                                                <div className="relative w-10 h-6 rounded overflow-hidden flex-shrink-0">
                                                  <Image
                                                    src={lesson.imageUrl}
                                                    alt={lessonTranslation?.title || ''}
                                                    fill
                                                    className="object-cover"
                                                  />
                                                </div>
                                              ) : (
                                                <div className="w-10 h-6 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                                                  <Play size={14} className="text-gray-400" />
                                                </div>
                                              )}

                                              <div className="flex-1">
                                                <h6 className="text-white text-base font-medium">
                                                  {lessonTranslation?.title || t('noTitle')}
                                                </h6>
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                  <span className="flex items-center gap-1.5">
                                                    <Music size={12} />
                                                    {audioCount} {t('audios')}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Áudios da aula */}
                                            {isLessonExpanded && (
                                              <div className="bg-gray-800/20 p-3">
                                                {audioCount > 0 ? (
                                                  <div className="space-y-2 pl-2">
                                                    {lesson.audios?.map(audio => {
                                                      const audioTranslation = getAudioTranslation(audio.translations);

                                                      return (
                                                        <div
                                                          key={audio.id}
                                                          className="flex items-center gap-3 p-2 bg-gray-700/20 rounded hover:bg-gray-700/40 transition-colors"
                                                        >
                                                          <div className="flex items-center justify-center w-8 h-8 bg-secondary/20 rounded-lg text-secondary font-bold text-sm">
                                                            {audio.order}
                                                          </div>

                                                          <div className="w-8 h-6 bg-secondary/30 rounded flex items-center justify-center flex-shrink-0">
                                                            <FileAudio size={12} className="text-secondary" />
                                                          </div>

                                                          <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm font-medium truncate">
                                                              {audioTranslation?.title || t('noTitle')}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                              <span className="flex items-center gap-1">
                                                                <Hash size={10} />
                                                                {t('order')}: {audio.order}
                                                              </span>
                                                              <span className="flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {audio.formattedDuration}
                                                              </span>
                                                              <span className="flex items-center gap-1">
                                                                <HardDrive size={10} />
                                                                {formatFileSize(audio.fileSize)}
                                                              </span>
                                                            </div>
                                                          </div>

                                                          {/* Ações */}
                                                          <div className="flex items-center gap-1">
                                                            <button
                                                              type="button"
                                                              onClick={e => {
                                                                e.stopPropagation();
                                                                openViewModal(audio);
                                                              }}
                                                              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-all"
                                                              title={t('view')}
                                                            >
                                                              <Eye size={16} />
                                                            </button>
                                                            <button
                                                              type="button"
                                                              onClick={e => {
                                                                e.stopPropagation();
                                                                openEditModal(audio, lesson.id);
                                                              }}
                                                              className="p-1.5 text-gray-400 hover:text-secondary hover:bg-gray-600 rounded transition-all"
                                                              title={t('edit')}
                                                            >
                                                              <Pencil size={16} />
                                                            </button>
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                ) : (
                                                  <div className="text-center py-4">
                                                    <Music size={32} className="text-gray-500 mx-auto mb-2" />
                                                    <p className="text-gray-400 text-sm">{t('noAudios')}</p>
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
                                      <Play size={32} className="text-gray-500 mx-auto mb-2" />
                                      <p className="text-gray-400 text-sm">{t('noLessons')}</p>
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
                        <Layers size={48} className="text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400">{t('noModules')}</p>
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
          <Music size={64} className="text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">
            {searchTerm ? t('noResults') : t('noCourses')}
          </p>
        </div>
      )}

      {/* Modal de Visualização */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileAudio size={20} className="text-secondary" />
                {t('modal.title')}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {loadingAudioDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-secondary animate-spin" />
                <span className="ml-3 text-gray-400">{t('loading')}</span>
              </div>
            ) : selectedAudio ? (
            <div className="p-6 space-y-6">
              {/* File Info */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-secondary/20 rounded-lg text-secondary font-bold">
                    {selectedAudio.order}
                  </div>
                  <FileAudio size={32} className="text-secondary" />
                  <div>
                    <p className="text-white font-medium">{selectedAudio.filename}</p>
                    <p className="text-xs text-gray-400">{selectedAudio.mimeType}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Hash size={14} />
                    <span>{t('modal.order')}: {selectedAudio.order}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={14} />
                    <span>{t('modal.duration')}: {selectedAudio.formattedDuration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <HardDrive size={14} />
                    <span>{t('modal.size')}: {formatFileSize(selectedAudio.fileSize)}</span>
                  </div>
                </div>
              </div>

              {/* Audio Player */}
              {selectedAudio.url && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-3">
                    <Play size={12} />
                    {t('modal.player')}
                  </label>
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <audio
                      src={selectedAudio.url}
                      controls
                      className="w-full"
                      style={{
                        backgroundColor: 'transparent',
                        borderRadius: '8px',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} />
                    {t('modal.createdAt')}
                  </label>
                  <p className="text-gray-300 text-sm mt-1">{formatDate(selectedAudio.createdAt)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} />
                    {t('modal.updatedAt')}
                  </label>
                  <p className="text-gray-300 text-sm mt-1">{formatDate(selectedAudio.updatedAt)}</p>
                </div>
              </div>

              {/* Transcription */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                  {t('modal.transcription')}
                </label>
                <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                  {selectedAudio.transcription ? (
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedAudio.transcription}</p>
                  ) : (
                    <p className="text-gray-500 text-sm italic">{t('modal.noTranscription')}</p>
                  )}
                </div>
              </div>

              {/* Translations */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-3">
                  <Globe size={12} />
                  {t('modal.translations')}
                </label>
                <div className="space-y-3">
                  {selectedAudio.translations.map(tr => (
                    <div
                      key={tr.locale}
                      className="p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {tr.locale === 'pt' ? '🇧🇷' : tr.locale === 'it' ? '🇮🇹' : '🇪🇸'}
                        </span>
                        <span className="text-xs text-gray-400 uppercase font-semibold">
                          {tr.locale === 'pt' ? 'Português' : tr.locale === 'it' ? 'Italiano' : 'Español'}
                        </span>
                      </div>
                      <p className="text-white font-medium">{tr.title}</p>
                      {tr.description && (
                        <p className="text-gray-400 text-sm mt-1">{tr.description}</p>
                      )}
                      {!tr.description && (
                        <p className="text-gray-600 text-sm mt-1 italic">{t('modal.noDescription')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            ) : null}

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-gray-700 sticky bottom-0 bg-gray-800">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {t('modal.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      <EditAudioModal
        audio={editingAudio}
        lessonId={editingLessonId}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleEditSave}
      />
    </div>
  );
}
