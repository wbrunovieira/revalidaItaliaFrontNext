// /src/components/CreateFlashcardTagForm.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import { generateSlug } from '@/lib/slug';
import {
  Tag,
  Check,
  RotateCcw,
} from 'lucide-react';

interface FormData {
  name: string;
}

interface FormErrors {
  name?: string;
}

interface CreateFlashcardTagFormProps {
  onTagCreated?: () => void;
}

export default function CreateFlashcardTagForm({
  onTagCreated,
}: CreateFlashcardTagFormProps) {
  const t = useTranslations('Admin.createFlashcardTag');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  const validateField = (
    name: keyof FormData,
    value: string
  ): { isValid: boolean; message?: string } => {
    switch (name) {
      case 'name':
        const trimmedValue = value.trim();
        if (!trimmedValue) {
          return { isValid: false, message: t('errors.nameRequired') };
        }
        if (trimmedValue.length < 3) {
          return { isValid: false, message: t('errors.nameTooShort') };
        }
        if (trimmedValue.length > 200) {
          return { isValid: false, message: t('errors.nameTooLong') };
        }
        break;
    }

    return { isValid: true };
  };

  const handleFieldChange = (
    name: keyof FormData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const validation = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: validation.isValid ? undefined : validation.message,
      }));
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = formData[name];
    const validation = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: validation.isValid ? undefined : validation.message,
    }));
  };

  const validateForm = (): boolean => {
    const validation = validateField('name', formData.name);
    if (!validation.isValid) {
      setErrors({ name: validation.message });
      setTouched({ name: true });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      // Gerar slug automaticamente a partir do nome
      const slug = generateSlug(formData.name.trim());

      const payload = {
        name: formData.name.trim(),
        slug,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcard-tags`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tag');
      }

      toast({
        title: t('success.createTitle'),
        description: t('success.createDescription'),
      });

      if (onTagCreated) {
        onTagCreated();
      }
      resetForm();
    } catch (error) {
      console.error('Error creating flashcard tag:', error);
      toast({
        title: t('errors.createTitle'),
        description:
          error instanceof Error
            ? error.message
            : t('errors.createDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
    });
    setErrors({});
    setTouched({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-secondary/20 rounded-lg">
            <Tag
              className="text-secondary"
              size={24}
            />
          </div>
          <h2 className="text-xl font-bold text-white">
            {t('title')}
          </h2>
        </div>

        <div className="space-y-4">
          <TextField
            label={t('name')}
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleFieldChange('name', e.target.value)
            }
            onBlur={() => handleBlur('name')}
            placeholder={t('namePlaceholder')}
            error={errors.name}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RotateCcw
                  className="mr-2 animate-spin"
                  size={18}
                />
                {t('creating')}
              </>
            ) : (
              <>
                <Check className="mr-2" size={18} />
                {t('create')}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}