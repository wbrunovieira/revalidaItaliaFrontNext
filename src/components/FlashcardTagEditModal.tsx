// /src/components/FlashcardTagEditModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  Tag,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface FlashcardTagData {
  id: string;
  name: string;
  slug?: string;
}

interface FlashcardTagEditModalProps {
  tag: FlashcardTagData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  name: string;
}

interface FormErrors {
  name?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export default function FlashcardTagEditModal({
  tag,
  isOpen,
  onClose,
  onSave,
}: FlashcardTagEditModalProps) {
  const t = useTranslations('Admin.flashcardTagEdit');
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  // Validate name field
  const validateName = useCallback(
    (value: string): ValidationResult => {
      if (!value.trim()) {
        return {
          isValid: false,
          message: t('errors.nameRequired'),
        };
      }
      if (value.trim().length > 200) {
        return {
          isValid: false,
          message: t('errors.nameMax'),
        };
      }
      return { isValid: true };
    },
    [t]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (value: string) => {
      setFormData({ name: value });
      if (touched.name) {
        const validation = validateName(value);
        setErrors({
          name: validation.isValid ? undefined : validation.message,
        });
      }
    },
    [touched.name, validateName]
  );

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    setTouched({ name: true });
    const validation = validateName(formData.name);
    setErrors({
      name: validation.isValid ? undefined : validation.message,
    });
  }, [formData.name, validateName]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const validation = validateName(formData.name);
    setErrors({
      name: validation.isValid ? undefined : validation.message,
    });
    return validation.isValid;
  }, [formData.name, validateName]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ name: true });

    if (!validateForm() || !tag) {
      toast({
        title: t('error.validationTitle'),
        description: t('error.validationDescription'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcard-tags/${tag.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = t('error.updateFailed');
        
        switch (data.error) {
          case 'FLASHCARD_TAG_NOT_FOUND':
            errorMessage = t('error.notFound');
            break;
          case 'DUPLICATE_FLASHCARD_TAG':
            errorMessage = t('error.duplicate');
            break;
          case 'INVALID_INPUT':
            errorMessage = data.details?.name?.[0] || t('error.invalidInput');
            break;
          case 'REPOSITORY_ERROR':
            errorMessage = data.message || t('error.updateFailed');
            break;
          default:
            errorMessage = data.message || t('error.updateFailed');
        }

        toast({
          title: t('error.updateTitle'),
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating flashcard tag:', error);
      toast({
        title: t('error.updateTitle'),
        description: t('error.connectionError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update form when tag changes
  useEffect(() => {
    if (tag && isOpen) {
      setFormData({
        name: '', // Always start with empty field
      });
      setErrors({});
      setTouched({});
    }
  }, [tag, isOpen]);

  // Handle escape key
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Tag size={28} className="text-green-400" />
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Current Tag Info */}
            {tag && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400 mb-1">{t('currentTag')}</p>
                <p className="text-white font-medium">{tag.name}</p>
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Tag size={16} className="inline mr-2" />
                {t('fields.name')}
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
                  errors.name ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder={t('placeholders.name')}
                disabled={loading}
              />
              {errors.name && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                  <AlertCircle size={14} />
                  {errors.name}
                </div>
              )}
              {formData.name && !errors.name && touched.name && (
                <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
                  <Check size={14} />
                  {t('validation.nameValid')}
                </div>
              )}
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
            disabled={loading || !!errors.name}
            className="px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save size={18} />
                {t('save')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}