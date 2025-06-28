'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { Label } from '@/components/ui/label';
import {
  Route,
  Link,
  Image as ImageIcon,
  Type,
  FileText,
  Globe,
  BookOpen,
  Check,
} from 'lucide-react';

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

interface FormData {
  slug: string;
  imageUrl: string;
  courseIds: string[];
  translations: {
    pt: Translation;
    es: Translation;
    it: Translation;
  };
}

interface CreateTrackPayload {
  slug: string;
  imageUrl: string;
  courseIds: string[];
  translations: Translation[];
}

export default function CreateTrackForm() {
  const t = useTranslations('Admin.createTrack');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [formData, setFormData] = useState<FormData>({
    slug: '',
    imageUrl: '',
    courseIds: [],
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

  // Função para buscar cursos
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

      const data: Course[] = await response.json();
      setCourses(data);
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
  }, [toast, t, handleApiError]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.slug.trim()) {
      newErrors.slug = t('errors.slugRequired');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = t('errors.slugInvalid');
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = t('errors.imageRequired');
    }

    if (formData.courseIds.length === 0) {
      newErrors.courseIds = t('errors.coursesRequired');
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

  const createTrack = useCallback(
    async (payload: CreateTrackPayload): Promise<void> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tracks`,
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
          `Failed to create track: ${response.status}`
        );
      }
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      slug: '',
      imageUrl: '',
      courseIds: [],
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
      const payload: CreateTrackPayload = {
        slug: formData.slug,
        imageUrl: formData.imageUrl,
        courseIds: formData.courseIds,
        translations: Object.values(formData.translations),
      };

      await createTrack(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'Track creation error');
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

  const handleSlugChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      slug: value.toLowerCase().replace(/\s/g, '-'),
    }));
  }, []);

  const handleImageUrlChange = useCallback(
    (value: string) => {
      setFormData(prev => ({
        ...prev,
        imageUrl: value,
      }));
    },
    []
  );

  const toggleCourse = useCallback((courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
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

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <Route size={24} className="text-secondary" />
          {t('title')}
        </h3>

        {/* Informações básicas */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="space-y-2">
            <Label
              htmlFor="slug"
              className="text-gray-300 flex items-center gap-2"
            >
              <Link size={16} />
              {t('fields.slug')}
            </Label>
            <TextField
              id="slug"
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
            <Label
              htmlFor="imageUrl"
              className="text-gray-300 flex items-center gap-2"
            >
              <ImageIcon size={16} />
              {t('fields.imageUrl')}
            </Label>
            <TextField
              id="imageUrl"
              placeholder={t('placeholders.imageUrl')}
              value={formData.imageUrl}
              onChange={e =>
                handleImageUrlChange(e.target.value)
              }
              error={errors.imageUrl}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Seleção de Cursos */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <BookOpen size={20} />
            {t('courses.title')}
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            {t('courses.description')}
          </p>

          {errors.courseIds && (
            <p className="text-xs text-red-500 mb-2">
              {errors.courseIds}
            </p>
          )}

          {loadingCourses ? (
            <div className="animate-pulse">
              <div className="grid gap-2">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-16 bg-gray-700 rounded"
                  ></div>
                ))}
              </div>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {courses.map(course => {
                const courseTranslation =
                  getTranslationByLocale(
                    course.translations,
                    locale
                  );
                const isSelected =
                  formData.courseIds.includes(course.id);

                return (
                  <div
                    key={course.id}
                    onClick={() => toggleCourse(course.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                      ${
                        isSelected
                          ? 'bg-secondary/20 border-2 border-secondary'
                          : 'bg-gray-700/50 border-2 border-transparent hover:bg-gray-700'
                      }
                    `}
                  >
                    <div
                      className={`
                      w-6 h-6 rounded flex items-center justify-center
                      ${
                        isSelected
                          ? 'bg-secondary'
                          : 'bg-gray-600'
                      }
                    `}
                    >
                      {isSelected && (
                        <Check
                          size={16}
                          className="text-primary"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {courseTranslation?.title ||
                          'Sem título'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {course.slug}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-700/50 rounded-lg">
              <BookOpen
                size={48}
                className="text-gray-500 mx-auto mb-2"
              />
              <p className="text-gray-400">
                {t('courses.noCourses')}
              </p>
            </div>
          )}
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
