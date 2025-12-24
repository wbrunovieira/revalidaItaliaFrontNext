// /src/components/CreateEnvironment3DForm.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/slug';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { Label } from '@/components/ui/label';
import {
  Box,
  Type,
  FileText,
  Globe,
  Check,
  X,
  Loader2,
} from 'lucide-react';

interface Translation {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description?: string;
}

interface FormData {
  slug: string;
  translations: {
    pt: Translation;
    es: Translation;
    it: Translation;
  };
}

interface FormErrors {
  slug?: string;
  title_pt?: string;
  title_es?: string;
  title_it?: string;
  description_pt?: string;
  description_es?: string;
  description_it?: string;
}

type Locale = 'pt' | 'es' | 'it';
type TranslationField = 'title' | 'description';

export default function CreateEnvironment3DForm() {
  const t = useTranslations('Admin.createEnvironment3D');
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [, setSlugGenerated] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    slug: '',
    translations: {
      pt: { locale: 'pt', title: '', description: '' },
      es: { locale: 'es', title: '', description: '' },
      it: { locale: 'it', title: '', description: '' },
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormErrors, boolean>>
  >({});

  // Validação de slug
  const validateSlug = useCallback(
    (slug: string): { isValid: boolean; message?: string } => {
      if (!slug.trim()) {
        return {
          isValid: false,
          message: t('errors.slugRequired'),
        };
      }
      if (slug.length > 100) {
        return {
          isValid: false,
          message: t('errors.slugMax'),
        };
      }
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return {
          isValid: false,
          message: t('errors.slugInvalid'),
        };
      }
      return { isValid: true };
    },
    [t]
  );

  // Validação de campos de texto
  const validateTextField = useCallback(
    (
      value: string,
      fieldType: 'title' | 'description'
    ): { isValid: boolean; message?: string } => {
      if (fieldType === 'title') {
        if (!value.trim()) {
          return {
            isValid: false,
            message: t('errors.titleRequired'),
          };
        }
        if (value.length > 200) {
          return {
            isValid: false,
            message: t('errors.titleMax'),
          };
        }
      }
      if (fieldType === 'description' && value.length > 1000) {
        return {
          isValid: false,
          message: t('errors.descriptionMax'),
        };
      }
      return { isValid: true };
    },
    [t]
  );

  // Validação do formulário completo
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validar slug
    const slugValidation = validateSlug(formData.slug);
    if (!slugValidation.isValid) {
      newErrors.slug = slugValidation.message;
      isValid = false;
    }

    // Validar traduções
    const locales: Locale[] = ['pt', 'es', 'it'];
    locales.forEach(locale => {
      const titleValidation = validateTextField(
        formData.translations[locale].title,
        'title'
      );
      if (!titleValidation.isValid) {
        newErrors[`title_${locale}` as keyof FormErrors] =
          titleValidation.message;
        isValid = false;
      }

      const descValidation = validateTextField(
        formData.translations[locale].description || '',
        'description'
      );
      if (!descValidation.isValid) {
        newErrors[`description_${locale}` as keyof FormErrors] =
          descValidation.message;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateSlug, validateTextField]);

  // Reset do formulário
  const resetForm = useCallback(() => {
    setFormData({
      slug: '',
      translations: {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      },
    });
    setErrors({});
    setTouched({});
    setSlugGenerated(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    const allFields = [
      'slug',
      'title_pt',
      'title_es',
      'title_it',
      'description_pt',
      'description_es',
      'description_it',
    ];

    const allTouched = allFields.reduce((acc, field) => {
      acc[field as keyof FormErrors] = true;
      return acc;
    }, {} as Record<keyof FormErrors, boolean>);

    setTouched(allTouched);

    if (!validateForm()) {
      toast({
        title: t('error.validationTitle'),
        description: t('error.validationDescription'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      // Preparar payload
      const translations = [
        {
          locale: 'pt' as const,
          title: formData.translations.pt.title.trim(),
          description: formData.translations.pt.description?.trim() || undefined,
        },
        {
          locale: 'it' as const,
          title: formData.translations.it.title.trim(),
          description: formData.translations.it.description?.trim() || undefined,
        },
        {
          locale: 'es' as const,
          title: formData.translations.es.title.trim(),
          description: formData.translations.es.description?.trim() || undefined,
        },
      ];

      const payload = {
        slug: formData.slug.trim(),
        translations,
      };

      console.log('📤 Enviando payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${apiUrl}/api/v1/environments-3d`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('📨 Response status:', response.status);

      if (!response.ok) {
        let errorMessage = t('error.description');

        try {
          const errorData = JSON.parse(responseText);
          if (response.status === 409) {
            errorMessage = t('error.conflictDescription');
          } else if (errorData.message) {
            errorMessage = Array.isArray(errorData.message)
              ? errorData.message[0]?.message || errorMessage
              : errorData.message;
          }
        } catch {
          // responseText não é JSON válido
        }

        throw new Error(errorMessage);
      }

      console.log('✅ Ambiente 3D criado com sucesso');

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      resetForm();
    } catch (error) {
      console.error('Environment 3D creation error:', error);

      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputBlur = useCallback(
    (field: string) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
    },
    []
  );

  const updateTranslation = useCallback(
    (
      locale: Locale,
      field: TranslationField,
      value: string
    ) => {
      setFormData(prev => {
        const newFormData = {
          ...prev,
          translations: {
            ...prev.translations,
            [locale]: {
              ...prev.translations[locale],
              [field]: value,
            },
          },
        };

        // Gerar slug automaticamente quando o título em português mudar
        if (locale === 'pt' && field === 'title' && value.trim()) {
          newFormData.slug = generateSlug(value);
          setSlugGenerated(true);
        }

        return newFormData;
      });
    },
    []
  );

  // Verificar status de validação para cada idioma
  const getTranslationStatus = useCallback(
    (
      locale: Locale
    ): { hasError: boolean; isValid: boolean } => {
      const titleError =
        errors[`title_${locale}` as keyof FormErrors];
      const descError =
        errors[`description_${locale}` as keyof FormErrors];
      const titleTouched =
        touched[`title_${locale}` as keyof FormErrors];

      const hasError = !!(titleError || descError);
      const isValid =
        !hasError &&
        !!titleTouched &&
        formData.translations[locale].title.trim().length >= 1;

      return { hasError, isValid };
    },
    [errors, touched, formData.translations]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <Box size={24} className="text-secondary" />
          {t('title')}
        </h3>

        <p className="text-gray-400 mb-6">
          {t('description')}
        </p>

        {/* Slug (URL) */}
        <div className="mb-8">
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Type size={16} />
              {t('fields.slug')}
              <span className="text-red-400">*</span>
            </Label>
            <TextField
              placeholder={t('placeholders.slug')}
              value={formData.slug}
              onChange={e => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setFormData(prev => ({ ...prev, slug: value }));
              }}
              onBlur={handleInputBlur('slug')}
              error={touched.slug ? errors.slug : undefined}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-500">
              {t('hints.slug')}
            </p>
          </div>
        </div>

        {/* Traduções */}
        <div className="space-y-6 mb-8">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe size={20} />
            {t('translations.title')}
          </h4>

          {/* Português */}
          <div
            className={`border rounded-lg p-4 transition-colors ${
              getTranslationStatus('pt').hasError
                ? 'border-red-500/50'
                : getTranslationStatus('pt').isValid
                ? 'border-green-500/50'
                : 'border-gray-700'
            }`}
          >
            <h5 className="text-white font-medium mb-4 flex items-center gap-2">
              <span role="img" aria-label="Brazil">🇧🇷</span> {t('translations.portuguese')}
              {getTranslationStatus('pt').isValid && (
                <Check size={16} className="text-green-400" />
              )}
              {getTranslationStatus('pt').hasError && (
                <X size={16} className="text-red-400" />
              )}
            </h5>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Type size={16} />
                  {t('fields.title')}
                  <span className="text-red-400">*</span>
                </Label>
                <TextField
                  placeholder={t('placeholders.title')}
                  value={formData.translations.pt.title}
                  onChange={e =>
                    updateTranslation('pt', 'title', e.target.value)
                  }
                  onBlur={handleInputBlur('title_pt')}
                  error={touched.title_pt ? errors.title_pt : undefined}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <FileText size={16} />
                  {t('fields.description')}
                </Label>
                <TextField
                  placeholder={t('placeholders.description')}
                  value={formData.translations.pt.description || ''}
                  onChange={e =>
                    updateTranslation('pt', 'description', e.target.value)
                  }
                  onBlur={handleInputBlur('description_pt')}
                  error={touched.description_pt ? errors.description_pt : undefined}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Italiano */}
          <div
            className={`border rounded-lg p-4 transition-colors ${
              getTranslationStatus('it').hasError
                ? 'border-red-500/50'
                : getTranslationStatus('it').isValid
                ? 'border-green-500/50'
                : 'border-gray-700'
            }`}
          >
            <h5 className="text-white font-medium mb-4 flex items-center gap-2">
              <span role="img" aria-label="Italy">🇮🇹</span> {t('translations.italian')}
              {getTranslationStatus('it').isValid && (
                <Check size={16} className="text-green-400" />
              )}
              {getTranslationStatus('it').hasError && (
                <X size={16} className="text-red-400" />
              )}
            </h5>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Type size={16} />
                  {t('fields.title')}
                  <span className="text-red-400">*</span>
                </Label>
                <TextField
                  placeholder={t('placeholders.title')}
                  value={formData.translations.it.title}
                  onChange={e =>
                    updateTranslation('it', 'title', e.target.value)
                  }
                  onBlur={handleInputBlur('title_it')}
                  error={touched.title_it ? errors.title_it : undefined}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <FileText size={16} />
                  {t('fields.description')}
                </Label>
                <TextField
                  placeholder={t('placeholders.description')}
                  value={formData.translations.it.description || ''}
                  onChange={e =>
                    updateTranslation('it', 'description', e.target.value)
                  }
                  onBlur={handleInputBlur('description_it')}
                  error={touched.description_it ? errors.description_it : undefined}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Espanhol */}
          <div
            className={`border rounded-lg p-4 transition-colors ${
              getTranslationStatus('es').hasError
                ? 'border-red-500/50'
                : getTranslationStatus('es').isValid
                ? 'border-green-500/50'
                : 'border-gray-700'
            }`}
          >
            <h5 className="text-white font-medium mb-4 flex items-center gap-2">
              <span role="img" aria-label="Spain">🇪🇸</span> {t('translations.spanish')}
              {getTranslationStatus('es').isValid && (
                <Check size={16} className="text-green-400" />
              )}
              {getTranslationStatus('es').hasError && (
                <X size={16} className="text-red-400" />
              )}
            </h5>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Type size={16} />
                  {t('fields.title')}
                  <span className="text-red-400">*</span>
                </Label>
                <TextField
                  placeholder={t('placeholders.title')}
                  value={formData.translations.es.title}
                  onChange={e =>
                    updateTranslation('es', 'title', e.target.value)
                  }
                  onBlur={handleInputBlur('title_es')}
                  error={touched.title_es ? errors.title_es : undefined}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <FileText size={16} />
                  {t('fields.description')}
                </Label>
                <TextField
                  placeholder={t('placeholders.description')}
                  value={formData.translations.es.description || ''}
                  onChange={e =>
                    updateTranslation('es', 'description', e.target.value)
                  }
                  onBlur={handleInputBlur('description_es')}
                  error={touched.description_es ? errors.description_es : undefined}
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
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {t('creating')}
              </>
            ) : (
              t('create')
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
