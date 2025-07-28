// /src/components/CreateCourseForm.tsx
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/slug';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import {
  BookOpen,
  Image as ImageIcon,
  Type,
  FileText,
  Globe,
  Check,
  X,
  Upload,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface FormData {
  imageUrl: string;
  imageFile?: File;
  translations: {
    pt: Translation;
    es: Translation;
    it: Translation;
  };
}

interface FormErrors {
  imageUrl?: string;
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

interface CreateCourseResponse {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

type Locale = 'pt' | 'es' | 'it';
type TranslationField = 'title' | 'description';

export default function CreateCourseForm() {
  const t = useTranslations('Admin.createCourse');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    imageUrl: '',
    imageFile: undefined,
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


  // Função para fazer upload da imagem
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          imageUrl: t('errors.invalidImageType'),
        }));
        return;
      }

      // Validar tamanho do arquivo (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          imageUrl: t('errors.imageTooLarge'),
        }));
        return;
      }

      try {
        setUploadingImage(true);
        
        // Fazer upload imediato
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'image');
        formData.append('folder', 'courses');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        
        // Salvar URL e nome do arquivo
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imageUrl: result.url,
        }));
        
        setSavedImageName(result.savedAs || file.name);
        
        // Limpar erros
        setErrors(prev => ({
          ...prev,
          imageUrl: undefined,
        }));
        
        toast({
          title: t('upload.success'),
          variant: 'success',
        });
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : t('errors.uploadFailed');
        
        // Definir erro no estado
        setErrors(prev => ({
          ...prev,
          imageUrl: errorMessage,
        }));
        
        // Mostrar toast de erro
        toast({
          title: t('errors.uploadFailed'),
          description: errorMessage,
          variant: 'destructive',
        });
        
        // Limpar o arquivo do estado já que o upload falhou
        setFormData(prev => ({
          ...prev,
          imageFile: undefined,
          imageUrl: '',
        }));
      } finally {
        setUploadingImage(false);
      }
    },
    [t, toast]
  );

  // Função para remover imagem
  const handleImageRemove = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      imageFile: undefined,
      imageUrl: '',
    }));
    setErrors(prev => ({
      ...prev,
      imageUrl: undefined,
    }));
    setSavedImageName(null);
  }, []);

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
      if (field === 'imageUrl') {
        if (!value.trim() && !formData.imageFile) {
          return {
            isValid: false,
            message: t('errors.imageRequired'),
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
      formData.imageFile,
      t,
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
          // Para campos diretos como imageUrl
          if (field === 'imageUrl') {
            fieldValue = formData.imageUrl;
          }
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

  // Validação do formulário completo
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validar imagem
    if (!formData.imageUrl.trim() && !formData.imageFile) {
      newErrors.imageUrl = t('errors.imageRequired');
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

  // Função para tr
  // atamento centralizado de erros
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

        // Tratamento de erro de curso duplicado
        if (
          error.message.includes('409') ||
          error.message.includes('conflict') ||
          error.message.includes('already exists') ||
          error.message.includes(
            'Course with this title already exists'
          ) ||
          error.message.includes('DuplicateCourseError')
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

  // Função para criar curso
  const createCourse = useCallback(
    async (payload: {
      slug: string;
      imageUrl: string;
      translations: Array<{
        locale: string;
        title: string;
        description: string;
      }>;
    }): Promise<CreateCourseResponse | string> => {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:3333';
      const url = `${apiUrl}/api/v1/courses`;

      console.log('🌐 API URL:', url);
      console.log('📦 Payload:', payload);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include', // Adiciona cookies se necessário
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log('📨 Response status:', response.status);
        console.log('📨 Response text:', responseText);

        if (!response.ok) {
          throw new Error(
            `Failed to create course: ${response.status} - ${responseText}`
          );
        }

        try {
          return JSON.parse(
            responseText
          ) as CreateCourseResponse;
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
      imageUrl: '',
      imageFile: undefined,
      translations: {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      },
    });
    setErrors({});
    setTouched({});
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    const allFields = [
      'imageUrl',
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
      // A imagem já foi carregada no handleImageUpload
      const finalImageUrl = formData.imageUrl;
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

      // Gerar slug automaticamente baseado no título em português
      const generatedSlug = generateSlug(
        formData.translations.pt.title
      );

      const payload = {
        slug: generatedSlug,
        imageUrl: finalImageUrl.trim(),
        translations: translations,
      };

      // Log para debug
      console.log(
        '📤 Enviando payload:',
        JSON.stringify(payload, null, 2)
      );

      const result = await createCourse(payload);
      console.log('✅ Curso criado com sucesso:', result);

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      resetForm();
    } catch (error) {
      handleApiError(error, 'Course creation error');
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

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-6"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
          <BookOpen size={24} className="text-secondary" />
          {t('title')}
        </h3>

        {/* Upload da Imagem */}
        <div className="mb-8">
          <div className="space-y-2">
            <Label
              htmlFor="imageUpload"
              className="text-gray-300 flex items-center gap-2"
            >
              <ImageIcon size={16} />
              {t('fields.courseImage')}
              <span className="text-red-400">*</span>
            </Label>
            
            {/* Preview da imagem se houver */}
            {formData.imageUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-700 mb-4">
                <Image
                  src={formData.imageUrl}
                  alt="Course preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleImageRemove}
                  className="absolute top-2 right-2 p-2 bg-gray-900/80 hover:bg-gray-900 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            )}
            
            {/* Botão de upload ou informações do arquivo */}
            {formData.imageFile && !formData.imageUrl ? (
              <div className="relative bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Upload className="text-secondary animate-pulse" size={24} />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {t('upload.uploading')}...
                      </p>
                      <p className="text-xs text-gray-400">
                        {formData.imageFile.name} ({(formData.imageFile.size / 1024).toFixed(2)} KB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : !formData.imageUrl ? (
              <div className="relative">
                <input
                  type="file"
                  id="imageUpload"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="imageUpload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition-all duration-200 hover:border-secondary/50"
                >
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-300">{t('upload.clickToSelect')}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('upload.supportedFormats')}: JPG, PNG, GIF, WebP (Max 5MB)
                  </p>
                </label>
              </div>
            ) : null}
            
            {/* Informações do arquivo salvo */}
            {formData.imageUrl && savedImageName && (
              <div className="mt-2 p-2 bg-gray-700/50 rounded">
                <p className="text-xs text-gray-400">
                  {t('upload.savedAs')}: {savedImageName}
                </p>
              </div>
            )}
            
            {errors.imageUrl && (
              <p className="text-xs text-red-500 mt-2">
                {errors.imageUrl}
              </p>
            )}
            
            {formData.imageUrl && !errors.imageUrl && (
              <div className="flex items-center gap-1 text-green-400 text-sm mt-2">
                <Check size={14} />
                {t('validation.imageReady')}
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
