// /src/components/CreateDocumentForm.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useCourseHierarchy, getTranslationByLocale } from '@/hooks/useCourseHierarchy';
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
  Upload,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Info,
  Loader2,
} from 'lucide-react';
import {
  validateFile,
  getFileInputAccept,
  getAcceptedFormatsDescription,
  formatFileSize,
  getFileIcon,
} from '@/lib/document-upload';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

type ProtectionLevel = 'NONE' | 'WATERMARK' | 'FULL';

interface FormData {
  courseId: string;
  moduleId: string;
  lessonId: string;
  file: File | null;
  protectionLevel: ProtectionLevel;
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
  file?: string;
  protectionLevel?: string;
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

type Locale = 'pt' | 'es' | 'it';
type TranslationField = 'title' | 'description';

export default function CreateDocumentForm() {
  const t = useTranslations('Admin.createDocument');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  // Hook compartilhado para cursos, módulos e aulas (lazy loading)
  const {
    courses,
    modules,
    lessons,
    loadingCourses,
    loadingModules,
    loadingLessons,
    selectCourse,
    selectModule,
  } = useCourseHierarchy({ fetchLessons: true });

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    moduleId: '',
    lessonId: '',
    file: null,
    protectionLevel: '' as ProtectionLevel,
    translations: {
      pt: {
        locale: 'pt',
        title: '',
        description: '',
      },
      es: {
        locale: 'es',
        title: '',
        description: '',
      },
      it: {
        locale: 'it',
        title: '',
        description: '',
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
      fieldType: 'title' | 'description'
    ): ValidationResult => {
      if (!value.trim()) {
        return {
          isValid: false,
          message: t(`errors.${fieldType}Required`),
        };
      }

      // Backend validation rules
      if (fieldType === 'title') {
        // Minimum 1 character
        if (value.trim().length < 1) {
          return {
            isValid: false,
            message: t('errors.titleMin') || 'Título deve ter pelo menos 1 caractere',
          };
        }
      }

      if (fieldType === 'description') {
        // Minimum 5 characters
        if (value.trim().length < 5) {
          return {
            isValid: false,
            message: t('errors.descriptionMin') || 'Descrição deve ter pelo menos 5 caracteres',
          };
        }
      }

      const maxLength =
        fieldType === 'title'
          ? 100
          : 500;
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
        const courseValue = value !== undefined ? value : formData.courseId;
        if (!courseValue) {
          return {
            isValid: false,
            message: t('errors.courseRequired') || 'Por favor, selecione um curso',
          };
        }
        return { isValid: true };
      }

      if (field === 'moduleId') {
        const moduleValue = value !== undefined ? value : formData.moduleId;
        if (!moduleValue) {
          return {
            isValid: false,
            message: t('errors.moduleRequired') || 'Por favor, selecione um módulo',
          };
        }
        return { isValid: true };
      }

      if (field === 'lessonId') {
        const lessonValue = value !== undefined ? value : formData.lessonId;
        if (!lessonValue) {
          return {
            isValid: false,
            message: t('errors.lessonRequired') || 'Por favor, selecione uma aula',
          };
        }
        return { isValid: true };
      }

      if (field === 'file') {
        if (!formData.file) {
          return {
            isValid: false,
            message: t('errors.fileRequired') || 'Por favor, selecione um arquivo PDF',
          };
        }
        return { isValid: true };
      }

      if (field === 'protectionLevel') {
        if (!formData.protectionLevel) {
          return {
            isValid: false,
            message: t('errors.protectionLevelRequired') || 'Por favor, selecione o nível de proteção',
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

        let fieldValue: string;
        if (value !== undefined) {
          fieldValue = String(value);
        } else {
          const translation = formData.translations[locale as Locale];
          fieldValue = translation ? translation[fieldType as TranslationField] : '';
        }

        return validateTextField(
          fieldValue,
          fieldType as TranslationField
        );
      }

      return { isValid: true };
    },
    [formData, t, validateTextField]
  );

  // Validação em tempo real
  const handleFieldValidation = useCallback(
    (field: string, value?: string | number) => {
      if (value !== undefined || touched[field as keyof FormErrors]) {
        let fieldValue = value;

        if (fieldValue === undefined && field.includes('_')) {
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

        if (
          error.message.includes('413') ||
          error.message.includes('Payload Too Large')
        ) {
          toast({
            title: t('error.fileTooLargeTitle') || 'Arquivo muito grande',
            description: t('error.fileTooLargeDescription') || 'O arquivo excede o tamanho máximo permitido (100MB)',
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

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    console.log('Validating form:', {
      courseId: formData.courseId,
      moduleId: formData.moduleId,
      lessonId: formData.lessonId,
      file: formData.file,
      protectionLevel: formData.protectionLevel
    });

    // Validar curso
    if (!formData.courseId) {
      newErrors.courseId = t('errors.courseRequired') || 'Por favor, selecione um curso';
      isValid = false;
    }

    // Validar módulo
    if (!formData.moduleId) {
      newErrors.moduleId = t('errors.moduleRequired') || 'Por favor, selecione um módulo';
      isValid = false;
    }

    // Validar aula
    if (!formData.lessonId) {
      newErrors.lessonId = t('errors.lessonRequired') || 'Por favor, selecione uma aula';
      isValid = false;
    }

    // Validar arquivo baseado no nível de proteção
    if (!formData.file) {
      newErrors.file = t('errors.fileRequired') || 'Por favor, selecione um arquivo';
      isValid = false;
    } else {
      const validation = validateFile(formData.file, formData.protectionLevel);
      if (!validation.isValid && validation.error) {
        // Usar mensagens traduzidas quando disponíveis
        if (validation.error.type === 'size') {
          newErrors.file = t('error.fileTooLargeDescription') || validation.error.message;
        } else if (validation.error.type === 'protection') {
          newErrors.file = t('errors.invalidFileTypeForProtected') || validation.error.message;
        } else {
          newErrors.file = t('errors.invalidFileTypeForNone') || validation.error.message;
        }
        isValid = false;
      }
    }

    // Validar nível de proteção
    if (!formData.protectionLevel) {
      newErrors.protectionLevel = t('errors.protectionLevelRequired') || 'Selecione o nível de proteção';
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
  }, [formData, t, validateTextField]);

  const uploadDocument = useCallback(
    async (): Promise<void> => {
      if (!formData.file || !formData.lessonId) {
        throw new Error('File and lesson ID are required');
      }

      // Get token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create FormData
      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('protectionLevel', formData.protectionLevel);

      // Stringify translations (without url field)
      const translations = Object.values(formData.translations).map(t => ({
        locale: t.locale,
        title: t.title.trim(),
        description: t.description.trim()
      }));
      uploadFormData.append('translations', JSON.stringify(translations));

      console.log('Uploading document with:', {
        lessonId: formData.lessonId,
        fileName: formData.file.name,
        fileSize: formData.file.size,
        protectionLevel: formData.protectionLevel,
        translations: translations
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lessons/${formData.lessonId}/documents/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // DO NOT set Content-Type - FormData sets it automatically with boundary
          },
          credentials: 'include',
          body: uploadFormData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific error cases
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || 'Erro de validação');
          case 401:
            throw new Error('Não autorizado. Faça login novamente.');
          case 403:
            throw new Error('Você não tem permissão para fazer upload de documentos');
          case 404:
            throw new Error('Aula não encontrada');
          case 413:
            throw new Error('Arquivo muito grande (máximo 100MB)');
          default:
            throw new Error(errorData.message || `Erro ao fazer upload: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Upload successful:', result);

      // Show success message with processing info if needed
      if (result.processingStatus === 'PENDING') {
        toast({
          title: t('success.processingTitle') || 'Upload realizado com sucesso!',
          description: t('success.processingDescription') || 'O documento está sendo processado em segundo plano. Isso pode levar alguns minutos.',
        });
      } else {
        toast({
          title: t('success.title') || 'Documento criado com sucesso!',
          description: t('success.description') || 'O documento está disponível para os alunos.',
        });
      }
    },
    [formData, toast, t]
  );

  const resetForm = useCallback(() => {
    setFormData({
      courseId: '',
      moduleId: '',
      lessonId: '',
      file: null,
      protectionLevel: '' as ProtectionLevel,
      translations: {
        pt: {
          locale: 'pt',
          title: '',
          description: '',
        },
        es: {
          locale: 'es',
          title: '',
          description: '',
        },
        it: {
          locale: 'it',
          title: '',
          description: '',
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
      'file',
      'protectionLevel',
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
      await uploadDocument();
      resetForm();
    } catch (error) {
      handleApiError(error, 'Document upload error');
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
      setTouched(prev => ({ ...prev, [fieldKey]: true }));
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
      // Buscar módulos via hook (lazy loading)
      selectCourse(courseId);
    },
    [handleFieldValidation, selectCourse]
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
      // Buscar aulas via hook (lazy loading)
      selectModule(moduleId);
    },
    [handleFieldValidation, selectModule]
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
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const withSpaces = nameWithoutExt.replace(/[_-]/g, ' ');
    return withSpaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }, []);

  // Função para lidar com seleção de arquivo
  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) {
        setFormData(prev => ({ ...prev, file: null }));
        setErrors(prev => ({ ...prev, file: undefined }));
        return;
      }

      // Validar arquivo baseado no nível de proteção
      const validation = validateFile(file, formData.protectionLevel);

      if (!validation.isValid && validation.error) {
        let errorMessage = validation.error.message;

        // Usar mensagens traduzidas quando disponíveis
        if (validation.error.type === 'size') {
          errorMessage = t('error.fileTooLargeDescription') || validation.error.message;
        } else if (validation.error.type === 'protection') {
          errorMessage = t('errors.invalidFileTypeForProtected') || validation.error.message;
        } else {
          errorMessage = t('errors.invalidFileTypeForNone') || validation.error.message;
        }

        setErrors(prev => ({
          ...prev,
          file: errorMessage,
        }));

        toast({
          title: t('error.uploadTitle') || 'Erro ao selecionar arquivo',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // Auto-preencher títulos se estiverem vazios
      const suggestedTitle = fileNameToTitle(file.name);
      setFormData(prev => ({
        ...prev,
        file,
        translations: {
          pt: {
            ...prev.translations.pt,
            title: prev.translations.pt.title || suggestedTitle,
          },
          es: {
            ...prev.translations.es,
            title: prev.translations.es.title || suggestedTitle,
          },
          it: {
            ...prev.translations.it,
            title: prev.translations.it.title || suggestedTitle,
          },
        },
      }));

      // Clear file error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.file;
        return newErrors;
      });

      // Success toast
      const fileIconEmoji = getFileIcon(file.type);
      toast({
        title: t('upload.fileSelected') || 'Arquivo selecionado',
        description: `${fileIconEmoji} ${file.name} (${formatFileSize(file.size)})`,
      });
    },
    [t, toast, fileNameToTitle, formData.protectionLevel]
  );

  // Função para remover arquivo
  const handleFileRemove = useCallback(() => {
    setFormData(prev => ({ ...prev, file: null }));
  }, []);

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
            ) : courses.length === 0 ? (
              <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <p className="text-gray-400 text-sm text-center">
                  {t('noCourses') || 'Nenhum curso cadastrado. Cadastre um curso primeiro.'}
                </p>
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
              {loadingModules && (
                <Loader2 size={14} className="animate-spin text-secondary" />
              )}
            </Label>
            <Select
              value={formData.moduleId}
              onValueChange={handleModuleChange}
              disabled={!formData.courseId || loadingModules}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white disabled:opacity-50">
                <SelectValue
                  placeholder={loadingModules ? t('loading') : t('placeholders.module')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {modules.map(module => {
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
              {loadingLessons && (
                <Loader2 size={14} className="animate-spin text-secondary" />
              )}
            </Label>
            <Select
              value={formData.lessonId}
              onValueChange={handleLessonChange}
              disabled={!formData.moduleId || loadingLessons}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white disabled:opacity-50">
                <SelectValue
                  placeholder={loadingLessons ? t('loading') : t('placeholders.lesson')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {lessons.map(lesson => {
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

        {/* Nível de Proteção - MOVIDO PARA ANTES DO UPLOAD */}
        <div className="mb-8">
          <Label className="text-gray-300 flex items-center gap-2 mb-4">
            <Shield size={16} />
            {t('fields.protectionLevel') || 'Nível de Proteção'}
            <span className="text-red-400">*</span>
          </Label>

          <div className="grid gap-4 md:grid-cols-3">
            {/* NONE */}
            <div
              onClick={() => setFormData(prev => ({ ...prev, protectionLevel: 'NONE' }))}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                formData.protectionLevel === 'NONE'
                  ? 'border-secondary bg-secondary/10'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="protectionLevel"
                  value="NONE"
                  checked={formData.protectionLevel === 'NONE'}
                  onChange={(e) => setFormData(prev => ({ ...prev, protectionLevel: e.target.value as ProtectionLevel }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert size={18} className="text-gray-400" />
                    <h4 className="text-white font-medium">{t('protectionLevel.none.label') || 'Nenhuma'}</h4>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {t('protectionLevel.none.description') || 'Sem proteção, download direto permitido'}
                  </p>
                  <div className="flex items-start gap-1.5 mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                    <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-300">
                      {t('protectionLevel.none.hint') || 'Aceita múltiplos formatos: PDF, Word, Excel, PowerPoint, etc.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* WATERMARK */}
            <div
              onClick={() => setFormData(prev => ({ ...prev, protectionLevel: 'WATERMARK' }))}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                formData.protectionLevel === 'WATERMARK'
                  ? 'border-secondary bg-secondary/10'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="protectionLevel"
                  value="WATERMARK"
                  checked={formData.protectionLevel === 'WATERMARK'}
                  onChange={(e) => setFormData(prev => ({ ...prev, protectionLevel: e.target.value as ProtectionLevel }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={18} className="text-secondary" />
                    <h4 className="text-white font-medium">{t('protectionLevel.watermark.label') || 'Protegido'}</h4>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {t('protectionLevel.watermark.description') || 'Marca d\'água com dados do aluno'}
                  </p>
                  <div className="flex items-start gap-1.5 mt-2 p-2 bg-amber-500/10 rounded border border-amber-500/20">
                    <Info size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-300">
                      {t('protectionLevel.watermark.hint') || 'Apenas PDF - necessário para aplicar marca d\'água'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FULL */}
            <div
              onClick={() => setFormData(prev => ({ ...prev, protectionLevel: 'FULL' }))}
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 ${
                formData.protectionLevel === 'FULL'
                  ? 'border-secondary bg-secondary/10'
                  : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="protectionLevel"
                  value="FULL"
                  checked={formData.protectionLevel === 'FULL'}
                  onChange={(e) => setFormData(prev => ({ ...prev, protectionLevel: e.target.value as ProtectionLevel }))}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={18} className="text-green-400" />
                    <h4 className="text-white font-medium">{t('protectionLevel.full.label') || 'Proteção Avançada'}</h4>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {t('protectionLevel.full.description') || 'Máxima proteção (watermark + URL assinada)'}
                  </p>
                  <div className="flex items-start gap-1.5 mt-2 p-2 bg-green-500/10 rounded border border-green-500/20">
                    <Info size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-300">
                      {t('protectionLevel.full.hint') || 'Apenas PDF - máxima proteção com marca d\'água'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {errors.protectionLevel && (
            <p className="text-xs text-red-500 mt-2">
              {errors.protectionLevel}
            </p>
          )}
        </div>

        {/* Upload de Arquivo - AGORA DEPOIS DO NÍVEL DE PROTEÇÃO */}
        <div className="mb-8">
          <Label className="text-gray-300 flex items-center gap-2 mb-3">
            <Upload size={16} />
            {t('fields.document')}
            <span className="text-red-400">*</span>
            {formData.protectionLevel && (
              <span className="text-xs text-gray-500">
                ({getAcceptedFormatsDescription(formData.protectionLevel)} • {t('upload.maxSize')})
              </span>
            )}
          </Label>

          {!formData.protectionLevel ? (
            <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-lg bg-gray-700/30">
              <Shield size={40} className="text-gray-500 mb-3" />
              <p className="text-sm text-gray-400 font-medium">
                Selecione o nível de proteção primeiro
              </p>
              <p className="text-xs text-gray-500 mt-1">
                O tipo de arquivo aceito depende da proteção escolhida
              </p>
            </div>
          ) : formData.file ? (
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getFileIcon(formData.file.type)}</span>
                <div>
                  <p className="text-white text-sm font-medium">
                    {formData.file.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {formatFileSize(formData.file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="small"
                onClick={handleFileRemove}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="file"
                id="document-upload"
                className="sr-only"
                accept={getFileInputAccept(formData.protectionLevel)}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(file);
                  }
                }}
              />
              <label
                htmlFor="document-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition-all duration-200 hover:border-secondary/50"
              >
                <Upload size={40} className="text-gray-400 mb-3" />
                <p className="text-sm text-gray-300 font-medium">{t('upload.clickToSelect')}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.protectionLevel === 'NONE'
                    ? t('upload.supportedFormatsNone')
                    : t('upload.supportedFormatsProtected')
                  } • {t('upload.maxSize')}
                </p>
              </label>
            </div>
          )}
          {errors.file && (
            <p className="text-xs text-red-500 mt-2">
              {errors.file}
            </p>
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
              className="border rounded-lg p-4 border-gray-700"
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
