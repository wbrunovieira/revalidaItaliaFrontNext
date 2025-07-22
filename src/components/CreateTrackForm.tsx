// /src/components/CreateTrackForm.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { generateSlug, formatSlugInput } from '@/lib/slug';
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
  Wand2,
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

interface FormErrors {
  slug?: string;
  imageUrl?: string;
  courseIds?: string;
  title_pt?: string;
  title_es?: string;
  title_it?: string;
  description_pt?: string;
  description_es?: string;
  description_it?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface CreateTrackResponse {
  id: string;
  slug: string;
  imageUrl: string;
  courseIds: string[];
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

type Locale = 'pt' | 'es' | 'it';
type TranslationField = 'title' | 'description';

export default function CreateTrackForm() {
  const t = useTranslations('Admin.createTrack');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] =
    useState(true);
  const [slugGenerated, setSlugGenerated] = useState(false);

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

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormErrors, boolean>>
  >({});

  // Validação de URL
  const validateUrl = useCallback(
    (url: string): boolean => {
      try {
        // Aceita URLs relativas (começando com /)
        if (url.startsWith('/')) {
          return true;
        }
        // Valida URLs absolutas
        const urlObj = new URL(url);
        return (
          urlObj.protocol === 'http:' ||
          urlObj.protocol === 'https:'
        );
      } catch {
        return false;
      }
    },
    []
  );

  // Validação de slug
  const validateSlug = useCallback(
    (slug: string): ValidationResult => {
      if (!slug.trim()) {
        return {
          isValid: false,
          message: t('errors.slugRequired'),
        };
      }
      if (slug.trim().length < 3) {
        return {
          isValid: false,
          message: t('errors.slugMin'),
        };
      }
      if (slug.length > 50) {
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
      if (slug.startsWith('-') || slug.endsWith('-')) {
        return {
          isValid: false,
          message: t('errors.slugFormat'),
        };
      }
      if (slug.includes('--')) {
        return {
          isValid: false,
          message: t('errors.slugDoubleHyphen'),
        };
      }
      return { isValid: true };
    },
    [t]
  );

  // Função para gerar slug automaticamente
  const handleGenerateSlug = useCallback(() => {
    const ptTitle = formData.translations.pt.title.trim();

    if (!ptTitle) {
      toast({
        title: t('error.slugGenerationTitle'),
        description: t('error.slugGenerationDescription'),
        variant: 'destructive',
      });
      return;
    }

    const generatedSlug = generateSlug(ptTitle);
    setFormData(prev => ({ ...prev, slug: generatedSlug }));
    setSlugGenerated(true);

    // Marca o campo como touched e valida
    setTouched(prev => ({ ...prev, slug: true }));

    // Valida o slug gerado
    const validation = validateSlug(generatedSlug);
    if (validation.isValid) {
      setErrors(prev => ({ ...prev, slug: undefined }));
      toast({
        title: t('success.slugGenerated'),
        description: generatedSlug,
        variant: 'success',
      });
    }
  }, [
    formData.translations.pt.title,
    t,
    toast,
    validateSlug,
  ]);

  // Validação de campos de texto
  const validateTextField = useCallback(
    (
      value: string,
      fieldType: 'title' | 'description'
    ): ValidationResult => {
      if (!value.trim()) {
        return {
          isValid: false,
          message: t(`errors.${fieldType}Required`),
        };
      }
      if (value.trim().length < 3) {
        return {
          isValid: false,
          message: t(`errors.${fieldType}Min`),
        };
      }

      const maxLength = fieldType === 'title' ? 100 : 500;
      if (value.length > maxLength) {
        return {
          isValid: false,
          message: t(`errors.${fieldType}Max`),
        };
      }

      return { isValid: true };
    },
    [t]
  );

  // Validação individual de campos
  const validateField = useCallback(
    (field: string, value: string): ValidationResult => {
      if (field === 'slug') {
        return validateSlug(value);
      }

      if (field === 'imageUrl') {
        if (!value.trim()) {
          return {
            isValid: false,
            message: t('errors.imageRequired'),
          };
        }
        if (!validateUrl(value)) {
          return {
            isValid: false,
            message: t('errors.imageInvalid'),
          };
        }
        return { isValid: true };
      }

      if (field === 'courseIds') {
        if (formData.courseIds.length === 0) {
          return {
            isValid: false,
            message: t('errors.coursesRequired'),
          };
        }
        return { isValid: true };
      }

      // Validação de campos de tradução
      const match = field.match(
        /^(title|description)_(\w+)$/
      );
      if (match) {
        const [, fieldType, locale] = match;
        const translation =
          formData.translations[locale as Locale];
        if (translation) {
          const fieldValue =
            translation[fieldType as TranslationField];
          return validateTextField(
            fieldValue,
            fieldType as TranslationField
          );
        }
      }

      return { isValid: true };
    },
    [
      formData.translations,
      formData.courseIds,
      t,
      validateSlug,
      validateUrl,
      validateTextField,
    ]
  );

  // Validação em tempo real
  const handleFieldValidation = useCallback(
    (field: string, value?: string) => {
      if (touched[field as keyof FormErrors]) {
        // Para campos de tradução, buscar o valor correto
        let fieldValue = value;

        if (!fieldValue && field.includes('_')) {
          const match = field.match(
            /^(title|description)_(\w+)$/
          );
          if (match) {
            const [, fieldType, locale] = match;
            const translation =
              formData.translations[locale as Locale];
            if (translation) {
              fieldValue =
                translation[fieldType as TranslationField];
            }
          }
        } else if (!fieldValue) {
          // Para campos diretos como slug e imageUrl
          fieldValue =
            formData[
              field as keyof Pick<
                FormData,
                'slug' | 'imageUrl'
              >
            ];
        }

        const validation = validateField(
          field,
          fieldValue || ''
        );
        setErrors(prev => ({
          ...prev,
          [field]: validation.isValid
            ? undefined
            : validation.message,
        }));
      }
    },
    [touched, validateField, formData]
  );

  // Função para tratamento centralizado de erros
  const handleApiError = useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);

      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);

