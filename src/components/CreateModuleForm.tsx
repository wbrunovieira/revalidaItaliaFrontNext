// /src/components/CreateModuleForm.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { generateSlug, formatSlugInput } from '@/lib/slug';
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

interface Module {
  id: string;
  slug: string;
  order: number;
  imageUrl?: string;
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

interface FormErrors {
  courseId?: string;
  slug?: string;
  imageUrl?: string;
  order?: string;
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

interface CreateModulePayload {
  slug: string;
  imageUrl: string;
  order: number;
  translations: Translation[];
}

type Locale = 'pt' | 'es' | 'it';
type TranslationField = 'title' | 'description';

export default function CreateModuleForm() {
  const t = useTranslations('Admin.createModule');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] =
    useState(true);
  const [slugGenerated, setSlugGenerated] = useState(false);
  const [existingOrders, setExistingOrders] = useState<
    number[]
  >([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

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

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormErrors, boolean>>
  >({});

  // Validação de URL
  const validateUrl = useCallback(
    (url: string): boolean => {
      if (!url || !url.trim()) return false; // URL é obrigatória
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
    (
      field: string,
      value?: string | number
    ): ValidationResult => {
      if (field === 'courseId') {
        if (!formData.courseId) {
          return {
            isValid: false,
            message: t('errors.courseRequired'),
          };
        }
        return { isValid: true };
      }

      if (field === 'imageUrl') {
        const url = value as string;
        if (!url || !url.trim()) {
          return {
            isValid: false,
            message: t('errors.imageRequired'),
          };
        }
        if (!validateUrl(url)) {
          return {
            isValid: false,
            message: t('errors.imageInvalid'),
          };
        }
        return { isValid: true };
      }

      if (field === 'order') {
        const orderValue = value as number;
        if (!orderValue || orderValue < 1) {
          return {
            isValid: false,
            message: t('errors.orderRequired'),
          };
        }
        if (orderValue > 999) {
          return {
            isValid: false,
            message: t('errors.orderMax'),
          };
        }
        if (existingOrders.includes(orderValue)) {
          return {
            isValid: false,
            message: t('errors.orderExists'),
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
      formData.courseId,
      t,
      validateUrl,
      validateTextField,
      existingOrders,
    ]
  );

  // Validação em tempo real
  const handleFieldValidation = useCallback(
    (field: string, value?: string | number) => {
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
        } else if (!fieldValue && field === 'order') {
          fieldValue = formData.order;
        } else if (!fieldValue) {
          // Para campos diretos como imageUrl e courseId
          fieldValue =
            formData[
              field as keyof Pick<
                FormData,
                'imageUrl' | 'courseId'
              >
            ];
        }

        const validation = validateField(field, fieldValue);
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

        // Tratamento de erro de módulo duplicado
        if (
          error.message.includes('409') ||
          error.message.includes('conflict') ||
          error.message.includes('already exists')
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

  // Função para gerar lista de ordens disponíveis
  const getAvailableOrders = useCallback(() => {
    const maxOrder = 50; // Limite máximo de ordem
    const availableOrders = [];

    for (let i = 1; i <= maxOrder; i++) {
      if (!existingOrders.includes(i)) {
        availableOrders.push(i);
      }
    }

    return availableOrders;
  }, [existingOrders]);

  // Função para buscar módulos existentes do curso
  const fetchExistingModules = useCallback(
    async (courseId: string) => {
      setLoadingOrders(true);
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          'http://localhost:3333';
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch modules: ${response.status}`
          );
        }

        const modules: Module[] = await response.json();
        const orders = modules.map(
          (module: Module) => module.order
        );
        setExistingOrders(orders);

        // Se não houver módulos, ordem começa em 1
        // Se houver, sugere a próxima ordem disponível
        if (orders.length === 0) {
          setFormData(prev => ({ ...prev, order: 1 }));
        } else {
          // Encontra a próxima ordem disponível
          let nextOrder = 1;
          while (orders.includes(nextOrder)) {
            nextOrder++;
          }
          setFormData(prev => ({
            ...prev,
            order: nextOrder,
          }));
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
        // Em caso de erro, mantém ordem 1
        setExistingOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    },
    []
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

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validar curso
    if (!formData.courseId) {
      newErrors.courseId = t('errors.courseRequired');
      isValid = false;
    }


    // Validar imageUrl (obrigatório)
    if (!formData.imageUrl || !formData.imageUrl.trim()) {
      newErrors.imageUrl = t('errors.imageRequired');
      isValid = false;
    } else if (!validateUrl(formData.imageUrl)) {
      newErrors.imageUrl = t('errors.imageInvalid');
      isValid = false;
    }

    // Validar ordem
    if (!formData.order || formData.order < 1) {
      newErrors.order = t('errors.orderRequired');
      isValid = false;
    } else if (formData.order > 999) {
      newErrors.order = t('errors.orderMax');
      isValid = false;
    } else if (existingOrders.includes(formData.order)) {
      newErrors.order = t('errors.orderExists');
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
    validateUrl,
    validateTextField,
    existingOrders,
  ]);

  const createModule = useCallback(
    async (payload: CreateModulePayload): Promise<void> => {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3333';
      const url = `${apiUrl}/api/v1/courses/${formData.courseId}/modules`;

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
            `Failed to create module: ${response.status} - ${responseText}`
          );
        }
      } catch (error) {
        console.error('🔴 Fetch error:', error);
        throw error;
      }
    },
    [formData.courseId]
  );

  const resetForm = useCallback(() => {
    // Encontra a próxima ordem disponível para o curso atual
    let nextOrder = 1;
    if (formData.courseId && existingOrders.length > 0) {
      while (existingOrders.includes(nextOrder)) {
        nextOrder++;
      }
    }

    setFormData(prev => ({
      ...prev,
      slug: '',
      imageUrl: '',
      order: nextOrder,
      translations: {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      },
    }));
    setErrors({});
    setTouched({});
    setSlugGenerated(false);

    // Recarrega os módulos para atualizar a lista de ordens
    if (formData.courseId) {
      fetchExistingModules(formData.courseId);
    }
  }, [
    formData.courseId,
    existingOrders,
    fetchExistingModules,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    const allFields = [
      'courseId',
      'imageUrl',
      'order',
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

      // Gerar slug automaticamente baseado no título em português
      const generatedSlug = generateSlug(formData.translations.pt.title);
      
      const payload: CreateModulePayload = {
        slug: generatedSlug,
        imageUrl: formData.imageUrl.trim(),
        order: formData.order,
        translations: translations,
      };

      console.log(
        '📤 Enviando payload:',
        JSON.stringify(payload, null, 2)
      );

      await createModule(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'Module creation error');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para mudança de valores
  const handleInputChange = useCallback(
    (field: 'imageUrl') => (value: string) => {
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

      const fieldKey = `${field}_${locale}`;
      handleFieldValidation(fieldKey, value);
    },
    [handleFieldValidation]
  );

  const handleCourseChange = useCallback(
    (courseId: string) => {
      setFormData(prev => ({
        ...prev,
        courseId,
      }));
      setTouched(prev => ({ ...prev, courseId: true }));
      handleFieldValidation('courseId', courseId);

      // Buscar módulos existentes quando o curso for selecionado
      if (courseId) {
        fetchExistingModules(courseId);
      } else {
        setExistingOrders([]);
      }
    },
    [handleFieldValidation, fetchExistingModules]
  );

  const handleOrderChange = useCallback(
    (value: string) => {
      const order = parseInt(value) || 1;
      setFormData(prev => ({
        ...prev,
        order,
      }));
      setTouched(prev => ({ ...prev, order: true }));
      handleFieldValidation('order', order);
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

        {/* Seleção do Curso */}
        <div className="mb-8">
          <Label className="text-gray-300 flex items-center gap-2 mb-2">
            <BookOpen size={16} />
            {t('fields.course')}
            <span className="text-red-400">*</span>
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
          {errors.courseId && touched.courseId && (
            <p className="mt-1 text-xs text-red-500">
              {errors.courseId}
            </p>
          )}
          {formData.courseId &&
            !errors.courseId &&
            touched.courseId && (
              <div className="mt-1 flex items-center gap-1 text-green-400 text-sm">
                <Check size={14} />
                {t('validation.courseValid')}
              </div>
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
        <div className="grid gap-6 md:grid-cols-2 mb-8">
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
            <p className="text-xs text-gray-500">
              {t('hints.imageUrl')}
            </p>
            {errors.imageUrl && touched.imageUrl && (
              <p className="text-xs text-red-500">
                {errors.imageUrl}
              </p>
            )}
            {formData.imageUrl &&
              formData.imageUrl.trim() &&
              !errors.imageUrl &&
              touched.imageUrl && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <Check size={14} />
                  {t('validation.imageValid')}
                </div>
              )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="order"
              className="text-gray-300 flex items-center gap-2"
            >
              <Hash size={16} />
              {t('fields.order')}
              <span className="text-red-400">*</span>
            </Label>
            {!formData.courseId ? (
              <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 opacity-50">
                {t('validation.selectCourseFirst')}
              </div>
            ) : loadingOrders ? (
              <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400">
                {t('validation.loadingOrders')}
              </div>
            ) : (
              <Select
                value={formData.order.toString()}
                onValueChange={handleOrderChange}
                disabled={
                  !formData.courseId || loadingOrders
                }
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue
                    placeholder={t('placeholders.order')}
                  />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600 max-h-60 overflow-y-auto">
                  {getAvailableOrders().length === 0 ? (
                    <div className="px-2 py-4 text-center text-gray-400 text-sm">
                      {t('validation.noAvailableOrders')}
                    </div>
                  ) : (
                    getAvailableOrders().map(order => (
                      <SelectItem
                        key={order}
                        value={order.toString()}
                        className="text-white hover:bg-gray-600"
                      >
                        {order}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-gray-500">
              {t('hints.order')}
            </p>
            {errors.order && touched.order && (
              <p className="text-xs text-red-500">
                {errors.order}
              </p>
            )}
            {existingOrders.length > 0 &&
              formData.courseId &&
              !loadingOrders && (
                <p className="text-xs text-gray-400">
                  {t('validation.usedOrders')}:{' '}
                  {existingOrders
                    .sort((a, b) => a - b)
                    .join(', ')}
                </p>
              )}
            {!errors.order &&
              touched.order &&
              formData.courseId && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <Check size={14} />
                  {t('validation.orderValid')}
                </div>
              )}
          </div>
        </div>

        {/* Traduções */}
        <div className="space-y-6 mb-8">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe size={20} />
            {t('translations.title')}
          </h4>

          {(['pt', 'es', 'it'] as const).map(loc => (
            <div
              key={loc}
              className={`border rounded-lg p-4 transition-colors ${
                getTranslationStatus(loc).hasError
                  ? 'border-red-500/50'
                  : getTranslationStatus(loc).isValid
                  ? 'border-green-500/50'
                  : 'border-gray-700'
              }`}
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
                {getTranslationStatus(loc).isValid && (
                  <Check
                    size={16}
                    className="text-green-400"
                  />
                )}
                {getTranslationStatus(loc).hasError && (
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
                    value={formData.translations[loc].title}
                    onChange={e =>
                      updateTranslation(
                        loc,
                        'title',
                        e.target.value
                      )
                    }
                    onBlur={handleInputBlur(`title_${loc}`)}
                    error={errors[`title_${loc}`]}
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
                      formData.translations[loc].description
                    }
                    onChange={e =>
                      updateTranslation(
                        loc,
                        'description',
                        e.target.value
                      )
                    }
                    onBlur={handleInputBlur(
                      `description_${loc}`
                    )}
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
