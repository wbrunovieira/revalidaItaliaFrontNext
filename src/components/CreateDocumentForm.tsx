// /src/components/CreateDocumentForm.tsx
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
  FileText,
  Type,
  Globe,
  BookOpen,
  Play,
  Layers,
  Check,
  X,
  Upload,
  Trash2,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
  url: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
}

interface Module {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
  lessons?: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
  modules?: Module[];
}

interface UploadedFile {
  file: File;
  url: string;
}

interface FormData {
  courseId: string;
  moduleId: string;
  lessonId: string;
  uploadedFiles: {
    pt?: UploadedFile;
    es?: UploadedFile;
    it?: UploadedFile;
  };
  translations: {
    pt: Translation;
    es: Translation;
    it: Translation;
  };
}

interface FormErrors {
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  upload_pt?: string;
  upload_es?: string;
  upload_it?: string;
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

interface CreateDocumentPayload {
  filename: string;
  translations: Translation[];
}

type Locale = 'pt' | 'es' | 'it';
type TranslationField = 'title' | 'description' | 'url';


export default function CreateDocumentForm() {
  const t = useTranslations('Admin.createDocument');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] =
    useState(true);
  const [courses, setCourses] = useState<Course[]>([]);

  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    moduleId: '',
    lessonId: '',
    uploadedFiles: {},
    translations: {
      pt: {
        locale: 'pt',
        title: '',
        description: '',
        url: '',
      },
      es: {
        locale: 'es',
        title: '',
        description: '',
        url: '',
      },
      it: {
        locale: 'it',
        title: '',
        description: '',
        url: '',
      },
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormErrors, boolean>>
  >({});

  // Validação de campos de texto
  const validateTextField = useCallback(
    (
      value: string,
      fieldType: 'title' | 'description' | 'url'
    ): ValidationResult => {
      if (!value.trim()) {
        return {
          isValid: false,
          message: t(`errors.${fieldType}Required`),
        };
      }
      if (fieldType !== 'url' && value.trim().length < 3) {
        return {
          isValid: false,
          message: t(`errors.${fieldType}Min`),
        };
      }

      const maxLength =
        fieldType === 'title'
          ? 100
          : fieldType === 'description'
          ? 500
          : 1000;
      if (value.length > maxLength) {
        return {
          isValid: false,
          message: t(`errors.${fieldType}Max`),
        };
      }

      // Validação específica para URL
      if (fieldType === 'url') {
        if (
          !value.startsWith('/') &&
          !value.startsWith('http')
        ) {
          return {
            isValid: false,
            message: t('errors.urlInvalid'),
          };
        }
      }

      return { isValid: true };
    },
    [t]
  );

  // Validação individual de campos
  const validateField = useCallback(
    (
      field: string
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

      if (field === 'moduleId') {
        if (!formData.moduleId) {
          return {
            isValid: false,
            message: t('errors.moduleRequired'),
          };
        }
        return { isValid: true };
      }

      if (field === 'lessonId') {
        if (!formData.lessonId) {
          return {
            isValid: false,
            message: t('errors.lessonRequired'),
          };
        }
        return { isValid: true };
      }



      // Validação de campos de tradução
      const match = field.match(
        /^(title|description|url)_(\w+)$/
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
    [formData, t, validateTextField]
  );

  // Validação em tempo real
  const handleFieldValidation = useCallback(
    (field: string, value?: string | number) => {
      if (touched[field as keyof FormErrors]) {
        let fieldValue = value;

        if (!fieldValue && field.includes('_')) {
          const match = field.match(
            /^(title|description|url)_(\w+)$/
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
        }

        const validation = validateField(field);
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

  // Função para buscar aulas de um módulo específico
  const fetchLessonsForModule = useCallback(
    async (
      courseId: string,
      moduleId: string
    ): Promise<Lesson[]> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules/${moduleId}/lessons`
        );

        if (!response.ok) {
          return [];
        }

        const lessonsData = await response.json();
        return lessonsData.lessons || [];
      } catch (error) {
        handleApiError(
          error,
          `Error fetching lessons for module ${moduleId}`
        );
        return [];
      }
    },
    [handleApiError]
  );

  // Função para buscar módulos de um curso específico
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<Module[]> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules`
        );

        if (!response.ok) {
          return [];
        }

        const modules: Module[] = await response.json();

        // Buscar aulas para cada módulo
        const modulesWithLessons = await Promise.all(
          modules.map(async module => {
            const lessons = await fetchLessonsForModule(
              courseId,
              module.id
            );
            return { ...module, lessons };
          })
        );

        return modulesWithLessons;
      } catch (error) {
        handleApiError(
          error,
          `Error fetching modules for course ${courseId}`
        );
        return [];
      }
    },
    [handleApiError, fetchLessonsForModule]
  );

  // Função para buscar cursos com módulos e aulas
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch courses: ${response.status}`
        );
      }

      const coursesData: Course[] = await response.json();

      // Buscar módulos e aulas para cada curso
      const coursesWithData = await Promise.all(
        coursesData.map(async course => {
          const modules = await fetchModulesForCourse(
            course.id
          );
          return { ...course, modules };
        })
      );

      setCourses(coursesWithData);
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

    // Validar módulo
    if (!formData.moduleId) {
      newErrors.moduleId = t('errors.moduleRequired');
      isValid = false;
    }

    // Validar aula
    if (!formData.lessonId) {
      newErrors.lessonId = t('errors.lessonRequired');
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

      const urlValidation = validateTextField(
        formData.translations[locale].url,
        'url'
      );
      if (!urlValidation.isValid) {
        newErrors[`url_${locale}` as keyof FormErrors] =
          urlValidation.message;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, t, validateTextField]);

  const createDocument = useCallback(
    async (
      payload: CreateDocumentPayload
    ): Promise<void> => {
      // Get token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lessons/${formData.lessonId}/documents`,
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Failed to create document: ${response.status} - ${responseText}`
        );
      }
    },
    [formData.lessonId]
  );

  const resetForm = useCallback(() => {
    setFormData({
      courseId: '',
      moduleId: '',
      lessonId: '',
      uploadedFiles: {},
      translations: {
        pt: {
          locale: 'pt',
          title: '',
          description: '',
          url: '',
        },
        es: {
          locale: 'es',
          title: '',
          description: '',
          url: '',
        },
        it: {
          locale: 'it',
          title: '',
          description: '',
          url: '',
        },
      },
    });
    setErrors({});
    setTouched({});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    const allFields = [
      'courseId',
      'moduleId',
      'lessonId',
      'title_pt',
      'title_es',
      'title_it',
      'description_pt',
      'description_es',
      'description_it',
      'url_pt',
      'url_es',
      'url_it',
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
      const translations = Object.values(
        formData.translations
      ).map(translation => ({
        locale: translation.locale,
        title: translation.title.trim(),
        description: translation.description.trim(),
        url: translation.url.trim()
      })).filter(
        translation =>
          translation.title &&
          translation.description &&
          translation.url
      );

      // Verificar se temos todas as 3 traduções
      if (translations.length !== 3) {
        console.error('Missing translations:', {
          expected: 3,
          got: translations.length,
          translations
        });
        toast({
          title: t('error.validationTitle'),
          description: 'All translations are required',
          variant: 'destructive',
        });
        return;
      }

      // Extract filename from Portuguese translation URL
      const ptTranslation = formData.translations.pt;
      const urlParts = ptTranslation.url.split('/');
      const filename = urlParts[urlParts.length - 1] || 'document.pdf';

      const payload: CreateDocumentPayload = {
        filename,
        translations,
      };

      console.log('Sending document payload:', JSON.stringify(payload, null, 2));

      await createDocument(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'Document creation error');
    } finally {
      setLoading(false);
    }
  };

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

  const handleCourseChange = useCallback(
    (courseId: string) => {
      setFormData(prev => ({
        ...prev,
        courseId,
        moduleId: '',
        lessonId: '',
      }));
      setTouched(prev => ({ ...prev, courseId: true }));
      handleFieldValidation('courseId', courseId);
    },
    [handleFieldValidation]
  );

  const handleModuleChange = useCallback(
    (moduleId: string) => {
      setFormData(prev => ({
        ...prev,
        moduleId,
        lessonId: '',
      }));
      setTouched(prev => ({ ...prev, moduleId: true }));
      handleFieldValidation('moduleId', moduleId);
    },
    [handleFieldValidation]
  );

  const handleLessonChange = useCallback(
    (lessonId: string) => {
      setFormData(prev => ({ ...prev, lessonId }));
      setTouched(prev => ({ ...prev, lessonId: true }));
      handleFieldValidation('lessonId', lessonId);
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

  // Função para converter nome do arquivo em título
  const fileNameToTitle = useCallback((fileName: string): string => {
    // Remove extensão
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    // Substitui underscores e hífens por espaços
    const withSpaces = nameWithoutExt.replace(/[_-]/g, ' ');
    // Capitaliza primeira letra de cada palavra
    return withSpaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  // Função para gerar nome único para arquivo
  const generateUniqueFileName = useCallback((originalName: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    // Sanitiza o nome removendo caracteres especiais
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `${sanitizedName}-${timestamp}-${randomString}.${extension}`;
  }, []);

  // Função para fazer upload do arquivo
  const handleFileUpload = useCallback(
    async (file: File, locale: Locale) => {
      if (!file) return;

      // Validar tipo de arquivo
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [`upload_${locale}`]: t('errors.invalidFileType'),
        }));
        return;
      }

      // Validar tamanho do arquivo (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          [`upload_${locale}`]: t('errors.fileTooLarge'),
        }));
        return;
      }

      try {
        // Gerar nome único
        const uniqueFileName = generateUniqueFileName(file.name);
        
        // Salvar arquivo no estado
        setFormData(prev => ({
          ...prev,
          uploadedFiles: {
            ...prev.uploadedFiles,
            [locale]: {
              file,
              url: `/uploads/documents/${locale}/${uniqueFileName}`,
            },
          },
          translations: {
            ...prev.translations,
            [locale]: {
              ...prev.translations[locale],
              title: prev.translations[locale].title || fileNameToTitle(file.name),
              url: `/uploads/documents/${locale}/${uniqueFileName}`,
            },
          },
        }));

        // Limpar erro
        setErrors(prev => ({
          ...prev,
          [`upload_${locale}`]: undefined,
        }));

        toast({
          title: t('upload.success'),
          description: file.name,
        });
      } catch (error) {
        console.error('Upload error:', error);
        setErrors(prev => ({
          ...prev,
          [`upload_${locale}`]: t('errors.uploadFailed'),
        }));
      }
    },
    [t, toast, generateUniqueFileName, fileNameToTitle]
  );

  // Função para remover arquivo
  const handleFileRemove = useCallback((locale: Locale) => {
    setFormData(prev => {
      const newUploadedFiles = { ...prev.uploadedFiles };
      delete newUploadedFiles[locale];
      
      return {
        ...prev,
        uploadedFiles: newUploadedFiles,
        translations: {
          ...prev.translations,
          [locale]: {
            ...prev.translations[locale],
            url: '',
          },
        },
      };
    });
  }, []);

  // Verificar status de validação para cada idioma
  const getTranslationStatus = useCallback(
    (
      locale: Locale
    ): { hasError: boolean; isValid: boolean } => {
      const titleError =
        errors[`title_${locale}` as keyof FormErrors];
      const descError =
        errors[`description_${locale}` as keyof FormErrors];
      const urlError =
        errors[`url_${locale}` as keyof FormErrors];
      const titleTouched =
        touched[`title_${locale}` as keyof FormErrors];
      const descTouched =
        touched[
          `description_${locale}` as keyof FormErrors
        ];
      const urlTouched =
        touched[`url_${locale}` as keyof FormErrors];

      const hasError = !!(
        titleError ||
        descError ||
        urlError
      );
      const isValid =
        !hasError &&
        !!(titleTouched && descTouched && urlTouched) &&
        formData.translations[locale].title.trim().length >=
          3 &&
        formData.translations[locale].description.trim()
          .length >= 3 &&
        formData.translations[locale].url.trim().length > 0;

      return { hasError, isValid };
    },
    [errors, touched, formData.translations]
  );

  const getTranslationByLocale = useCallback(
    (
      translations: Array<{
        locale: string;
        title: string;
        description: string;
      }>,
      targetLocale: string
    ) => {
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
  const availableModules = selectedCourse?.modules || [];
  const selectedModule = availableModules.find(
    module => module.id === formData.moduleId
  );
  const availableLessons = selectedModule?.lessons || [];

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <FileText size={24} className="text-secondary" />
          {t('title')}
        </h3>

        {/* Seleção de Curso, Módulo e Aula */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Seleção de Curso */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
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
                    const courseTranslation =
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
                        {courseTranslation?.title ||
                          course.slug}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            {errors.courseId && touched.courseId && (
              <p className="text-xs text-red-500">
                {errors.courseId}
              </p>
            )}
            {formData.courseId &&
              !errors.courseId &&
              touched.courseId && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <Check size={14} />
                  {t('validation.courseValid')}
                </div>
              )}
          </div>

          {/* Seleção de Módulo */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Layers size={16} />
              {t('fields.module')}
              <span className="text-red-400">*</span>
            </Label>
            <Select
              value={formData.moduleId}
              onValueChange={handleModuleChange}
              disabled={!formData.courseId}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white disabled:opacity-50">
                <SelectValue
                  placeholder={t('placeholders.module')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {availableModules.map(module => {
                  const moduleTranslation =
                    getTranslationByLocale(
                      module.translations,
                      locale
                    );
                  return (
                    <SelectItem
                      key={module.id}
                      value={module.id}
                      className="text-white hover:bg-gray-600"
                    >
                      {moduleTranslation?.title ||
                        module.slug}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.moduleId && touched.moduleId && (
              <p className="text-xs text-red-500">
                {errors.moduleId}
              </p>
            )}
            {formData.moduleId &&
              !errors.moduleId &&
              touched.moduleId && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <Check size={14} />
                  {t('validation.moduleValid')}
                </div>
              )}
          </div>

          {/* Seleção de Aula */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Play size={16} />
              {t('fields.lesson')}
              <span className="text-red-400">*</span>
            </Label>
            <Select
              value={formData.lessonId}
              onValueChange={handleLessonChange}
              disabled={!formData.moduleId}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white disabled:opacity-50">
                <SelectValue
                  placeholder={t('placeholders.lesson')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {availableLessons.map(lesson => {
                  const lessonTranslation =
                    getTranslationByLocale(
                      lesson.translations,
                      locale
                    );
                  return (
                    <SelectItem
                      key={lesson.id}
                      value={lesson.id}
                      className="text-white hover:bg-gray-600"
                    >
                      {lessonTranslation?.title ||
                        `Aula ${lesson.order}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.lessonId && touched.lessonId && (
              <p className="text-xs text-red-500">
                {errors.lessonId}
              </p>
            )}
            {formData.lessonId &&
              !errors.lessonId &&
              touched.lessonId && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <Check size={14} />
                  {t('validation.lessonValid')}
                </div>
              )}
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
              <div className="grid gap-4">
                {/* Upload Section */}
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <Upload size={16} />
                    {t('fields.document')}
                    <span className="text-red-400">*</span>
                  </Label>
                  {formData.uploadedFiles && formData.uploadedFiles[loc] ? (
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                      <div className="flex items-center gap-3">
                        <FileText className="text-secondary" size={20} />
                        <div>
                          <p className="text-white text-sm font-medium">
                            {formData.uploadedFiles[loc].file.name}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {(formData.uploadedFiles[loc].file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="small"
                        onClick={() => handleFileRemove(loc)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        id={`file-upload-${loc}`}
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, loc);
                          }
                        }}
                      />
                      <label
                        htmlFor={`file-upload-${loc}`}
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition-all duration-200 hover:border-secondary/50"
                      >
                        <Upload size={32} className="text-gray-400 mb-2" />
                        <p className="text-sm text-gray-300">{t('upload.clickToSelect')}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('upload.supportedFormats')}</p>
                      </label>
                    </div>
                  )}
                  {errors[`upload_${loc}` as keyof FormErrors] && (
                    <p className="text-xs text-red-500">
                      {errors[`upload_${loc}` as keyof FormErrors]}
                    </p>
                  )}
                </div>

                {/* Title and Description */}
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
                      placeholder={t('placeholders.description')}
                      value={formData.translations[loc].description}
                      onChange={e =>
                        updateTranslation(
                          loc,
                          'description',
                          e.target.value
                        )
                      }
                      onBlur={handleInputBlur(`description_${loc}`)}
                      error={errors[`description_${loc}`]}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
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
