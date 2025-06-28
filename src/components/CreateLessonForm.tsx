'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { Label } from '@/components/ui/label';
import {
  Play,
  Package,
  Image as ImageIcon,
  Type,
  FileText,
  Globe,
  BookOpen,
  Video,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface VideoItem {
  id: string;
  slug: string;
  durationInSeconds: number;
  translations: Translation[];
}

interface ModuleItem {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

interface CourseItem {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
  modules?: ModuleItem[];
}

interface FormData {
  courseId: string;
  moduleId: string;
  imageUrl: string;
  videoId: string;
  translations: Record<'pt' | 'es' | 'it', Translation>;
}

interface CreateLessonPayload {
  imageUrl?: string;
  videoId?: string;
  translations: Translation[];
}

export default function CreateLessonForm() {
  const t = useTranslations('Admin.createLesson');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] =
    useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    moduleId: '',
    imageUrl: '',
    videoId: '',
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

  // Função para buscar módulos de um curso específico
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<ModuleItem[]> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/modules`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch modules: ${response.status}`
          );
        }

        return await response.json();
      } catch (error) {
        handleApiError(error, 'Module fetch error');
        return [];
      }
    },
    [handleApiError]
  );

  // Função para buscar cursos com seus módulos
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

      const data: CourseItem[] = await response.json();

      const coursesWithModules = await Promise.all(
        data.map(async course => {
          const modules = await fetchModulesForCourse(
            course.id
          );
          return { ...course, modules };
        })
      );

      setCourses(coursesWithModules);
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

  // Função para buscar vídeos de um módulo específico
  const fetchVideosForModule = useCallback(
    async (
      courseId: string,
      moduleId: string
    ): Promise<VideoItem[]> => {
      try {
        const lessonsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/modules/${moduleId}/lessons`
        );

        if (!lessonsResponse.ok) {
          return [];
        }

        const { lessons } = await lessonsResponse.json();

        if (!lessons?.length) {
          return [];
        }

        const videoResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/lessons/${lessons[0].id}/videos`
        );

        if (!videoResponse.ok) {
          return [];
        }

        return await videoResponse.json();
      } catch (error) {
        handleApiError(error, 'Videos fetch error');
        return [];
      }
    },
    [handleApiError]
  );

  // Função para buscar vídeos baseado no curso e módulo selecionados
  const fetchVideos = useCallback(async () => {
    if (!formData.courseId || !formData.moduleId) return;

    setLoadingVideos(true);

    try {
      const videoList = await fetchVideosForModule(
        formData.courseId,
        formData.moduleId
      );
      setVideos(videoList);
    } finally {
      setLoadingVideos(false);
    }
  }, [
    formData.courseId,
    formData.moduleId,
    fetchVideosForModule,
  ]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.courseId) {
      newErrors.courseId = t('errors.courseRequired');
    }

    if (!formData.moduleId) {
      newErrors.moduleId = t('errors.moduleRequired');
    }

    (['pt', 'es', 'it'] as const).forEach(locale => {
      const { title, description } =
        formData.translations[locale];

      if (!title.trim()) {
        newErrors[`title_${locale}`] = t(
          'errors.titleRequired'
        );
      }

      if (!description.trim()) {
        newErrors[`description_${locale}`] = t(
          'errors.descriptionRequired'
        );
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = useCallback(() => {
    setFormData({
      courseId: '',
      moduleId: '',
      imageUrl: '',
      videoId: '',
      translations: {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      },
    });
    setErrors({});
  }, []);

  const createLesson = useCallback(
    async (payload: CreateLessonPayload): Promise<void> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${formData.courseId}/modules/${formData.moduleId}/lessons`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create lesson: ${response.status}`
        );
      }
    },
    [formData.courseId, formData.moduleId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload: CreateLessonPayload = {
        translations: Object.values(formData.translations),
      };

      if (formData.imageUrl) {
        payload.imageUrl = formData.imageUrl;
      }

      if (formData.videoId) {
        payload.videoId = formData.videoId;
      }

      await createLesson(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'Lesson creation error');
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
      }));
    },
    []
  );

  const selectedCourse = courses.find(
    course => course.id === formData.courseId
  );
  const availableModules = selectedCourse?.modules || [];

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

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <Play size={24} className="text-secondary" />
          {t('title')}
        </h3>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <BookOpen size={16} /> {t('fields.course')}
            </Label>
            <select
              value={formData.courseId}
              onChange={e =>
                handleCourseChange(e.target.value)
              }
              disabled={loadingCourses}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50"
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
                  <option key={course.id} value={course.id}>
                    {courseTranslation.title || course.slug}
                  </option>
                );
              })}
            </select>
            {errors.courseId && (
              <p className="text-xs text-red-500">
                {errors.courseId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Package size={16} /> {t('fields.module')}
            </Label>
            <select
              value={formData.moduleId}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  moduleId: e.target.value,
                }))
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
                    {moduleTranslation.title || module.slug}
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
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <ImageIcon size={16} /> {t('fields.imageUrl')}
            </Label>
            <TextField
              placeholder={t('placeholders.imageUrl')}
              value={formData.imageUrl}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  imageUrl: e.target.value,
                }))
              }
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500">
              {t('hints.imageUrl')}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Video size={16} /> {t('fields.video')}
            </Label>
            <select
              value={formData.videoId}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  videoId: e.target.value,
                }))
              }
              disabled={
                loadingVideos || videos.length === 0
              }
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50"
            >
              <option value="">
                {t('placeholders.video')}
              </option>
              {videos.map(video => {
                const videoTranslation =
                  getTranslationByLocale(
                    video.translations,
                    locale
                  );
                return (
                  <option key={video.id} value={video.id}>
                    {videoTranslation.title || video.slug}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-gray-500">
              {t('hints.video')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe size={20} /> {t('translations.title')}
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
                    <Type size={16} /> {t('fields.title')}
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
                    <FileText size={16} />{' '}
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
