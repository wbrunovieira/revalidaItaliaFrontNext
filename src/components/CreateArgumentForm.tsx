// /src/components/CreateArgumentForm.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  List,
  X,
  FileText,
  ClipboardList,
  Check,
  RotateCcw,
} from 'lucide-react';

interface FormData {
  title: string;
  assessmentId: string;
}

interface FormErrors {
  title?: string;
  assessmentId?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface CreateArgumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onArgumentCreated: () => void;
}

interface Assessment {
  id: string;
  title: string;
  type: string;
  slug: string;
  createdAt: string;
}

export default function CreateArgumentForm({
  isOpen,
  onClose,
  onArgumentCreated,
}: CreateArgumentFormProps) {
  const t = useTranslations('Admin.createArgument');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    assessmentId: 'no-assessment',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  const loadAssessments = useCallback(async () => {
    setLoadingAssessments(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assessments`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load assessments');
      }

      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast({
        title: t('errors.loadAssessmentsTitle'),
        description: t('errors.loadAssessmentsDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingAssessments(false);
    }
  }, [t, toast]);

  // Load assessments when component mounts
  useEffect(() => {
    if (isOpen) {
      loadAssessments();
    }
  }, [isOpen, loadAssessments]);

  const validateField = useCallback(
    (field: keyof FormData, value: string): ValidationResult => {
      switch (field) {
        case 'title':
          if (!String(value).trim()) {
            return {
              isValid: false,
              message: t('errors.titleRequired'),
            };
          }
          if (String(value).trim().length < 3) {
            return {
              isValid: false,
              message: t('errors.titleMin'),
            };
          }
          if (String(value).length > 100) {
            return {
              isValid: false,
              message: t('errors.titleMax'),
            };
          }
          return { isValid: true };

        case 'assessmentId':
          // assessmentId is optional, always valid
          return { isValid: true };

        default:
          return { isValid: true };
      }
    },
    [t]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate required fields
    const titleValidation = validateField('title', formData.title);
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.message;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  const handleFieldValidation = useCallback(
    (field: keyof FormData, value: string) => {
      if (touched[field]) {
        const validation = validateField(field, value);
        setErrors(prev => ({
          ...prev,
          [field]: validation.isValid ? undefined : validation.message,
        }));
      }
    },
    [touched, validateField]
  );

  const handleInputChange = useCallback(
    (field: keyof FormData) => (value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      handleFieldValidation(field, value);
    },
    [handleFieldValidation]
  );

  const handleInputBlur = useCallback(
    (field: keyof FormData) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      handleFieldValidation(field, formData[field]);
    },
    [formData, handleFieldValidation]
  );

  const createArgument = async () => {
    const payload = {
      title: formData.title.trim(),
      ...(formData.assessmentId && formData.assessmentId !== 'no-assessment' && {
        assessmentId: formData.assessmentId,
      }),
    };

    console.log('Argument payload:', payload);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/arguments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create argument: ${response.status} - ${errorText}`);
    }

    return response.json();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      assessmentId: 'no-assessment',
    });
    setErrors({});
    setTouched({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched = Object.keys(formData).reduce(
      (acc, field) => {
        acc[field as keyof FormData] = true;
        return acc;
      },
      {} as Record<keyof FormData, boolean>
    );
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
      await createArgument();

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      resetForm();
      onArgumentCreated();
      onClose();
    } catch (error) {
      console.error('Error creating argument:', error);
      toast({
        title: t('error.title'),
        description: t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <List size={24} className="text-green-400" />
            <h2 className="text-xl font-semibold text-white">
              {t('title')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Card */}
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/20 rounded-full">
                  <FileText size={20} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">
                    {t('infoCard.title')}
                  </h3>
                  <p className="text-sm text-gray-300">
                    {t('infoCard.description')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300 flex items-center gap-2">
                  <FileText size={16} />
                  {t('fields.title')}
                  <span className="text-red-400">*</span>
                </Label>
                <TextField
                  id="title"
                  placeholder={t('placeholders.title')}
                  value={formData.title}
                  onChange={e => handleInputChange('title')(e.target.value)}
                  onBlur={handleInputBlur('title')}
                  error={errors.title}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              {/* Assessment */}
              <div className="space-y-2">
                <Label htmlFor="assessmentId" className="text-gray-300 flex items-center gap-2">
                  <ClipboardList size={16} />
                  {t('fields.assessment')}
                  <span className="text-gray-400 text-sm ml-2">({t('fields.optional')})</span>
                </Label>
                <Select
                  value={formData.assessmentId}
                  onValueChange={value => {
                    setFormData(prev => ({ ...prev, assessmentId: value }));
                    setTouched(prev => ({ ...prev, assessmentId: true }));
                  }}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder={loadingAssessments ? t('loadingAssessments') : t('placeholders.assessment')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="no-assessment" className="text-white hover:bg-gray-600">
                      {t('placeholders.noAssessment')}
                    </SelectItem>
                    {assessments.map(assessment => (
                      <SelectItem
                        key={assessment.id}
                        value={assessment.id}
                        className="text-white hover:bg-gray-600"
                      >
                        {assessment.title} ({assessment.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-gray-400 text-xs">
                  {t('fields.assessmentHelp')}
                </p>
                {errors.assessmentId && (
                  <p className="text-red-400 text-sm">{errors.assessmentId}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RotateCcw size={16} className="animate-spin" />
                    {t('creating')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check size={16} />
                    {t('create')}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}