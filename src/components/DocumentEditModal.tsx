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
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
  url: string;
}

interface DocumentData {
  id: string;
  filename: string;
  translations: Translation[];
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

interface UploadedFile {
  file: File;
  url: string;
}

interface FormData {
  uploadedFiles: {
    [locale: string]: UploadedFile | undefined;
  };
  translations: {
    [locale: string]: {
      title: string;
      description: string;
      url: string;
    };
  };
}

interface FormErrors {
  translations: {
    [locale: string]: {
      title?: string;
      description?: string;
      upload?: string;
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
    uploadedFiles: {},
    translations: {
      pt: { title: '', description: '', url: '' },
      it: { title: '', description: '', url: '' },
      es: { title: '', description: '', url: '' },
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
      if (value.trim().length < 5) {
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

      // Populate form data
      const newFormData: FormData = {
        uploadedFiles: {},
        translations: {
          pt: { title: '', description: '', url: '' },
          it: { title: '', description: '', url: '' },
          es: { title: '', description: '', url: '' },
        },
      };

      data.translations.forEach((trans: Translation) => {
        if (['pt', 'it', 'es'].includes(trans.locale)) {
          newFormData.translations[trans.locale] = {
            title: trans.title || '',
            description: trans.description || '',
            url: trans.url || '',
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

  // Handle file selection (NO UPLOAD YET)
  const handleFileSelection = useCallback((file: File, locale: string) => {
    if (!file) return;

    // Validate file type
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
        translations: {
          ...prev.translations,
          [locale]: {
            ...prev.translations[locale],
            upload: t('errors.invalidFileType') || 'Tipo de arquivo inválido',
          },
        },
      }));
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          [locale]: {
            ...prev.translations[locale],
            upload: t('errors.fileTooLarge') || 'Arquivo muito grande (máx 10MB)',
          },
        },
      }));
      return;
    }

    // Generate a temporary URL for display
    const tempUrl = `pending_upload_${locale}_${file.name}`;

    // Store file info WITHOUT uploading
    setFormData(prev => ({
      ...prev,
      uploadedFiles: {
        ...prev.uploadedFiles,
        [locale]: {
          file,
          url: tempUrl, // Temporary URL
        },
      },
    }));

    // Clear error
    setErrors(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          upload: undefined,
        },
      },
    }));

    toast({
      title: t('upload.fileSelected') || 'Arquivo selecionado',
      description: `${file.name} - ${locale.toUpperCase()}`,
    });
  }, [t, toast]);

  // Handle file removal
  const handleFileRemove = useCallback((locale: string) => {
    // Remove from form data
    setFormData(prev => {
      const newUploadedFiles = { ...prev.uploadedFiles };
      delete newUploadedFiles[locale];
      
      return {
        ...prev,
        uploadedFiles: newUploadedFiles,
      };
    });
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
      // First, upload any new files
      const uploadedUrls: Record<string, string> = {};
      
      for (const [locale, fileData] of Object.entries(formData.uploadedFiles)) {
        if (fileData && fileData.file) {
          try {
            // Show uploading toast
            toast({
              title: t('upload.uploading'),
              description: `${fileData.file.name} - ${locale.toUpperCase()}`,
            });

            // Create FormData for upload
            const uploadFormData = new FormData();
            uploadFormData.append('file', fileData.file);
            uploadFormData.append('category', 'document');
            uploadFormData.append('folder', locale);

            // Upload file to server
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: uploadFormData,
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to upload file');
            }

            const uploadResult = await response.json();
            uploadedUrls[locale] = uploadResult.url;
            
            console.log(`File uploaded for ${locale}:`, uploadResult.url);
          } catch (uploadError) {
            // If any upload fails, delete already uploaded files
            for (const uploadedUrl of Object.values(uploadedUrls)) {
              const urlParts = uploadedUrl.split('/');
              const documentsIndex = urlParts.findIndex(part => part === 'documents');
              if (documentsIndex !== -1) {
                const filePath = urlParts.slice(documentsIndex).join('/');
                try {
                  await fetch(`/api/upload?path=${encodeURIComponent(filePath)}`, {
                    method: 'DELETE',
                  });
                } catch (deleteError) {
                  console.error('Failed to delete uploaded file:', deleteError);
                }
              }
            }
            throw uploadError;
          }
        }
      }

      // Prepare translations array with updated URLs
      const translations = Object.entries(formData.translations).map(([locale, data]) => {
        // Use new uploaded file URL if available, otherwise keep original
        const newUrl = uploadedUrls[locale];
        const originalTranslation = documentData?.translations.find(t => t.locale === locale);
        
        return {
          locale,
          title: data.title.trim(),
          description: data.description.trim(),
          url: newUrl || originalTranslation?.url || ''
        };
      });

      const payload = { translations };
      console.log('Sending payload:', payload);
      
      // Update document in backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lessons/${lessonId}/documents/${documentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        // If update fails, delete any uploaded files
        for (const uploadedUrl of Object.values(uploadedUrls)) {
          const urlParts = uploadedUrl.split('/');
          const documentsIndex = urlParts.findIndex(part => part === 'documents');
          if (documentsIndex !== -1) {
            const filePath = urlParts.slice(documentsIndex).join('/');
            try {
              await fetch(`/api/upload?path=${encodeURIComponent(filePath)}`, {
                method: 'DELETE',
              });
            } catch (deleteError) {
              console.error('Failed to delete uploaded file:', deleteError);
            }
          }
        }

        // Try to get error details from response
        let errorMessage = '';
        try {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          errorMessage = errorData.message || errorData.error || '';
        } catch {
          console.error('Could not parse error response');
        }

        if (response.status === 404) {
          toast({
            title: t('errors.updateTitle'),
            description: t('errors.notFound'),
            variant: 'destructive',
          });
          return;
        }

        if (response.status === 400) {
          toast({
            title: t('errors.updateTitle'),
            description: errorMessage || t('errors.invalidData'),
            variant: 'destructive',
          });
          return;
        }

        throw new Error('Failed to update document');
      }

      // SUCCESS - Now delete old files if they were replaced
      for (const [locale, newUrl] of Object.entries(uploadedUrls)) {
        const originalTranslation = documentData?.translations.find(t => t.locale === locale);
        if (originalTranslation?.url && originalTranslation.url !== newUrl) {
          try {
            const oldUrlParts = originalTranslation.url.split('/');
            const documentsIndex = oldUrlParts.findIndex(part => part === 'documents');
            if (documentsIndex !== -1) {
              const oldPath = oldUrlParts.slice(documentsIndex).join('/');
              await fetch(`/api/upload?path=${encodeURIComponent(oldPath)}`, {
                method: 'DELETE',
              });
              console.log(`Deleted old file for locale ${locale}: ${oldPath}`);
            }
          } catch (error) {
            console.error(`Error deleting old file for locale ${locale}:`, error);
          }
        }
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: t('errors.updateTitle'),
        description: t('errors.updateDescription'),
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
        uploadedFiles: {},
        translations: {
          pt: { title: '', description: '', url: '' },
          it: { title: '', description: '', url: '' },
          es: { title: '', description: '', url: '' },
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
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-500" />
                <label className="text-sm font-medium text-gray-400">
                  {t('fields.filename')}:
                </label>
                <span className="text-gray-300">{documentData.filename}</span>
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

                  {/* File Upload/Current File */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t('fields.document')}
                    </label>
                    
                    {formData.uploadedFiles[locale] ? (
                      // Show newly selected file
                      <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <div className="flex items-center gap-3">
                          <FileText className="text-secondary" size={20} />
                          <div>
                            <p className="text-white text-sm font-medium">
                              {formData.uploadedFiles[locale].file.name}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {(formData.uploadedFiles[locale].file.size / 1024 / 1024).toFixed(2)} MB - {t('newFile')}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFileRemove(locale)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      // Show current file or upload button
                      <div className="space-y-2">
                        {documentData?.translations.find(t => t.locale === locale)?.url && (
                          <div className="flex items-center gap-2 p-2 bg-gray-700/50 rounded text-gray-400 text-sm">
                            <FileText size={16} />
                            <span>{t('currentFile')}: {documentData.translations.find(t => t.locale === locale)?.url.split('/').pop()}</span>
                          </div>
                        )}
                        
                        <div>
                          <input
                            type="file"
                            id={`file-upload-${locale}`}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileSelection(file, locale);
                              }
                            }}
                          />
                          <label
                            htmlFor={`file-upload-${locale}`}
                            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 transition-all duration-200 hover:border-secondary/50"
                          >
                            <Upload size={24} className="text-gray-400 mb-1" />
                            <p className="text-sm text-gray-300">{t('upload.replace') || 'Substituir arquivo'}</p>
                            <p className="text-xs text-gray-500 mt-1">{t('upload.supportedFormats') || 'PDF, DOC, XLS, CSV'}</p>
                          </label>
                        </div>
                      </div>
                    )}
                    
                    {errors.translations[locale].upload && (
                      <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                        <AlertCircle size={14} />
                        {errors.translations[locale].upload}
                      </div>
                    )}
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