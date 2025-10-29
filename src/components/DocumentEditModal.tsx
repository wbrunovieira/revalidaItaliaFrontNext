// /src/components/DocumentEditModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  FileText,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Languages,
  Upload,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

type ProtectionLevel = 'NONE' | 'WATERMARK' | 'FULL';

interface DocumentData {
  id: string;
  filename: string;
  translations: Translation[];
  protectionLevel?: ProtectionLevel;
  lessonId: string;
  createdAt: string;
  updatedAt: string;
}

interface DocumentEditModalProps {
  lessonId: string | null;
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  uploadedFile: File | null;
  protectionLevel: ProtectionLevel;
  translations: {
    [locale: string]: {
      title: string;
      description: string;
    };
  };
}

interface FormErrors {
  file?: string;
  translations: {
    [locale: string]: {
      title?: string;
      description?: string;
    };
  };
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export default function DocumentEditModal({
  lessonId,
  documentId,
  isOpen,
  onClose,
  onSave,
}: DocumentEditModalProps) {
  const t = useTranslations('Admin.documentEdit');
  const { toast } = useToast();

  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    uploadedFile: null,
    protectionLevel: 'WATERMARK',
    translations: {
      pt: { title: '', description: '' },
      it: { title: '', description: '' },
      es: { title: '', description: '' },
    },
  });
  const [errors, setErrors] = useState<FormErrors>({
    translations: {
      pt: {},
      it: {},
      es: {},
    },
  });
  const [touched, setTouched] = useState<{
    [locale: string]: {
      title?: boolean;
      description?: boolean;
    };
  }>({
    pt: {},
    it: {},
    es: {},
  });

  // Validation functions
  const validateTitle = useCallback(
    (value: string): ValidationResult => {
      if (!value.trim()) {
        return { isValid: false, message: t('errors.titleRequired') };
      }
      if (value.trim().length < 1) {
        return { isValid: false, message: t('errors.titleMin') };
      }
      if (value.trim().length > 255) {
        return { isValid: false, message: t('errors.titleMax') };
      }
      return { isValid: true };
    },
    [t]
  );

  const validateDescription = useCallback(
    (value: string): ValidationResult => {
      if (!value.trim()) {
        return { isValid: false, message: t('errors.descriptionRequired') };
      }
      if (value.trim().length < 1) {
        return { isValid: false, message: t('errors.descriptionMin') };
      }
      if (value.trim().length > 1000) {
        return { isValid: false, message: t('errors.descriptionMax') };
      }
      return { isValid: true };
    },
    [t]
  );

  // Handle field validation
  const handleFieldValidation = useCallback(
    (locale: string, field: 'title' | 'description', value: string) => {
      if (touched[locale]?.[field]) {
        const validation = field === 'title'
          ? validateTitle(value)
          : validateDescription(value);

        setErrors(prev => ({
          ...prev,
          translations: {
            ...prev.translations,
            [locale]: {
              ...prev.translations[locale],
              [field]: validation.isValid ? undefined : validation.message,
            },
          },
        }));
      }
    },
    [touched, validateTitle, validateDescription]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (locale: string, field: 'title' | 'description') => (value: string) => {
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
      handleFieldValidation(locale, field, value);
    },
    [handleFieldValidation]
  );

  // Handle input blur
  const handleInputBlur = useCallback(
    (locale: string, field: 'title' | 'description') => () => {
      setTouched(prev => ({
        ...prev,
        [locale]: {
          ...prev[locale],
          [field]: true,
        },
      }));
      handleFieldValidation(locale, field, formData.translations[locale][field]);
    },
    [formData, handleFieldValidation]
  );

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {
      translations: {
        pt: {},
        it: {},
        es: {},
      },
    };
    let isValid = true;

    // Validate translations (always required)
    ['pt', 'it', 'es'].forEach(locale => {
      const titleValidation = validateTitle(formData.translations[locale].title);
      if (!titleValidation.isValid) {
        newErrors.translations[locale].title = titleValidation.message;
        isValid = false;
      }

      const descValidation = validateDescription(formData.translations[locale].description);
      if (!descValidation.isValid) {
        newErrors.translations[locale].description = descValidation.message;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateTitle, validateDescription]);

  // Fetch document data
  const fetchDocument = useCallback(async () => {
    if (!lessonId || !documentId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lessons/${lessonId}/documents/${documentId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }

      const data = await response.json();
      console.log('Fetched document data:', data);
      setDocumentData(data);

      // Populate form data (WITHOUT url field)
      const newFormData: FormData = {
        uploadedFile: null,
        protectionLevel: data.protectionLevel || 'WATERMARK',
        translations: {
          pt: { title: '', description: '' },
          it: { title: '', description: '' },
          es: { title: '', description: '' },
        },
      };

      data.translations.forEach((trans: Translation) => {
        if (['pt', 'it', 'es'].includes(trans.locale)) {
          newFormData.translations[trans.locale] = {
            title: trans.title || '',
            description: trans.description || '',
          };
        }
      });

      setFormData(newFormData);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast({
        title: t('errors.fetchTitle'),
        description: t('errors.fetchDescription'),
        variant: 'destructive',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }, [lessonId, documentId, t, toast, onClose]);

  // Handle file selection (SINGLE PDF for all locales)
  const handleFileSelection = useCallback((file: File | null) => {
    if (!file) return;

    // Validate file type (ONLY PDF)
    if (file.type !== 'application/pdf') {
      setErrors(prev => ({
        ...prev,
        file: t('errors.onlyPDF') || 'Apenas arquivos PDF são permitidos',
      }));
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        file: t('errors.fileTooLarge') || 'Arquivo muito grande (máximo 100MB)',
      }));
      return;
    }

    // Store file
    setFormData(prev => ({
      ...prev,
      uploadedFile: file,
    }));

    // Clear error
    setErrors(prev => ({
      ...prev,
      file: undefined,
    }));

    toast({
      title: t('upload.fileSelected') || 'Arquivo selecionado',
      description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
    });
  }, [t, toast]);

  // Handle file removal
  const handleFileRemove = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      uploadedFile: null,
    }));
  }, []);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      pt: { title: true, description: true },
      it: { title: true, description: true },
      es: { title: true, description: true },
    });

    if (!validateForm() || !lessonId || !documentId) {
      toast({
        title: t('errors.validationTitle'),
        description: t('errors.validationDescription'),
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Get auth token
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create FormData
      const updateFormData = new FormData();

      // Add protectionLevel (OPTIONAL)
      updateFormData.append('protectionLevel', formData.protectionLevel);

      // Add file if uploaded (OPTIONAL)
      if (formData.uploadedFile) {
        updateFormData.append('file', formData.uploadedFile);
      }

      // Add translations (OPTIONAL - but we always send)
      // Format: array of 3 translations WITHOUT url field
      const translations = Object.entries(formData.translations).map(([locale, data]) => ({
        locale,
        title: data.title.trim(),
        description: data.description.trim(),
      }));
      updateFormData.append('translations', JSON.stringify(translations));

      console.log('Sending update:', {
        protectionLevel: formData.protectionLevel,
        hasFile: !!formData.uploadedFile,
        fileName: formData.uploadedFile?.name,
        translations: translations
      });

      // Send PUT request with FormData
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lessons/${lessonId}/documents/${documentId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            // DO NOT set Content-Type - FormData sets it automatically with boundary
          },
          credentials: 'include',
          body: updateFormData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Response:', errorData);

        // Handle specific error cases
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || 'Dados inválidos');
          case 401:
            throw new Error('Não autorizado. Faça login novamente.');
          case 403:
            throw new Error('Você não tem permissão para editar documentos');
          case 404:
            throw new Error('Documento ou aula não encontrada');
          case 413:
            throw new Error('Arquivo muito grande (máximo 100MB)');
          default:
            throw new Error(errorData.message || `Erro ao atualizar: ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('Update successful:', result);

      toast({
        title: t('success.title') || 'Documento atualizado com sucesso!',
        description: t('success.description') || 'As alterações foram salvas.',
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating document:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar documento';

      toast({
        title: t('errors.updateTitle') || 'Erro ao atualizar',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Load document when modal opens
  useEffect(() => {
    if (isOpen && lessonId && documentId) {
      fetchDocument();
    } else if (!isOpen) {
      // Reset state when modal closes
      setDocumentData(null);
      setFormData({
        uploadedFile: null,
        protectionLevel: 'WATERMARK',
        translations: {
          pt: { title: '', description: '' },
          it: { title: '', description: '' },
          es: { title: '', description: '' },
        },
      });
      setErrors({
        translations: {
          pt: {},
          it: {},
          es: {},
        },
      });
      setTouched({
        pt: {},
        it: {},
        es: {},
      });
    }
  }, [isOpen, lessonId, documentId, fetchDocument]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const getLocaleLabel = (locale: string) => {
    switch (locale) {
      case 'pt':
        return 'Português';
      case 'it':
        return 'Italiano';
      case 'es':
        return 'Español';
      default:
        return locale.toUpperCase();
    }
  };

  const getLocaleFlag = (locale: string) => {
    switch (locale) {
      case 'pt':
        return '🇧🇷';
      case 'it':
        return '🇮🇹';
      case 'es':
        return '🇪🇸';
      default:
        return '🌍';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText size={28} className="text-secondary" />
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <Loader2 size={48} className="animate-spin text-secondary mx-auto mb-4" />
              <p className="text-gray-400">{t('loading')}</p>
            </div>
          </div>
        ) : documentData ? (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            {/* Document Info */}
            <div className="p-6 bg-gray-900/50 border-b border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-gray-500" />
                <label className="text-sm font-medium text-gray-400">
                  {t('fields.currentFile') || 'Arquivo atual'}:
                </label>
                <span className="text-gray-300">{documentData.filename}</span>
              </div>

              {/* Single File Upload for All Locales */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  {t('fields.replaceFile') || 'Substituir arquivo PDF'}
                  <span className="text-xs text-gray-500 ml-2">
                    (Opcional - Um único PDF para todos os idiomas)
                  </span>
                </label>

                {formData.uploadedFile ? (
                  // Show selected file
                  <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-3">
                      <FileText className="text-secondary" size={24} />
                      <div>
                        <p className="text-white text-sm font-medium">
                          {formData.uploadedFile.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {(formData.uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleFileRemove}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  // Upload area
                  <div>
                    <input
                      type="file"
                      id="pdf-upload-edit"
                      className="hidden"
                      accept=".pdf,application/pdf"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelection(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="pdf-upload-edit"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition-all duration-200 hover:border-secondary/50"
                    >
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-300 font-medium">
                        {t('upload.clickToSelect') || 'Clique para selecionar novo PDF'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Apenas PDF • Máximo 100MB
                      </p>
                    </label>
                  </div>
                )}

                {errors.file && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={14} />
                    {errors.file}
                  </div>
                )}
              </div>
            </div>

            {/* Protection Level */}
            <div className="p-6 bg-gray-900/50 border-b border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-secondary" />
                  <label className="text-sm font-medium text-gray-300">
                    {t('fields.protectionLevel') || 'Nível de Proteção'}
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* NONE Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, protectionLevel: 'NONE' }))}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      formData.protectionLevel === 'NONE'
                        ? 'border-secondary bg-secondary/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="protectionLevel"
                        value="NONE"
                        checked={formData.protectionLevel === 'NONE'}
                        onChange={() => setFormData(prev => ({ ...prev, protectionLevel: 'NONE' }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldAlert size={18} className="text-gray-400" />
                          <h4 className="text-white font-medium">NONE</h4>
                        </div>
                        <p className="text-xs text-gray-400">
                          {t('protectionLevel.none') || 'Sem proteção, download direto permitido'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* WATERMARK Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, protectionLevel: 'WATERMARK' }))}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      formData.protectionLevel === 'WATERMARK'
                        ? 'border-secondary bg-secondary/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="protectionLevel"
                        value="WATERMARK"
                        checked={formData.protectionLevel === 'WATERMARK'}
                        onChange={() => setFormData(prev => ({ ...prev, protectionLevel: 'WATERMARK' }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={18} className="text-blue-400" />
                          <h4 className="text-white font-medium">WATERMARK</h4>
                        </div>
                        <p className="text-xs text-gray-400">
                          {t('protectionLevel.watermark') || 'Marca d\'água com dados do aluno'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* FULL Option */}
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, protectionLevel: 'FULL' }))}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      formData.protectionLevel === 'FULL'
                        ? 'border-secondary bg-secondary/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="protectionLevel"
                        value="FULL"
                        checked={formData.protectionLevel === 'FULL'}
                        onChange={() => setFormData(prev => ({ ...prev, protectionLevel: 'FULL' }))}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck size={18} className="text-green-400" />
                          <h4 className="text-white font-medium">FULL</h4>
                        </div>
                        <p className="text-xs text-gray-400">
                          {t('protectionLevel.full') || 'Máxima proteção (watermark + URL assinada)'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Translations */}
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Languages size={20} className="text-secondary" />
                <h3 className="text-lg font-semibold text-white">{t('fields.translations')}</h3>
              </div>

              {['pt', 'it', 'es'].map(locale => (
                <div key={locale} className="bg-gray-900/30 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{getLocaleFlag(locale)}</span>
                    <h4 className="text-white font-medium">{getLocaleLabel(locale)}</h4>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('fields.title')}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.translations[locale].title}
                      onChange={e => handleInputChange(locale, 'title')(e.target.value)}
                      onBlur={handleInputBlur(locale, 'title')}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
                        errors.translations[locale].title
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t('placeholders.title')}
                    />
                    {errors.translations[locale].title && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                        <AlertCircle size={14} />
                        {errors.translations[locale].title}
                      </div>
                    )}
                    {formData.translations[locale].title &&
                      !errors.translations[locale].title &&
                      touched[locale]?.title && (
                        <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
                          <Check size={14} />
                          {t('validation.titleValid')}
                        </div>
                      )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('fields.description')}
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <textarea
                      value={formData.translations[locale].description}
                      onChange={e => handleInputChange(locale, 'description')(e.target.value)}
                      onBlur={handleInputBlur(locale, 'description')}
                      rows={4}
                      className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors resize-none ${
                        errors.translations[locale].description
                          ? 'border-red-500'
                          : 'border-gray-600'
                      }`}
                      placeholder={t('placeholders.description')}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        {errors.translations[locale].description && (
                          <div className="flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle size={14} />
                            {errors.translations[locale].description}
                          </div>
                        )}
                        {formData.translations[locale].description &&
                          !errors.translations[locale].description &&
                          touched[locale]?.description && (
                            <div className="flex items-center gap-2 text-green-400 text-sm">
                              <Check size={14} />
                              {t('validation.descriptionValid')}
                            </div>
                          )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formData.translations[locale].description.length}/1000
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </form>
        ) : null}

        {/* Footer */}
        {!loading && documentData && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