        // Tratamento de erro de validação do NestJS
        if (
          error.message.includes('500') &&
          error.message.includes('Internal server error')
        ) {
          toast({
            title: t('error.serverTitle'),
            description: t('error.serverDescription'),
            variant: 'destructive',
          });
          return;
        }

        // Tratamento de erro de trilha duplicada
        if (
          error.message.includes('409') ||
          error.message.includes('conflict') ||
          error.message.includes('already exists') ||
          error.message.includes(
            'Track with this title already exists'
          ) ||
          error.message.includes('DuplicateTrackError')
        ) {
          toast({
            title: t('error.conflictTitle'),
            description: t('error.conflictDescription'),
            variant: 'destructive',
          });
          return;
        }

        if (
          error.message.includes('400') ||
          error.message.includes('Bad Request')
        ) {
          toast({
            title: t('error.validationTitle'),
            description: t('error.validationDescription'),
            variant: 'destructive',
          });
          return;
        }

        if (
          error.message.includes('401') ||
          error.message.includes('Unauthorized')
        ) {
          toast({
            title: t('error.authTitle'),
            description: t('error.authDescription'),
            variant: 'destructive',
          });
          return;
        }

        if (
          error.message.includes('403') ||
          error.message.includes('Forbidden')
        ) {
          toast({
            title: t('error.permissionTitle'),
            description: t('error.permissionDescription'),
            variant: 'destructive',
          });
          return;
        }
      }

      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    },
    [toast, t]
  );

  // Função para buscar cursos
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/courses`);

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

    // Validar imageUrl
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = t('errors.imageRequired');
      isValid = false;
    } else if (!validateUrl(formData.imageUrl)) {
      newErrors.imageUrl = t('errors.imageInvalid');
      isValid = false;
    }

    // Validar cursos selecionados
    if (formData.courseIds.length === 0) {
      newErrors.courseIds = t('errors.coursesRequired');
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
        formData.translations[locale].description,
        'description'
      );
      if (!descValidation.isValid) {
        newErrors[
          `description_${locale}` as keyof FormErrors
        ] = descValidation.message;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [
    formData,
    t,
    validateSlug,
    validateUrl,
    validateTextField,
  ]);

  // Função para criar trilha
  const createTrack = useCallback(
    async (payload: {
      slug: string;
      imageUrl: string;
      courseIds: string[];
      translations: Array<{
        locale: string;
        title: string;
        description: string;
      }>;
    }): Promise<CreateTrackResponse | string> => {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3333';
      const url = `${apiUrl}/api/v1/tracks`;

      console.log('🌐 API URL:', url);
      console.log('📦 Payload:', payload);

      try {
        const response = await fetch(url, {
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
        console.log('📨 Response text:', responseText);

        if (!response.ok) {
          throw new Error(
            `Failed to create track: ${response.status} - ${responseText}`
          );
        }

        try {
          return JSON.parse(
            responseText
          ) as CreateTrackResponse;
        } catch {
          return responseText;
        }
      } catch (error) {
        console.error('🔴 Fetch error:', error);
        throw error;
      }
    },
    []
  );

  // Reset do formulário
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
    setTouched({});
    setSlugGenerated(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    const allFields = [
      'slug',
      'imageUrl',
      'courseIds',
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
      // Garantir que as traduções estão no formato correto
      const translations = [];

      // Adicionar cada tradução individualmente para garantir a ordem
      if (
        formData.translations.pt.title &&
        formData.translations.pt.description
      ) {
        translations.push({
          locale: 'pt',
          title: formData.translations.pt.title.trim(),
          description:
            formData.translations.pt.description.trim(),
        });
      }

      if (
        formData.translations.it.title &&
        formData.translations.it.description
      ) {
        translations.push({
          locale: 'it',
          title: formData.translations.it.title.trim(),
          description:
            formData.translations.it.description.trim(),
        });
      }

      if (
        formData.translations.es.title &&
        formData.translations.es.description
      ) {
        translations.push({
          locale: 'es',
          title: formData.translations.es.title.trim(),
          description:
            formData.translations.es.description.trim(),
        });
      }

      const payload = {
        slug: formData.slug.trim(),
        imageUrl: formData.imageUrl.trim(),
        courseIds: formData.courseIds,
        translations: translations,
      };

      console.log(
        '📤 Enviando payload:',
        JSON.stringify(payload, null, 2)
      );

      const result = await createTrack(payload);
      console.log('✅ Trilha criada com sucesso:', result);

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'Track creation error');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para mudança de valores
  const handleInputChange = useCallback(
    (field: 'slug' | 'imageUrl') => (value: string) => {
      if (field === 'slug') {
        // Formatar slug automaticamente usando a função do lib
        value = formatSlugInput(value);
        // Se o usuário editar manualmente, marca como não gerado automaticamente
        setSlugGenerated(false);
      }

      setFormData(prev => ({ ...prev, [field]: value }));
      handleFieldValidation(field, value);
    },
    [handleFieldValidation]
  );

  const handleInputBlur = useCallback(
    (field: string) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      handleFieldValidation(field);
    },
    [handleFieldValidation]
  );

  const updateTranslation = useCallback(
    (
      locale: Locale,
      field: TranslationField,
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

      const fieldKey = `${field}_${locale}`;
      handleFieldValidation(fieldKey, value);
    },
    [handleFieldValidation]
  );

  const toggleCourse = useCallback(
    (courseId: string) => {
      setFormData(prev => ({
        ...prev,
        courseIds: prev.courseIds.includes(courseId)
          ? prev.courseIds.filter(id => id !== courseId)
          : [...prev.courseIds, courseId],
      }));

      // Marca como touched e valida
      setTouched(prev => ({ ...prev, courseIds: true }));

      // Valida após a mudança
      setTimeout(() => {
        handleFieldValidation('courseIds');
      }, 0);
    },
    [handleFieldValidation]
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
      const descTouched =
        touched[
          `description_${locale}` as keyof FormErrors
        ];

      const hasError = !!(titleError || descError);
      const isValid =
        !hasError &&
        !!(titleTouched && descTouched) &&
        formData.translations[locale].title.trim().length >=
          3 &&
        formData.translations[locale].description.trim()
          .length >= 3;

      return { hasError, isValid };
    },
    [errors, touched, formData.translations]
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

        {/* URL da Imagem */}
        <div className="mb-8">
          <div className="space-y-2">
            <Label
              htmlFor="imageUrl"
              className="text-gray-300 flex items-center gap-2"
            >
              <ImageIcon size={16} />
              {t('fields.imageUrl')}
              <span className="text-red-400">*</span>
            </Label>
            <TextField
              id="imageUrl"
              placeholder={t('placeholders.imageUrl')}
              value={formData.imageUrl}
              onChange={e =>
                handleInputChange('imageUrl')(
                  e.target.value
                )
              }
              onBlur={handleInputBlur('imageUrl')}
              error={errors.imageUrl}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            {formData.imageUrl &&
              !errors.imageUrl &&
              touched.imageUrl && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <Check size={14} />
                  {t('validation.imageValid')}
                </div>
              )}
          </div>
        </div>

        {/* Seleção de Cursos */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <BookOpen size={20} />
            {t('courses.title')}
            <span className="text-red-400">*</span>
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            {t('courses.description')}
          </p>

          {errors.courseIds && touched.courseIds && (
            <p className="text-xs text-red-500 mb-2">
              {errors.courseIds}
            </p>
          )}

          {formData.courseIds.length > 0 &&
            !errors.courseIds &&
            touched.courseIds && (
              <div className="flex items-center gap-1 text-green-400 text-sm mb-2">
                <Check size={14} />
                {t('validation.coursesValid', {
                  count: formData.courseIds.length,
                })}
              </div>
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
              🇧🇷 {t('translations.portuguese')}
              {getTranslationStatus('pt').isValid && (
                <Check
                  size={16}
                  className="text-green-400"
                />
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
                    updateTranslation(
                      'pt',
                      'title',
                      e.target.value
                    )
                  }
                  onBlur={handleInputBlur('title_pt')}
                  error={errors.title_pt}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <FileText size={16} />
                  {t('fields.description')}
                  <span className="text-red-400">*</span>
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
                  onBlur={handleInputBlur('description_pt')}
                  error={errors.description_pt}
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
              🇪🇸 {t('translations.spanish')}
              {getTranslationStatus('es').isValid && (
                <Check
                  size={16}
                  className="text-green-400"
                />
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
                    updateTranslation(
                      'es',
                      'title',
                      e.target.value
                    )
                  }
                  onBlur={handleInputBlur('title_es')}
                  error={errors.title_es}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <FileText size={16} />
                  {t('fields.description')}
                  <span className="text-red-400">*</span>
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
                  onBlur={handleInputBlur('description_es')}
                  error={errors.description_es}
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
              🇮🇹 {t('translations.italian')}
              {getTranslationStatus('it').isValid && (
                <Check
                  size={16}
                  className="text-green-400"
                />
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
                    updateTranslation(
                      'it',
                      'title',
                      e.target.value
                    )
                  }
                  onBlur={handleInputBlur('title_it')}
                  error={errors.title_it}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <FileText size={16} />
                  {t('fields.description')}
                  <span className="text-red-400">*</span>
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
                  onBlur={handleInputBlur('description_it')}
                  error={errors.description_it}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Slug (URL) */}
        <div className="mb-8">
          <div className="space-y-2">
            <Label
              htmlFor="slug"
              className="text-gray-300 flex items-center gap-2"
            >
              <Link size={16} />
              {t('fields.slug')}
              <span className="text-red-400">*</span>
            </Label>
            <div className="flex gap-2">
              <TextField
                id="slug"
                placeholder={t('placeholders.slug')}
                value={formData.slug}
                onChange={e =>
                  handleInputChange('slug')(e.target.value)
                }
                onBlur={handleInputBlur('slug')}
                error={errors.slug}
                className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                type="button"
                onClick={handleGenerateSlug}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 flex items-center gap-2"
                disabled={
                  !formData.translations.pt.title.trim()
                }
              >
                <Wand2 size={18} />
                {t('generateSlug')}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {t('hints.slug')}
            </p>
            {slugGenerated && formData.slug && (
              <div className="flex items-center gap-1 text-blue-400 text-sm">
                <Wand2 size={14} />
                {t('validation.slugGenerated')}
              </div>
            )}
            {formData.slug &&
              !errors.slug &&
              touched.slug &&
              !slugGenerated && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <Check size={14} />
                  {t('validation.slugValid')}
                </div>
              )}
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
