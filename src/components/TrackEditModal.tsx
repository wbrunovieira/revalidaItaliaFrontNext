// /src/components/TrackEditModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  Route,
  Link,
  Image as ImageIcon,
  Type,
  FileText,
  Globe,
  Save,
  Loader2,
  BookOpen,
  Check,
} from 'lucide-react';
import Image from 'next/image';

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

interface TrackCourse {
  courseId: string;
  course?: Course;
}

interface TrackEditData {
  id: string;
  slug: string;
  imageUrl: string;
  courseIds?: string[];
  trackCourses?: TrackCourse[];
  courses?: Course[];
  translations: Translation[];
}

interface TrackEditModalProps {
  track: TrackEditData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormTranslations {
  pt: Translation;
  es: Translation;
  it: Translation;
}

interface FormData {
  slug: string;
  imageUrl: string;
  courseIds: string[];
  translations: FormTranslations;
}

interface FormErrors {
  [key: string]: string;
}

export default function TrackEditModal({
  track,
  isOpen,
  onClose,
  onSave,
}: TrackEditModalProps) {
  const t = useTranslations('Admin.trackEdit');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

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

  const [availableCourses, setAvailableCourses] = useState<
    Course[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] =
    useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Função para obter o token
  const getAuthToken = (): string | null => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2)
        return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const tokenFromCookie = getCookie('token');
    const tokenFromLocal =
      localStorage.getItem('accessToken');
    const tokenFromSession =
      sessionStorage.getItem('accessToken');

    console.log('Token sources:', {
      cookie: tokenFromCookie ? 'Found' : 'Not found',
      localStorage: tokenFromLocal ? 'Found' : 'Not found',
      sessionStorage: tokenFromSession
        ? 'Found'
        : 'Not found',
    });

