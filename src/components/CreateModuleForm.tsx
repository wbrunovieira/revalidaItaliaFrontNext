'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Link,
  Image as ImageIcon,
  Type,
  FileText,
  Globe,
  BookOpen,
  Hash,
  AlertCircle,
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
  courseId: string;
  slug: string;
  imageUrl: string;
  order: number;
  translations: {
    pt: Translation;
    es: Translation;
    it: Translation;
  };
}

interface CreateModulePayload {
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

export default function CreateModuleForm() {
  const t = useTranslations('Admin.createModule');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    slug: '',
    imageUrl: '',
    order: 1,
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

    if (!formData.courseId) {
      newErrors.courseId = t('errors.courseRequired');
    }

    if (!formData.slug.trim()) {
      newErrors.slug = t('errors.slugRequired');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = t('errors.slugInvalid');
    }

    if (!formData.order || formData.order < 1) {
      newErrors.order = t('errors.orderRequired');
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

  const createModule = useCallback(
    async (payload: CreateModulePayload): Promise<void> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${formData.courseId}/modules`,
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
          `Failed to create module: ${response.status}`
        );
      }
    },
    [formData.courseId]
  );

  const resetForm = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      slug: '',
      imageUrl: '',
      order: prev.order + 1, // Incrementa a ordem para o próximo módulo
      translations: {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      },
    }));
    setErrors({});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload: CreateModulePayload = {
        slug: formData.slug,
        imageUrl: formData.imageUrl || null,
        order: formData.order,
        translations: Object.values(formData.translations),
      };

      await createModule(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'Module creation error');
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

  const handleOrderChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      order: parseInt(value) || 1,
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

  const selectedCourse = courses.find(
    course => course.id === formData.courseId
  );
  const courseTranslation = selectedCourse
    ? getTranslationByLocale(
        selectedCourse.translations,
        locale
      )
    : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <Package size={24} className="text-secondary" />
          {t('title')}
        </h3>

        {/* Aviso sobre aulas */}
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-yellow-500 mt-0.5"
            />
            <div>
              <p className="text-sm text-yellow-200">
                {t('info.lessonsNote')}
              </p>
            </div>
          </div>
        </div>

        {/* Seleção do Curso */}
        <div className="mb-8">
          <Label className="text-gray-300 flex items-center gap-2 mb-2">
            <BookOpen size={16} />
            {t('fields.course')}
          </Label>
          {loadingCourses ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-700 rounded"></div>
            </div>
          ) : (
            <Select
              value={formData.courseId}
              onValueChange={handleCourseChange}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue
                  placeholder={t('placeholders.course')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {courses.map(course => {
                  const translation =
                    getTranslationByLocale(
                      course.translations,
                      locale
                    );
                  return (
                    <SelectItem
                      key={course.id}
                      value={course.id}
                      className="text-white hover:bg-gray-600"
                    >
                      {translation?.title || 'Sem título'} (
                      {course.slug})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          {errors.courseId && (
            <p className="mt-1 text-xs text-red-500">
              {errors.courseId}
            </p>
          )}
        </div>

        {/* Curso selecionado */}
        {selectedCourse && (
          <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">
              {t('selectedCourse')}:
            </p>
            <p className="text-white font-medium">
              {courseTranslation?.title}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ID: {selectedCourse.id}
            </p>
          </div>
        )}

        {/* Informações básicas */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
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
            <p className="text-xs text-gray-500">
              {t('hints.imageUrl')}
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="order"
              className="text-gray-300 flex items-center gap-2"
            >
              <Hash size={16} />
              {t('fields.order')}
            </Label>
            <TextField
              id="order"
              type="number"
              min="1"
              placeholder={t('placeholders.order')}
              value={formData.order.toString()}
              onChange={e =>
                handleOrderChange(e.target.value)
              }
              error={errors.order}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500">
              {t('hints.order')}
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
            disabled={loading || !formData.courseId}
            className="bg-secondary text-primary hover:bg-secondary/90 px-6 py-3"
          >
            {loading ? t('creating') : t('create')}
          </Button>
        </div>
      </div>
    </form>
  );
}
