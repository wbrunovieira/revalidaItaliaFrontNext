'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  BookOpen,
  Link,
  Image as ImageIcon,
  Type,
  FileText,
  Globe,
  Save,
  Loader2,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface CourseEditData {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}

interface CourseEditModalProps {
  course: CourseEditData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function CourseEditModal({
  course,
  isOpen,
  onClose,
  onSave,
}: CourseEditModalProps) {
  const t = useTranslations('Admin.courseEdit');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    slug: '',
    imageUrl: '',
    translations: {
      pt: { locale: 'pt', title: '', description: '' },
      es: { locale: 'es', title: '', description: '' },
      it: { locale: 'it', title: '', description: '' },
    },
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  // Função para obter o token
  const getAuthToken = () => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2)
        return parts.pop()?.split(';').shift() || null;
      return null;
    };

    return (
      getCookie('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken')
    );
  };

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.slug.trim()) {
      newErrors.slug = t('errors.slugRequired');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = t('errors.slugInvalid');
    }

    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = t('errors.imageRequired');
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

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !course) return;

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
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            slug: formData.slug.trim(),
            imageUrl: formData.imageUrl.trim(),
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
          throw new Error('Curso não encontrado');
        } else if (response.status === 409) {
          throw new Error(
            'Já existe um curso com este slug'
          );
        }
        throw new Error('Erro ao atualizar curso');
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
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

  // Atualizar formulário quando course mudar
  useEffect(() => {
    if (course && isOpen) {
      const translationsObj = {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      };

      // Preencher traduções existentes
      course.translations.forEach(trans => {
        if (
          trans.locale === 'pt' ||
          trans.locale === 'es' ||
          trans.locale === 'it'
        ) {
          translationsObj[trans.locale] = {
            locale: trans.locale,
            title: trans.title,
            description: trans.description,
          };
        }
      });

      setFormData({
        slug: course.slug,
        imageUrl: course.imageUrl,
        translations: translationsObj,
      });
      setErrors({});
    }
  }, [course, isOpen]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
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

  if (!isOpen || !course) return null;

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
            <BookOpen
              size={28}
              className="text-secondary"
            />
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
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
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
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
