// /src/components/CreateLessonForm.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { Label } from '@/components/ui/label';
import { generateSlug } from '@/lib/slug';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Package,
  Image as ImageIcon,
  Type,
  FileText,
  Globe,
  BookOpen,
  Video,
  Hash,
  Check,
  X,
  AlertCircle,
  Upload,
} from 'lucide-react';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface VideoItem {
  id: string;
  slug: string;
  durationInSeconds: number;
  translations: Translation[];
}

interface ModuleItem {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

interface CourseItem {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
  modules?: ModuleItem[];
}

interface LessonItem {
  id: string;
  moduleId: string;
  order: number;
  imageUrl?: string;
  translations: Translation[];
}

interface FormData {
  courseId: string;
  moduleId: string;
  imageUrl: string;
  videoId: string;
  order: number;
  translations: Record<'pt' | 'es' | 'it', Translation>;
}

interface FormErrors {
  courseId?: string;
  moduleId?: string;
  imageUrl?: string;
  videoId?: string;
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

interface CreateLessonPayload {
  slug: string;
  imageUrl: string;
  videoId?: string;
  order: number;
  translations: Translation[];
}

type Locale = 'pt' | 'es' | 'it';
type TranslationField = 'title' | 'description';

export default function CreateLessonForm() {
  const t = useTranslations('Admin.createLesson');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] =
    useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [existingOrders, setExistingOrders] = useState<
    number[]
  >([]);

  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    moduleId: '',
    imageUrl: '',
    videoId: '',
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savedImageName, setSavedImageName] = useState<string | null>(null);

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