    return (
      tokenFromCookie || tokenFromLocal || tokenFromSession
    );
  };

  // Buscar cursos disponíveis
  const fetchAvailableCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar cursos');
      }

      const data: Course[] = await response.json();
      setAvailableCourses(data);
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      toast({
        title: t('errors.fetchCoursesTitle'),
        description: t('errors.fetchCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [t, toast]);

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

  // Função de teste para debug
  const testApiConnection = async (): Promise<void> => {
    try {
      console.log('Testando conexão com API...');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(
        'Teste GET /tracks:',
        response.status,
        response.ok
      );

      if (track) {
        const response2 = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks/${track.id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        console.log(
          'Teste GET /tracks/{id}:',
          response2.status,
          response2.ok
        );
      }
    } catch (error) {
      console.error('Erro no teste de API:', error);
    }
  };

  // Submeter formulário
  const handleSubmit = async (
    e: React.FormEvent
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm() || !track) return;

    setLoading(true);
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Converter translations object para array
      const translations = Object.values(
        formData.translations
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tracks/${track.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            slug: formData.slug.trim(),
            imageUrl: formData.imageUrl.trim(),
            courseIds: formData.courseIds,
            translations,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Não autorizado - faça login novamente'
          );
        } else if (response.status === 404) {
          throw new Error('Trilha não encontrada');
        } else if (response.status === 409) {
          throw new Error(
            'Já existe uma trilha com este slug'
          );
        }
        throw new Error('Erro ao atualizar trilha');
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar trilha:', error);
      toast({
        title: t('error.title'),
        description:
          error instanceof Error
            ? error.message
            : t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Extrair courseIds do track
  const extractCourseIds = (
    trackData: TrackEditData
  ): string[] => {
    if (
      trackData.courseIds &&
      Array.isArray(trackData.courseIds)
    ) {
      return trackData.courseIds;
    } else if (
      trackData.trackCourses &&
      Array.isArray(trackData.trackCourses)
    ) {
      return trackData.trackCourses.map(
        (tc: TrackCourse) => tc.courseId
      );
    } else if (
      trackData.courses &&
      Array.isArray(trackData.courses)
    ) {
      return trackData.courses.map((c: Course) => c.id);
    }
    return [];
  };

  // Atualizar formulário quando track mudar
  useEffect(() => {
    if (track && isOpen) {
      const translationsObj: FormTranslations = {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      };

      // Preencher traduções existentes
      track.translations.forEach(trans => {
        if (
          trans.locale === 'pt' ||
          trans.locale === 'es' ||
          trans.locale === 'it'
        ) {
          translationsObj[
            trans.locale as keyof FormTranslations
          ] = {
            locale: trans.locale,
            title: trans.title,
            description: trans.description,
          };
        }
      });

      const courseIds = extractCourseIds(track);

      setFormData({
        slug: track.slug,
        imageUrl: track.imageUrl || '',
        courseIds: courseIds,
        translations: translationsObj,
      });
      setErrors({});
    }
  }, [track, isOpen]);

  // Buscar cursos quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      fetchAvailableCourses();
    }
  }, [isOpen, fetchAvailableCourses]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const updateTranslation = (
    locale: 'pt' | 'es' | 'it',
    field: 'title' | 'description',
    value: string
  ): void => {
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

  const toggleCourse = (courseId: string): void => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
    // Limpar erro de courseIds quando selecionar pelo menos um curso
    if (errors.courseIds) {
      setErrors(prev => ({ ...prev, courseIds: '' }));
    }
  };

  const getTranslationByLocale = (
    translations: Translation[],
    targetLocale: string
  ): Translation => {
    return (
      translations.find(tr => tr.locale === targetLocale) ||
      translations[0]
    );
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Route size={28} className="text-secondary" />
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6"
        >
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Link size={16} className="inline mr-2" />
                  {t('fields.slug')}
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/\s/g, '-'),
                    })
                  }
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                    errors.slug
                      ? 'border-red-500'
                      : 'border-gray-600'
                  }`}
                  placeholder={t('placeholders.slug')}
                />
                {errors.slug && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.slug}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {t('hints.slug')}
                </p>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <ImageIcon
                    size={16}
                    className="inline mr-2"
                  />
                  {t('fields.imageUrl')}
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      imageUrl: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                    errors.imageUrl
                      ? 'border-red-500'
                      : 'border-gray-600'
                  }`}
                  placeholder={t('placeholders.imageUrl')}
                />
                {errors.imageUrl && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.imageUrl}
                  </p>
                )}
              </div>
            </div>

            {/* Seleção de Cursos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen size={20} />
                {t('courses.title')}
              </h3>
              <p className="text-sm text-gray-400">
                {t('courses.description')}
              </p>

              {errors.courseIds && (
                <p className="text-red-400 text-sm">
                  {errors.courseIds}
                </p>
              )}

              {loadingCourses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2
                    size={32}
                    className="animate-spin text-gray-400"
                  />
                </div>
              ) : availableCourses.length > 0 ? (
                <div className="grid gap-3 max-h-48 overflow-y-auto p-2 bg-gray-700/30 rounded-lg">
                  {availableCourses.map(course => {
                    const courseTranslation =
                      getTranslationByLocale(
                        course.translations,
                        locale
                      );
                    const isSelected =
                      formData.courseIds.includes(
                        course.id
                      );

                    return (
                      <div
                        key={course.id}
                        onClick={() =>
                          toggleCourse(course.id)
                        }
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-secondary/20 border border-secondary'
                            : 'bg-gray-700/50 border border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <div className="relative w-12 h-9 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={course.imageUrl}
                            alt={
                              courseTranslation?.title || ''
                            }
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">
                            {courseTranslation?.title ||
                              'Sem título'}
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {courseTranslation?.description ||
                              'Sem descrição'}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-secondary border-secondary'
                              : 'border-gray-500'
                          }`}
                        >
                          {isSelected && (
                            <Check
                              size={14}
                              className="text-primary"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  {t('courses.noCourses')}
                </p>
              )}
            </div>

            {/* Traduções */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe size={20} />
                {t('translations.title')}
              </h3>

              {/* Português */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  🇧🇷 {t('translations.portuguese')}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <Type
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.title')}
                    </label>
                    <input
                      type="text"
                      value={formData.translations.pt.title}
                      onChange={e =>
                        updateTranslation(
                          'pt',
                          'title',
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.title_pt
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t('placeholders.title')}
                    />
                    {errors.title_pt && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.title_pt}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <FileText
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.description')}
                    </label>
                    <input
                      type="text"
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
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.description_pt
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t(
                        'placeholders.description'
                      )}
                    />
                    {errors.description_pt && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.description_pt}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Espanhol */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  🇪🇸 {t('translations.spanish')}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <Type
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.title')}
                    </label>
                    <input
                      type="text"
                      value={formData.translations.es.title}
                      onChange={e =>
                        updateTranslation(
                          'es',
                          'title',
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.title_es
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t('placeholders.title')}
                    />
                    {errors.title_es && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.title_es}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <FileText
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.description')}
                    </label>
                    <input
                      type="text"
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
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.description_es
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t(
                        'placeholders.description'
                      )}
                    />
                    {errors.description_es && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.description_es}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Italiano */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                  🇮🇹 {t('translations.italian')}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <Type
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.title')}
                    </label>
                    <input
                      type="text"
                      value={formData.translations.it.title}
                      onChange={e =>
                        updateTranslation(
                          'it',
                          'title',
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.title_it
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t('placeholders.title')}
                    />
                    {errors.title_it && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.title_it}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">
                      <FileText
                        size={14}
                        className="inline mr-1"
                      />
                      {t('fields.description')}
                    </label>
                    <input
                      type="text"
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
                      className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                        errors.description_it
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t(
                        'placeholders.description'
                      )}
                    />
                    {errors.description_it && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.description_it}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 flex-shrink-0">
          <button
            type="button"
            onClick={testApiConnection}
            className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            Testar API
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
