'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { Label } from '@/components/ui/label';
import {
  Video,
  Link,
  Type,
  FileText,
  Globe,
  BookOpen,
  Play,
  Layers,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  translations: Translation[];
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

interface FormData {
  courseId: string;
  moduleId: string;
  lessonId: string;
  slug: string;
  providerVideoId: string;
  translations: {
    pt: Translation;
    es: Translation;
    it: Translation;
  };
}

interface CreateVideoPayload {
  slug: string;
  providerVideoId: string;
  translations: Translation[];
}

export default function CreateVideoForm() {
  const t = useTranslations('Admin.createVideo');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] =
    useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    moduleId: '',
    lessonId: '',
    slug: '',
    providerVideoId: '',
    translations: {
      pt: { locale: 'pt', title: '', description: '' },
      es: { locale: 'es', title: '', description: '' },
      it: { locale: 'it', title: '', description: '' },
    },
  });

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

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
        return lessonsData.lessons || [];
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

        return modulesWithLessons;
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

  // Função para buscar cursos com módulos e aulas
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch courses: ${response.status}`
        );
      }

      const coursesData: Course[] = await response.json();

      // Buscar módulos e aulas para cada curso
      const coursesWithData = await Promise.all(
        coursesData.map(async course => {
          const modules = await fetchModulesForCourse(
            course.id
          );
          return { ...course, modules };
        })
      );

      setCourses(coursesWithData);
    } catch (error) {
      handleApiError(error, 'Courses fetch error');
      toast({
        title: t('error.fetchCoursesTitle'),
        description: t('error.fetchCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [toast, t, handleApiError, fetchModulesForCourse]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.courseId) {
      newErrors.courseId = t('errors.courseRequired');
    }

    if (!formData.moduleId) {
      newErrors.moduleId = t('errors.moduleRequired');
    }

    if (!formData.lessonId) {
      newErrors.lessonId = t('errors.lessonRequired');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = t('errors.slugRequired');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = t('errors.slugInvalid');
    }

    if (!formData.providerVideoId.trim()) {
      newErrors.providerVideoId = t(
        'errors.providerVideoIdRequired'
      );
    }

    // Validar traduções
    (['pt', 'es', 'it'] as const).forEach(locale => {
      if (!formData.translations[locale].title.trim()) {
        newErrors[`title_${locale}`] = t(
          'errors.titleRequired'
        );
      }
      if (
        !formData.translations[locale].description.trim()
      ) {
        newErrors[`description_${locale}`] = t(
          'errors.descriptionRequired'
        );
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const createVideo = useCallback(
    async (payload: CreateVideoPayload): Promise<void> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${formData.courseId}/lessons/${formData.lessonId}/videos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create video: ${response.status}`
        );
      }
    },
    [formData.courseId, formData.lessonId]
  );

  const resetForm = useCallback(() => {
    setFormData({
      courseId: '',
      moduleId: '',
      lessonId: '',
      slug: '',
      providerVideoId: '',
      translations: {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      },
    });
    setErrors({});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload: CreateVideoPayload = {
        slug: formData.slug,
        providerVideoId: formData.providerVideoId,
        translations: Object.values(formData.translations),
      };

      await createVideo(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'Video creation error');
      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTranslation = useCallback(
    (
      locale: 'pt' | 'es' | 'it',
      field: 'title' | 'description',
      value: string
    ) => {
      setFormData(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          [locale]: {
            ...prev.translations[locale],
            [field]: value,
          },
        },
      }));
    },
    []
  );

  const handleCourseChange = useCallback(
    (courseId: string) => {
      setFormData(prev => ({
        ...prev,
        courseId,
        moduleId: '', // Reset module when course changes
        lessonId: '', // Reset lesson when course changes
      }));
    },
    []
  );

  const handleModuleChange = useCallback(
    (moduleId: string) => {
      setFormData(prev => ({
        ...prev,
        moduleId,
        lessonId: '', // Reset lesson when module changes
      }));
    },
    []
  );

  const handleLessonChange = useCallback(
    (lessonId: string) => {
      setFormData(prev => ({ ...prev, lessonId }));
    },
    []
  );

  const handleSlugChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      slug: value.toLowerCase().replace(/\s/g, '-'),
    }));
  }, []);

  const handleProviderVideoIdChange = useCallback(
    (value: string) => {
      setFormData(prev => ({
        ...prev,
        providerVideoId: value,
      }));
    },
    []
  );

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

  const selectedCourse = courses.find(
    course => course.id === formData.courseId
  );

  const availableModules = selectedCourse?.modules || [];

  const selectedModule = availableModules.find(
    module => module.id === formData.moduleId
  );

  const availableLessons = selectedModule?.lessons || [];

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <Video size={24} className="text-secondary" />
          {t('title')}
        </h3>

        {/* Seleção de Curso, Módulo e Aula */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Seleção de Curso */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <BookOpen size={16} />
              {t('fields.course')}
            </Label>
            {loadingCourses ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-700 rounded"></div>
              </div>
            ) : (
              <select
                value={formData.courseId}
                onChange={e =>
                  handleCourseChange(e.target.value)
                }
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">
                  {t('placeholders.course')}
                </option>
                {courses.map(course => {
                  const courseTranslation =
                    getTranslationByLocale(
                      course.translations,
                      locale
                    );
                  return (
                    <option
                      key={course.id}
                      value={course.id}
                    >
                      {courseTranslation?.title ||
                        course.slug}
                    </option>
                  );
                })}
              </select>
            )}
            {errors.courseId && (
              <p className="text-xs text-red-500">
                {errors.courseId}
              </p>
            )}
          </div>

          {/* Seleção de Módulo */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Layers size={16} />
              {t('fields.module')}
            </Label>
            <select
              value={formData.moduleId}
              onChange={e =>
                handleModuleChange(e.target.value)
              }
              disabled={!formData.courseId}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50"
            >
              <option value="">
                {t('placeholders.module')}
              </option>
              {availableModules.map(module => {
                const moduleTranslation =
                  getTranslationByLocale(
                    module.translations,
                    locale
                  );
                return (
                  <option key={module.id} value={module.id}>
                    {moduleTranslation?.title ||
                      module.slug}
                  </option>
                );
              })}
            </select>
            {errors.moduleId && (
              <p className="text-xs text-red-500">
                {errors.moduleId}
              </p>
            )}
          </div>

          {/* Seleção de Aula */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Play size={16} />
              {t('fields.lesson')}
            </Label>
            <select
              value={formData.lessonId}
              onChange={e =>
                handleLessonChange(e.target.value)
              }
              disabled={!formData.moduleId}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50"
            >
              <option value="">
                {t('placeholders.lesson')}
              </option>
              {availableLessons.map(lesson => {
                const lessonTranslation =
                  getTranslationByLocale(
                    lesson.translations,
                    locale
                  );
                return (
                  <option key={lesson.id} value={lesson.id}>
                    {lessonTranslation?.title ||
                      `Aula ${lesson.order}`}
                  </option>
                );
              })}
            </select>
            {errors.lessonId && (
              <p className="text-xs text-red-500">
                {errors.lessonId}
              </p>
            )}
          </div>
        </div>

        {/* Informações do vídeo */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Link size={16} />
              {t('fields.slug')}
            </Label>
            <TextField
              placeholder={t('placeholders.slug')}
              value={formData.slug}
              onChange={e =>
                handleSlugChange(e.target.value)
              }
              error={errors.slug}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500">
              {t('hints.slug')}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Video size={16} />
              {t('fields.providerVideoId')}
            </Label>
            <TextField
              placeholder={t(
                'placeholders.providerVideoId'
              )}
              value={formData.providerVideoId}
              onChange={e =>
                handleProviderVideoIdChange(e.target.value)
              }
              error={errors.providerVideoId}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500">
              {t('hints.providerVideoId')}
            </p>
          </div>
        </div>

        {/* Traduções */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe size={20} />
            {t('translations.title')}
          </h4>

          {(['pt', 'es', 'it'] as const).map(loc => (
            <div
              key={loc}
              className="border border-gray-700 rounded-lg p-4"
            >
              <h5 className="text-white font-medium mb-4 flex items-center gap-2">
                {loc === 'pt'
                  ? '🇧🇷'
                  : loc === 'es'
                  ? '🇪🇸'
                  : '🇮🇹'}
                {t(
                  `translations.${
                    loc === 'pt'
                      ? 'portuguese'
                      : loc === 'es'
                      ? 'spanish'
                      : 'italian'
                  }`
                )}
              </h5>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Type size={16} />
                    {t('fields.title')}
                  </Label>
                  <TextField
                    placeholder={t('placeholders.title')}
                    value={formData.translations[loc].title}
                    onChange={e =>
                      updateTranslation(
                        loc,
                        'title',
                        e.target.value
                      )
                    }
                    error={errors[`title_${loc}`]}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <FileText size={16} />
                    {t('fields.description')}
                  </Label>
                  <TextField
                    placeholder={t(
                      'placeholders.description'
                    )}
                    value={
                      formData.translations[loc].description
                    }
                    onChange={e =>
                      updateTranslation(
                        loc,
                        'description',
                        e.target.value
                      )
                    }
                    error={errors[`description_${loc}`]}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="bg-secondary text-primary hover:bg-secondary/90 px-6 py-3"
          >
            {loading ? t('creating') : t('create')}
          </Button>
        </div>
      </div>
    </form>
  );
}
