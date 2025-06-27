// src/app/[locale]/admin/components/CreateLessonForm.tsx

'use client';

import { useState, useEffect } from 'react';
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
  Check,
  X,
  Video,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Video {
  id: string;
  slug: string;
  durationInSeconds: number;
  translations: Translation[];
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

interface FormData {
  courseId: string;
  moduleId: string;
  imageUrl: string;
  videoId: string;
  translations: {
    pt: Translation;
    es: Translation;
    it: Translation;
  };
}

export default function CreateLessonForm() {
  const t = useTranslations('Admin.createLesson');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingCourses, setLoadingCourses] =
    useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);

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

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (formData.courseId && formData.moduleId) {
      fetchVideos();
    }
  }, [formData.courseId, formData.moduleId]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const coursesData = await response.json();

      // Buscar módulos para cada curso
      const coursesWithModules = await Promise.all(
        coursesData.map(async (course: Course) => {
          try {
            const modulesResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/courses/${course.id}/modules`
            );
            if (modulesResponse.ok) {
              const modules = await modulesResponse.json();
              return { ...course, modules };
            }
          } catch (error) {
            console.error(
              `Error fetching modules for course ${course.id}:`,
              error
            );
          }
          return { ...course, modules: [] };
        })
      );

      setCourses(coursesWithModules);
    } catch (error) {
      toast({
        title: t('error.fetchCoursesTitle'),
        description: t('error.fetchCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchVideos = async () => {
    if (!formData.courseId || !formData.moduleId) return;

    setLoadingVideos(true);
    try {
      // Primeiro, buscar uma aula existente para obter vídeos
      const lessonsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${formData.courseId}/modules/${formData.moduleId}/lessons`
      );

      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        if (
          lessonsData.lessons &&
          lessonsData.lessons.length > 0
        ) {
          // Buscar vídeos da primeira aula como exemplo
          const videosResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/courses/${formData.courseId}/lessons/${lessonsData.lessons[0].id}/videos`
          );

          if (videosResponse.ok) {
            const videosData = await videosResponse.json();
            setVideos(videosData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.courseId) {
      newErrors.courseId = t('errors.courseRequired');
    }

    if (!formData.moduleId) {
      newErrors.moduleId = t('errors.moduleRequired');
    }

    // Validar traduções
    const locales = ['pt', 'es', 'it'] as const;
    locales.forEach(locale => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const translations = Object.values(
        formData.translations
      );

      const requestBody: any = {
        translations,
      };

      if (formData.imageUrl) {
        requestBody.imageUrl = formData.imageUrl;
      }

      if (formData.videoId) {
        requestBody.videoId = formData.videoId;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${formData.courseId}/modules/${formData.moduleId}/lessons`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create lesson');
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      // Limpar formulário
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
    } catch (error) {
      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTranslation = (
    locale: 'pt' | 'es' | 'it',
    field: 'title' | 'description',
    value: string
  ) => {
    setFormData({
      ...formData,
      translations: {
        ...formData.translations,
        [locale]: {
          ...formData.translations[locale],
          [field]: value,
        },
      },
    });
  };

  const selectedCourse = courses.find(
    c => c.id === formData.courseId
  );
  const availableModules = selectedCourse?.modules || [];

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

        {/* Seleção de Curso e Módulo */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <BookOpen size={16} />
              {t('fields.course')}
            </Label>
            <select
              value={formData.courseId}
              onChange={e => {
                setFormData({
                  ...formData,
                  courseId: e.target.value,
                  moduleId: '', // Reset module when course changes
                });
              }}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">
                {t('placeholders.course')}
              </option>
              {courses.map(course => {
                const courseTranslation =
                  course.translations.find(
                    t => t.locale === locale
                  ) || course.translations[0];
                return (
                  <option key={course.id} value={course.id}>
                    {courseTranslation?.title ||
                      course.slug}
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
              <Package size={16} />
              {t('fields.module')}
            </Label>
            <select
              value={formData.moduleId}
              onChange={e =>
                setFormData({
                  ...formData,
                  moduleId: e.target.value,
                })
              }
              disabled={!formData.courseId}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50"
            >
              <option value="">
                {t('placeholders.module')}
              </option>
              {availableModules.map(module => {
                const moduleTranslation =
                  module.translations.find(
                    t => t.locale === locale
                  ) || module.translations[0];
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
        </div>

        {/* Campos opcionais */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <ImageIcon size={16} />
              {t('fields.imageUrl')}
            </Label>
            <TextField
              placeholder={t('placeholders.imageUrl')}
              value={formData.imageUrl}
              onChange={e =>
                setFormData({
                  ...formData,
                  imageUrl: e.target.value,
                })
              }
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500">
              {t('hints.imageUrl')}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Video size={16} />
              {t('fields.video')}
            </Label>
            <select
              value={formData.videoId}
              onChange={e =>
                setFormData({
                  ...formData,
                  videoId: e.target.value,
                })
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
                  video.translations.find(
                    t => t.locale === locale
                  ) || video.translations[0];
                return (
                  <option key={video.id} value={video.id}>
                    {videoTranslation?.title || video.slug}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-gray-500">
              {t('hints.video')}
            </p>
          </div>
        </div>

        {/* Traduções */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe size={20} />
            {t('translations.title')}
          </h4>

          {/* Português */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h5 className="text-white font-medium mb-4 flex items-center gap-2">
              🇧🇷 {t('translations.portuguese')}
            </h5>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Type size={16} />
                  {t('fields.title')}
                </Label>
                <TextField
                  placeholder={t('placeholders.title')}
                  value={formData.translations.pt.title}
                  onChange={e =>
                    updateTranslation(
                      'pt',
                      'title',
                      e.target.value
                    )
                  }
                  error={errors.title_pt}
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
                    formData.translations.pt.description
                  }
                  onChange={e =>
                    updateTranslation(
                      'pt',
                      'description',
                      e.target.value
                    )
                  }
                  error={errors.description_pt}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Espanhol */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h5 className="text-white font-medium mb-4 flex items-center gap-2">
              🇪🇸 {t('translations.spanish')}
            </h5>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Type size={16} />
                  {t('fields.title')}
                </Label>
                <TextField
                  placeholder={t('placeholders.title')}
                  value={formData.translations.es.title}
                  onChange={e =>
                    updateTranslation(
                      'es',
                      'title',
                      e.target.value
                    )
                  }
                  error={errors.title_es}
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
                    formData.translations.es.description
                  }
                  onChange={e =>
                    updateTranslation(
                      'es',
                      'description',
                      e.target.value
                    )
                  }
                  error={errors.description_es}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Italiano */}
          <div className="border border-gray-700 rounded-lg p-4">
            <h5 className="text-white font-medium mb-4 flex items-center gap-2">
              🇮🇹 {t('translations.italian')}
            </h5>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Type size={16} />
                  {t('fields.title')}
                </Label>
                <TextField
                  placeholder={t('placeholders.title')}
                  value={formData.translations.it.title}
                  onChange={e =>
                    updateTranslation(
                      'it',
                      'title',
                      e.target.value
                    )
                  }
                  error={errors.title_it}
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
                    formData.translations.it.description
                  }
                  onChange={e =>
                    updateTranslation(
                      'it',
                      'description',
                      e.target.value
                    )
                  }
                  error={errors.description_it}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>
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
