// src/app/[locale]/admin/components/CreateTrackForm.tsx

'use client';

import { useState, useEffect } from 'react';
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
  X,
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

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data);
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

  const validateForm = (): boolean => {
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tracks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slug: formData.slug,
            imageUrl: formData.imageUrl,
            courseIds: formData.courseIds,
            translations,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create track');
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      // Limpar formulário
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

  const toggleCourse = (courseId: string) => {
    setFormData({
      ...formData,
      courseIds: formData.courseIds.includes(courseId)
        ? formData.courseIds.filter(id => id !== courseId)
        : [...formData.courseIds, courseId],
    });
  };

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
                setFormData({
                  ...formData,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/\s/g, '-'),
                })
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
                setFormData({
                  ...formData,
                  imageUrl: e.target.value,
                })
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
                  course.translations.find(
                    t => t.locale === locale
                  ) || course.translations[0];
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
