// /src/components/DocumentsList.tsx
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
  FileText,
  Edit,
  Trash2,
  Eye,
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Play,
  BookOpen,
  Download,
  Calendar,
} from 'lucide-react';
import Image from 'next/image';
import DocumentViewModal from './DocumentViewModal';

interface Translation {
  locale: string;
  title: string;
  description: string;
  url: string;
}

interface DocumentItem {
  id: string;
  filename: string;
  fileSize: number;
  fileSizeInMB: number;
  mimeType: string;
  isDownloadable: boolean;
  downloadCount: number;
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
  documents?: DocumentItem[];
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
  documentCount: number;
}

interface ModuleStats {
  lessonCount: number;
  documentCount: number;
}

export default function DocumentsList() {
  const t = useTranslations('Admin.documentsList');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [coursesWithDocuments, setCoursesWithDocuments] =
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

  // Estados para controlar o modal de documento
  const [isDocumentModalOpen, setIsDocumentModalOpen] =
    useState(false);
  const [selectedDocumentData, setSelectedDocumentData] =
    useState<{
      lessonId: string;
      documentId: string;
    } | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333';

  // Debug: Log dos estados do modal
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('DocumentsList: Modal state changed', {
        isOpen: isDocumentModalOpen,
        selectedData: selectedDocumentData,
      });
    }
  }, [isDocumentModalOpen, selectedDocumentData]);

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

  // Função para buscar documentos de uma aula específica
  const fetchDocumentsForLesson = useCallback(
    async (lessonId: string): Promise<DocumentItem[]> => {
      try {
        const response = await fetch(
          `${apiUrl}/lessons/${lessonId}/documents`
        );

        if (!response.ok) {
          return [];
        }

        return await response.json();
      } catch (error) {
        handleApiError(
          error,
          `Error fetching documents for lesson ${lessonId}`
        );
        return [];
      }
    },
    [handleApiError, apiUrl]
  );

  // Função para buscar aulas de um módulo específico
  const fetchLessonsForModule = useCallback(
    async (
      courseId: string,
      moduleId: string
    ): Promise<Lesson[]> => {
      try {
        const response = await fetch(
          `${apiUrl}/courses/${courseId}/modules/${moduleId}/lessons`
        );

        if (!response.ok) {
          return [];
        }

        const lessonsData = await response.json();
        const lessons = lessonsData.lessons || [];

        // Buscar documentos para cada aula
        const lessonsWithDocuments = await Promise.all(
          lessons.map(async (lesson: Lesson) => {
            const documents = await fetchDocumentsForLesson(
              lesson.id
            );
            return { ...lesson, documents };
          })
        );

        // Garantir que as aulas estejam ordenadas por order
        return lessonsWithDocuments.sort(
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
    [handleApiError, fetchDocumentsForLesson, apiUrl]
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

        const modules: Module[] = await response.json();

        // Buscar aulas e documentos para cada módulo
        const modulesWithData = await Promise.all(
          modules.map(async moduleItem => {
            const lessons = await fetchLessonsForModule(
              courseId,
              moduleItem.id
            );
            return { ...moduleItem, lessons };
          })
        );

        // Garantir que os módulos estejam ordenados
        return modulesWithData.sort(
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

  // Função principal para buscar todos os dados
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

      setCoursesWithDocuments(coursesWithData);
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

  // Função auxiliar para obter tradução por locale
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

  // Função para formatar tamanho de arquivo
  const formatFileSize = useCallback((sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  }, []);

  // Função para deletar documento após confirmação
  const deleteDocument = useCallback(
    async (lessonId: string, documentId: string) => {
      try {
        const response = await fetch(
          `${apiUrl}/lessons/${lessonId}/documents/${documentId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete document: ${response.status}`
          );
        }

        toast({
          title: t('success.deleteTitle'),
          description: t('success.deleteDescription'),
          variant: 'default',
        });

        await fetchData();
      } catch (error) {
        handleApiError(error, 'Document deletion error');
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
    async (lessonId: string, documentId: string) => {
      // Encontrar o curso, módulo, lição e documento
      const course = coursesWithDocuments.find(c =>
        c.modules?.some(m =>
          m.lessons?.some(l => l.id === lessonId)
        )
      );
      if (!course) return;

      const moduleItem = course.modules?.find(m =>
        m.lessons?.some(l => l.id === lessonId)
      );
      if (!moduleItem) return;

      const lesson = moduleItem.lessons?.find(
        l => l.id === lessonId
      );
      if (!lesson) return;

      const document = lesson.documents?.find(
        d => d.id === documentId
      );
      if (!document) return;

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
      const documentTranslation = getTranslationByLocale(
        document.translations,
        locale
      );

      // Toast de confirmação personalizado
      toast({
        title: t('deleteConfirmation.title'),
        description: (
          <div className="space-y-3">
            <p className="text-sm">
              {t('deleteConfirmation.message', {
                documentName:
                  documentTranslation?.title ||
                  t('noTitle'),
              })}
            </p>
            <div className="bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  {t('deleteConfirmation.document')}:{' '}
                  {documentTranslation?.title ||
                    t('noTitle')}
                </div>
                <div className="flex items-center gap-2">
                  <Play size={14} />
                  {t('deleteConfirmation.lesson')}:{' '}
                  {lessonTranslation?.title || t('noTitle')}
                </div>
                <div className="flex items-center gap-2">
                  <Package size={14} />
                  {t('deleteConfirmation.module')}:{' '}
                  {moduleTranslation?.title || t('noTitle')}
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} />
                  {t('deleteConfirmation.course')}:{' '}
                  {courseTranslation?.title || t('noTitle')}
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={14} />
                  {t('deleteConfirmation.filename')}:{' '}
                  {document.filename}
                </div>
                <div className="flex items-center gap-2">
                  <Download size={14} />
                  {t('deleteConfirmation.fileSize')}:{' '}
                  {formatFileSize(document.fileSizeInMB)}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {t('deleteConfirmation.downloads')}:{' '}
                  {document.downloadCount}
                </div>
                {documentTranslation?.description && (
                  <div className="mt-2 p-2 bg-gray-600/30 rounded text-xs">
                    &ldquo;
                    {documentTranslation.description.substring(
                      0,
                      100
                    )}
                    {documentTranslation.description
                      .length > 100
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
                deleteDocument(lessonId, documentId)
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
      deleteDocument,
      coursesWithDocuments,
      t,
      locale,
      getTranslationByLocale,
      formatFileSize,
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

  const handleOpenDocumentModal = useCallback(
    (lessonId: string, documentId: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          'DocumentsList: handleOpenDocumentModal called',
          {
            lessonId,
            documentId,
          }
        );
      }

      setSelectedDocumentData({ lessonId, documentId });
      setIsDocumentModalOpen(true);

      if (process.env.NODE_ENV === 'development') {
        console.log('DocumentsList: States updated', {
          isOpen: true,
          data: { lessonId, documentId },
        });
      }
    },
    []
  );

  const handleCloseDocumentModal = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'DocumentsList: handleCloseDocumentModal called'
      );
    }
    setIsDocumentModalOpen(false);
    setSelectedDocumentData(null);
  }, []);

  // Função para calcular estatísticas de um curso
  const getCourseStats = useCallback(
    (course: Course): CourseStats => {
      const moduleCount = course.modules?.length || 0;
      const lessonCount =
        course.modules?.reduce(
          (sum, module) =>
            sum + (module.lessons?.length || 0),
          0
        ) || 0;
      const documentCount =
        course.modules?.reduce(
          (sum, module) =>
            sum +
            (module.lessons?.reduce(
              (lessonSum, lesson) =>
                lessonSum + (lesson.documents?.length || 0),
              0
            ) || 0),
          0
        ) || 0;

      return { moduleCount, lessonCount, documentCount };
    },
    []
  );

  // Função para calcular estatísticas de um módulo
  const getModuleStats = useCallback(
    (module: Module): ModuleStats => {
      const lessonCount = module.lessons?.length || 0;
      const documentCount =
        module.lessons?.reduce(
          (sum, lesson) =>
            sum + (lesson.documents?.length || 0),
          0
        ) || 0;

      return { lessonCount, documentCount };
    },
    []
  );

  // Filtrar baseado na busca
  const filteredCourses = useMemo(() => {
    return coursesWithDocuments.filter(course => {
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

          return lesson.documents?.some(document => {
            const documentTranslation =
              getTranslationByLocale(
                document.translations,
                locale
              );
            return (
              document.filename
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              documentTranslation?.title
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              documentTranslation?.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            );
          });
        });
      });
    });
  }, [
    coursesWithDocuments,
    searchTerm,
    locale,
    getTranslationByLocale,
  ]);

  // Estatísticas gerais
  const totalStats = useMemo(() => {
    const totalCourses = coursesWithDocuments.length;
    const totalModules = coursesWithDocuments.reduce(
      (sum, course) => sum + (course.modules?.length || 0),
      0
    );
    const totalLessons = coursesWithDocuments.reduce(
      (sum, course) =>
        sum +
        (course.modules?.reduce(
          (moduleSum, module) =>
            moduleSum + (module.lessons?.length || 0),
          0
        ) || 0),
      0
    );
    const totalDocuments = coursesWithDocuments.reduce(
      (sum, course) =>
        sum +
        (course.modules?.reduce(
          (moduleSum, module) =>
            moduleSum +
            (module.lessons?.reduce(
              (lessonSum, lesson) =>
                lessonSum + (lesson.documents?.length || 0),
              0
            ) || 0),
          0
        ) || 0),
      0
    );

    return {
      totalCourses,
      totalModules,
      totalLessons,
      totalDocuments,
    };
  }, [coursesWithDocuments]);

  // Debug log para o modal (movido para desenvolvimento apenas)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        'Rendering DocumentViewModal with props:',
        {
          lessonId: selectedDocumentData?.lessonId || null,
          documentId:
            selectedDocumentData?.documentId || null,
          isOpen: isDocumentModalOpen,
        }
      );
    }
  }, [selectedDocumentData, isDocumentModalOpen]);

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
          <FileText size={24} className="text-secondary" />
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
            {totalStats.totalCourses}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalCourses')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {totalStats.totalModules}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalModules')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {totalStats.totalLessons}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalLessons')}
          </p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">
            {totalStats.totalDocuments}
          </p>
          <p className="text-sm text-gray-400">
            {t('stats.totalDocuments')}
          </p>
        </div>
      </div>

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
            const courseStats = getCourseStats(course);

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
                        t('noTitle')}
                    </h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {t('slug')}: {course.slug}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package size={12} />
                        {courseStats.moduleCount}{' '}
                        {t('modules')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Play size={12} />
                        {courseStats.lessonCount}{' '}
                        {t('lessons')}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {courseStats.documentCount}{' '}
                        {t('documents')}
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
                          const moduleTranslation =
                            getTranslationByLocale(
                              module.translations,
                              locale
                            );
                          const isModuleExpanded =
                            expandedModules.has(module.id);
                          const moduleStats =
                            getModuleStats(module);

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
                                      t('noTitle')}
                                  </h5>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>
                                      {t('slug')}:{' '}
                                      {module.slug}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Play size={10} />
                                      {
                                        moduleStats.lessonCount
                                      }{' '}
                                      {t('lessons')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <FileText size={10} />
                                      {
                                        moduleStats.documentCount
                                      }{' '}
                                      {t('documents')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Aulas do módulo */}
                              {isModuleExpanded && (
                                <div className="bg-gray-800/30 p-4">
                                  {moduleStats.lessonCount >
                                  0 ? (
                                    <div className="space-y-3 pl-2">
                                      {module.lessons?.map(
                                        lesson => {
                                          const lessonTranslation =
                                            getTranslationByLocale(
                                              lesson.translations,
                                              locale
                                            );
                                          const isLessonExpanded =
                                            expandedLessons.has(
                                              lesson.id
                                            );
                                          const documentCount =
                                            lesson.documents
                                              ?.length || 0;

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
                                                className="flex items-center gap-4 p-3 bg-gray-700/30 border border-gray-700/50 rounded hover:bg-gray-700/50 transition-colors cursor-pointer"
                                              >
                                                <button
                                                  type="button"
                                                  className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                  {isLessonExpanded ? (
                                                    <ChevronDown
                                                      size={
                                                        16
                                                      }
                                                    />
                                                  ) : (
                                                    <ChevronRight
                                                      size={
                                                        16
                                                      }
                                                    />
                                                  )}
                                                </button>

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
                                                      t(
                                                        'noTitle'
                                                      )}
                                                  </h6>
                                                  <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1.5">
                                                      <FileText
                                                        size={
                                                          12
                                                        }
                                                      />
                                                      {
                                                        documentCount
                                                      }{' '}
                                                      {t(
                                                        'documents'
                                                      )}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Documentos da aula */}
                                              {isLessonExpanded && (
                                                <div className="bg-gray-800/20 p-3">
                                                  {documentCount >
                                                  0 ? (
                                                    <div className="space-y-2 pl-2">
                                                      {lesson.documents?.map(
                                                        document => {
                                                          const documentTranslation =
                                                            getTranslationByLocale(
                                                              document.translations,
                                                              locale
                                                            );

                                                          return (
                                                            <div
                                                              key={
                                                                document.id
                                                              }
                                                              className="flex items-center gap-3 p-2 bg-gray-700/20 rounded hover:bg-gray-700/40 transition-colors"
                                                            >
                                                              <div className="w-8 h-6 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                                                                <FileText
                                                                  size={
                                                                    12
                                                                  }
                                                                  className="text-white"
                                                                />
                                                              </div>

                                                              <div className="flex-1 min-w-0">
                                                                <p className="text-white text-sm font-medium truncate">
                                                                  {documentTranslation?.title ||
                                                                    t(
                                                                      'noTitle'
                                                                    )}
                                                                </p>
                                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                  <span>
                                                                    {t(
                                                                      'filename'
                                                                    )}

                                                                    :{' '}
                                                                    {
                                                                      document.filename
                                                                    }
                                                                  </span>
                                                                  <span className="flex items-center gap-1">
                                                                    <Download
                                                                      size={
                                                                        10
                                                                      }
                                                                    />
                                                                    {formatFileSize(
                                                                      document.fileSizeInMB
                                                                    )}
                                                                  </span>
                                                                  <span>
                                                                    {t(
                                                                      'downloads'
                                                                    )}

                                                                    :{' '}
                                                                    {
                                                                      document.downloadCount
                                                                    }
                                                                  </span>
                                                                </div>
                                                              </div>

                                                              {/* Ações */}
                                                              <div className="flex items-center gap-2">
                                                                <button
                                                                  type="button"
                                                                  onClick={e => {
                                                                    if (
                                                                      process
                                                                        .env
                                                                        .NODE_ENV ===
                                                                      'development'
                                                                    ) {
                                                                      console.log(
                                                                        'Eye button clicked!',
                                                                        {
                                                                          lessonId:
                                                                            lesson.id,
                                                                          documentId:
                                                                            document.id,
                                                                          event:
                                                                            e,
                                                                        }
                                                                      );
                                                                    }

                                                                    e.stopPropagation();
                                                                    e.preventDefault();

                                                                    handleOpenDocumentModal(
                                                                      lesson.id,
                                                                      document.id
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
                                                                    // Função edit ainda não implementada
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
                                                                      lesson.id,
                                                                      document.id
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
                                                      <FileText
                                                        size={
                                                          32
                                                        }
                                                        className="text-gray-500 mx-auto mb-2"
                                                      />
                                                      <p className="text-gray-400 text-sm">
                                                        {t(
                                                          'noDocuments'
                                                        )}
                                                      </p>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
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
          <FileText
            size={64}
            className="text-gray-500 mx-auto mb-4"
          />
          <p className="text-gray-400">
            {searchTerm ? t('noResults') : t('noCourses')}
          </p>
        </div>
      )}

      {/* Modal de Visualização de Documento */}
      <DocumentViewModal
        lessonId={selectedDocumentData?.lessonId || null}
        documentId={
          selectedDocumentData?.documentId || null
        }
        isOpen={isDocumentModalOpen}
        onClose={handleCloseDocumentModal}
      />
    </div>
  );
}
