// /src/components/ArgumentEditModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  List,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface ArgumentData {
  id: string;
  title: string;
  assessmentId?: string;
}

interface ArgumentEditModalProps {
  argument: ArgumentData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  title: string;
}

interface FormErrors {
  title?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export default function ArgumentEditModal({
  argument,
  isOpen,
  onClose,
  onSave,
}: ArgumentEditModalProps) {
  const t = useTranslations('Admin.argumentEdit');
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    title: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  // Validate title field
  const validateTitle = useCallback(
    (value: string): ValidationResult => {
      if (!value.trim()) {
        return {
          isValid: false,
          message: t('errors.titleRequired'),
        };
      }
      if (value.trim().length < 3) {
        return {
          isValid: false,
          message: t('errors.titleMin'),
        };
      }
      if (value.trim().length > 255) {
        return {
          isValid: false,
          message: t('errors.titleMax'),
        };
      }
      return { isValid: true };
    },
    [t]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (value: string) => {
      setFormData({ title: value });
      if (touched.title) {
        const validation = validateTitle(value);
        setErrors({
          title: validation.isValid ? undefined : validation.message,
        });
      }
    },
    [touched.title, validateTitle]
  );

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    setTouched({ title: true });
    const validation = validateTitle(formData.title);
    setErrors({
      title: validation.isValid ? undefined : validation.message,
    });
  }, [formData.title, validateTitle]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const validation = validateTitle(formData.title);
    setErrors({
      title: validation.isValid ? undefined : validation.message,
    });
    return validation.isValid;
  }, [formData.title, validateTitle]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ title: true });

    if (!validateForm() || !argument) {
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/arguments/${argument.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = t('error.updateFailed');
        
        switch (data.error) {
          case 'ARGUMENT_NOT_FOUND':
            errorMessage = t('error.notFound');
            break;
          case 'DUPLICATE_ARGUMENT':
            errorMessage = t('error.duplicate');
            break;
          case 'INVALID_INPUT':
            errorMessage = data.details?.[0] || t('error.invalidInput');
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
      console.error('Error updating argument:', error);
      toast({
        title: t('error.updateTitle'),
        description: t('error.connectionError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update form when argument changes
  useEffect(() => {
    if (argument && isOpen) {
      setFormData({
        title: argument.title,
      });
      setErrors({});
      setTouched({});
    }
  }, [argument, isOpen]);

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
            <List size={28} className="text-green-400" />
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
            {/* Current Argument Info */}
            {argument && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-400 mb-1">{t('currentArgument')}</p>
                <p className="text-white font-medium">{argument.title}</p>
              </div>
            )}

            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <List size={16} className="inline mr-2" />
                {t('fields.title')}
                <span className="text-red-400 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleInputChange(e.target.value)}
                onBlur={handleInputBlur}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-colors ${
                  errors.title ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder={t('placeholders.title')}
                disabled={loading}
              />
              {errors.title && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-1">
                  <AlertCircle size={14} />
                  {errors.title}
                </div>
              )}
              {formData.title && !errors.title && touched.title && (
                <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
                  <Check size={14} />
                  {t('validation.titleValid')}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t('hints.title')}
              </p>
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
            disabled={loading || !!errors.title}
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