  // Função para fazer upload da imagem
  const handleImageUpload = useCallback(async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'image');
      formData.append('folder', 'lessons');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  }, []);

  // Handler para o input de arquivo
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('errors.invalidImageType'),
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: t('errors.imageTooLarge'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await handleImageUpload(file);
      
      setFormData(prev => ({
        ...prev,
        imageUrl: result.url
      }));
      
      setSavedImageName(result.filename || file.name);
      
      // Marcar como tocado e validar
      setTouched(prev => ({ ...prev, imageUrl: true }));
      setErrors(prev => ({ ...prev, imageUrl: undefined }));
      
      toast({
        title: t('upload.success'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : t('errors.uploadFailed');
      
      // Set error state
      setErrors(prev => ({
        ...prev,
        imageUrl: errorMessage,
      }));
      
      // Show toast with error details
      toast({
        title: t('errors.uploadFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Clear the file from state since upload failed
      setFormData(prev => ({
        ...prev,
        imageUrl: '',
      }));
    }
  }, [handleImageUpload, t, toast]);

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

      if (field === 'moduleId') {
        if (!formData.moduleId) {
          return {
            isValid: false,
            message: t('errors.moduleRequired'),
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
      formData.moduleId,
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
          // Para campos diretos
          fieldValue =
            formData[
              field as keyof Pick<
                FormData,
                | 'imageUrl'
                | 'videoId'
                | 'courseId'
                | 'moduleId'
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
            title: t('errors.serverTitle'),
            description: t('errors.serverDescription'),
            variant: 'destructive',
          });
          return;
        }

        // Tratamento de erro de aula duplicada
        if (
          error.message.includes('409') ||
          error.message.includes('conflict') ||
          error.message.includes('already exists')
        ) {
          toast({
            title: t('errors.conflictTitle'),
            description: t('errors.conflictDescription'),
            variant: 'destructive',
          });
          return;
        }

        if (
          error.message.includes('400') ||
          error.message.includes('Bad Request')
        ) {
          toast({
            title: t('errors.validationTitle'),
            description: t('errors.validationDescription'),
            variant: 'destructive',
          });
          return;
        }
      }

      toast({
        title: t('errors.title'),
        description: t('errors.description'),
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

  // Função para buscar aulas existentes do módulo
  const fetchExistingLessons = useCallback(
    async (courseId: string, moduleId: string) => {
      setLoadingOrders(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules/${moduleId}/lessons`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch lessons: ${response.status}`
          );
        }

        const data = await response.json();
        const lessons: LessonItem[] = data.lessons || [];
        const orders = lessons.map(
          (lesson: LessonItem) => lesson.order
        );
        setExistingOrders(orders);

        // Se não houver aulas, ordem começa em 1
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
        console.error('Error fetching lessons:', error);
        // Em caso de erro, mantém ordem 1
        setExistingOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    },
    []
  );

  // Função para buscar módulos de um curso específico
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<ModuleItem[]> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch modules: ${response.status}`
          );
        }

        return await response.json();
      } catch (error) {
        handleApiError(error, 'Module fetch error');
        return [];
      }
    },
    [handleApiError]
  );

  // Função para buscar cursos com seus módulos
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

      const data: CourseItem[] = await response.json();

      const coursesWithModules = await Promise.all(
        data.map(async course => {
          const modules = await fetchModulesForCourse(
            course.id
          );
          return { ...course, modules };
        })
      );

      setCourses(coursesWithModules);
    } catch (error) {
      handleApiError(error, 'Courses fetch error');
      toast({
        title: t('errors.fetchCoursesTitle'),
        description: t('errors.fetchCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [toast, t, handleApiError, fetchModulesForCourse]);

  // Função para buscar vídeos de um módulo específico
  const fetchVideosForModule = useCallback(
    async (
      courseId: string,
      moduleId: string
    ): Promise<VideoItem[]> => {
      try {
        const lessonsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules/${moduleId}/lessons`
        );

        if (!lessonsResponse.ok) {
          return [];
        }

        const { lessons } = await lessonsResponse.json();

        if (!lessons?.length) {
          return [];
        }

        const videoResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/lessons/${lessons[0].id}/videos`
        );

        if (!videoResponse.ok) {
          return [];
        }

        return await videoResponse.json();
      } catch (error) {
        handleApiError(error, 'Videos fetch error');
        return [];
      }
    },
    [handleApiError]
  );

  // Função para buscar vídeos baseado no curso e módulo selecionados
  const fetchVideos = useCallback(async () => {
    if (!formData.courseId || !formData.moduleId) return;

    setLoadingVideos(true);

    try {
      const videoList = await fetchVideosForModule(
        formData.courseId,
        formData.moduleId
      );
      setVideos(videoList);
    } finally {
      setLoadingVideos(false);
    }
  }, [
    formData.courseId,
    formData.moduleId,
    fetchVideosForModule,
  ]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Buscar aulas existentes quando o módulo for selecionado
  useEffect(() => {
    if (formData.courseId && formData.moduleId) {
      fetchExistingLessons(
        formData.courseId,
        formData.moduleId
      );
    } else {
      setExistingOrders([]);
    }
  }, [
    formData.courseId,
    formData.moduleId,
    fetchExistingLessons,
  ]);

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

  const resetForm = useCallback(() => {
    // Encontra a próxima ordem disponível para o módulo atual
    let nextOrder = 1;
    if (formData.moduleId && existingOrders.length > 0) {
      while (existingOrders.includes(nextOrder)) {
        nextOrder++;
      }
    }

    setFormData(prev => ({
      ...prev,
      imageUrl: '',
      videoId: '',
      order: nextOrder,
      translations: {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      },
    }));
    setErrors({});
    setTouched({});
    setSavedImageName(null);

    // Recarrega as aulas para atualizar a lista de ordens
    if (formData.courseId && formData.moduleId) {
      fetchExistingLessons(
        formData.courseId,
        formData.moduleId
      );
    }
  }, [
    formData.courseId,
    formData.moduleId,
    existingOrders,
    fetchExistingLessons,
  ]);

  const createLesson = useCallback(
    async (payload: CreateLessonPayload): Promise<void> => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${formData.courseId}/modules/${formData.moduleId}/lessons`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Failed to create lesson: ${response.status} - ${responseText}`
        );
      }
    },
    [formData.courseId, formData.moduleId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    const allFields = [
      'courseId',
      'moduleId',
      'imageUrl',
      'videoId',
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
        title: t('errors.validationTitle'),
        description: t('errors.validationDescription'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const translations = [];

      // Adicionar cada tradução individualmente
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

      const payload: CreateLessonPayload = {
        slug: generateSlug(formData.translations.pt.title),
        order: formData.order,
        imageUrl: formData.imageUrl.trim(),
        translations: translations,
      };

      if (formData.videoId) {
        payload.videoId = formData.videoId;
      }

      await createLesson(payload);

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'Lesson creation error');
    } finally {
      setLoading(false);
    }
  };


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

  const handleCourseChange = useCallback(
    (courseId: string) => {
      setFormData(prev => ({
        ...prev,
        courseId,
        moduleId: '', // Reset module when course changes
        order: 1, // Reset order
      }));
      setTouched(prev => ({ ...prev, courseId: true }));
      handleFieldValidation('courseId', courseId);
      setExistingOrders([]); // Clear existing orders
    },
    [handleFieldValidation]
  );

  const handleModuleChange = useCallback(
    (moduleId: string) => {
      setFormData(prev => ({
        ...prev,
        moduleId,
      }));
      setTouched(prev => ({ ...prev, moduleId: true }));
      handleFieldValidation('moduleId', moduleId);
    },
    [handleFieldValidation]
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

  const handleVideoChange = useCallback(
    (videoId: string) => {
      setFormData(prev => ({
        ...prev,
        videoId,
      }));
      setTouched(prev => ({ ...prev, videoId: true }));
      handleFieldValidation('videoId', videoId);
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
  const availableModules = selectedCourse?.modules || [];

  const selectedModule = availableModules.find(
    module => module.id === formData.moduleId
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <Play size={24} className="text-secondary" />
          {t('title')}
        </h3>

        {/* Seleção de Curso e Módulo */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <BookOpen size={16} /> {t('fields.course')}
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
                        {courseTranslation.title ||
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

          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Package size={16} /> {t('fields.module')}
              <span className="text-red-400">*</span>
            </Label>
            {formData.courseId &&
            availableModules.length === 0 ? (
              <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="text-red-400 mt-0.5"
                    size={20}
                  />
                  <div className="flex-1">
                    <p className="text-red-400 font-medium text-sm">
                      {t('errors.noModulesTitle')}
                    </p>
                    <p className="text-red-300 text-xs mt-1">
                      {t('errors.noModulesDescription')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Select
                  value={formData.moduleId}
                  onValueChange={handleModuleChange}
                  disabled={
                    !formData.courseId ||
                    availableModules.length === 0
                  }
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
                          {moduleTranslation.title ||
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
              </>
            )}
          </div>
        </div>

        {/* Módulo selecionado */}
        {selectedModule && (
          <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">
              {t('selectedModule')}:
            </p>
            <p className="text-white font-medium">
              {
                getTranslationByLocale(
                  selectedModule.translations,
                  locale
                )?.title
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ID: {selectedModule.id}
            </p>
          </div>
        )}

        {/* Ordem, Imagem e Vídeo */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Hash size={16} /> {t('fields.order')}
              <span className="text-red-400">*</span>
            </Label>
            {!formData.moduleId ? (
              <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-400 opacity-50">
                {t('validation.selectModuleFirst')}
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
                  !formData.moduleId || loadingOrders
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
              formData.moduleId &&
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
              formData.moduleId && (
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <Check size={14} />
                  {t('validation.orderValid')}
                </div>
              )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <ImageIcon size={16} /> {t('fields.lessonImage')}
              <span className="text-red-400">*</span>
            </Label>
            
            {/* Preview da imagem se houver */}
            {formData.imageUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-700 mb-2">
                <Image
                  src={formData.imageUrl}
                  alt="Lesson preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            {/* Botão de upload */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="lesson-image-upload"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploadingImage}
              />
              <label
                htmlFor="lesson-image-upload"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  uploadingImage
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-secondary hover:bg-secondary-dark text-white'
                }`}
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {t('upload.uploading')}
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    {t('upload.clickToSelect')}
                  </>
                )}
              </label>
              
              {savedImageName && (
                <span className="text-sm text-gray-400">
                  {t('upload.savedAs')}: {savedImageName}
                </span>
              )}
            </div>
            
            <p className="text-xs text-gray-500">
              {t('upload.supportedFormats')}: JPG, PNG, GIF, WebP (max 5MB)
            </p>
            
            {errors.imageUrl && touched.imageUrl && (
              <p className="text-xs text-red-500">
                {errors.imageUrl}
              </p>
            )}
            
            {formData.imageUrl && !errors.imageUrl && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Check size={14} />
                {t('validation.imageReady')}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Video size={16} /> {t('fields.video')}
            </Label>
            <Select
              value={formData.videoId || 'none'}
              onValueChange={value =>
                handleVideoChange(
                  value === 'none' ? '' : value
                )
              }
              disabled={loadingVideos || !formData.moduleId}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white disabled:opacity-50">
                <SelectValue
                  placeholder={t('placeholders.video')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem
                  value="none"
                  className="text-gray-400 hover:bg-gray-600"
                >
                  {t('placeholders.noVideo')}
                </SelectItem>
                {videos.map(video => {
                  const videoTranslation =
                    getTranslationByLocale(
                      video.translations,
                      locale
                    );
                  return (
                    <SelectItem
                      key={video.id}
                      value={video.id}
                      className="text-white hover:bg-gray-600"
                    >
                      {videoTranslation.title || video.slug}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {t('hints.video')}
            </p>
          </div>
        </div>

        {/* Traduções */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe size={20} /> {t('translations.title')}
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
                    <Type size={16} /> {t('fields.title')}
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
                    <FileText size={16} />{' '}
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
            disabled={
              loading ||
              !formData.courseId ||
              !formData.moduleId ||
              (!!formData.courseId &&
                availableModules.length === 0)
            }
            className="bg-secondary text-primary hover:bg-secondary/90 px-6 py-3"
          >
            {loading ? t('creating') : t('create')}
          </Button>
        </div>
      </div>
    </form>
  );
}
