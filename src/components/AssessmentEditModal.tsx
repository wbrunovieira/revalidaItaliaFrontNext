// /src/components/AssessmentEditModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  X,
  ClipboardList,
  Save,
  Loader2,
  FileText,
  Clock,
  Award,
  BookOpen,
  Shuffle,
  ArrowRight,
  AlertCircle,
  Check,
} from 'lucide-react';

type AssessmentType = 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
type QuizPosition = 'BEFORE_LESSON' | 'AFTER_LESSON';

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: AssessmentType;
  quizPosition?: QuizPosition | null;
  passingScore?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  timeLimitInMinutes?: number;
  lessonId?: string | null;
}

interface FormData {
  title: string;
  description: string;
  passingScore: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  lessonId: string;
  quizPosition: QuizPosition;
  timeLimitInMinutes: number;
}

interface FormErrors {
  title?: string;
  description?: string;
  passingScore?: string;
  lessonId?: string;
  quizPosition?: string;
  timeLimitInMinutes?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface AssessmentEditModalProps {
  assessment: Assessment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  translations: Translation[];
  courseName: string;
  moduleName: string;
}

export default function AssessmentEditModal({
  assessment,
  isOpen,
  onClose,
  onSave,
}: AssessmentEditModalProps) {
  const t = useTranslations('Admin.assessmentEdit');
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    passingScore: 70,
    randomizeQuestions: false,
    randomizeOptions: false,
    lessonId: 'no-lesson',
    quizPosition: 'AFTER_LESSON',
    timeLimitInMinutes: 60,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  // Load lessons for the dropdown
  const loadLessons = useCallback(async () => {
    setLoadingLessons(true);
    try {
      // Fetch all courses
      const coursesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`
      );
      
      if (!coursesResponse.ok) {
        throw new Error('Failed to load courses');
      }
      
      const courses = await coursesResponse.json();
      const allLessons: Lesson[] = [];
      
      // For each course, fetch modules and lessons
      for (const course of courses) {
        try {
          const modulesResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${course.id}/modules`
          );
          
          if (!modulesResponse.ok) continue;
          
          const modules = await modulesResponse.json();
          
          for (const moduleItem of modules) {
            try {
              const lessonsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${course.id}/modules/${moduleItem.id}/lessons`
              );
              
              if (!lessonsResponse.ok) continue;
              
              const lessonsData = await lessonsResponse.json();
              const lessons = lessonsData.lessons || [];
              
              // Add course and module names to each lesson
              lessons.forEach((lesson: Lesson & { courseName?: string; moduleName?: string }) => {
                const courseTranslation = course.translations.find((t: Translation) => t.locale === 'pt');
                const moduleTranslation = moduleItem.translations.find((t: Translation) => t.locale === 'pt');
                
                allLessons.push({
                  ...lesson,
                  courseName: courseTranslation?.title || 'Unknown Course',
                  moduleName: moduleTranslation?.title || 'Unknown Module',
                });
              });
            } catch (error) {
              console.error(`Error loading lessons for module ${moduleItem.id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error loading modules for course ${course.id}:`, error);
        }
      }
      
      setLessons(allLessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
      toast({
        title: t('errors.loadLessonsTitle'),
        description: t('errors.loadLessonsDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingLessons(false);
    }
  }, [t, toast]);

  // Validation functions
  const validateField = useCallback(
    (field: keyof FormData, value: string | number | boolean): ValidationResult => {
      switch (field) {
        case 'title':
          if (!value || (typeof value === 'string' && !value.trim())) {
            return { isValid: false, message: t('errors.titleRequired') };
          }
          if (typeof value === 'string' && value.trim().length < 3) {
            return { isValid: false, message: t('errors.titleMin') };
          }
          if (typeof value === 'string' && value.trim().length > 100) {
            return { isValid: false, message: t('errors.titleMax') };
          }
          return { isValid: true };
          
        case 'description':
          if (value && typeof value === 'string' && value.length > 500) {
            return { isValid: false, message: t('errors.descriptionMax') };
          }
          return { isValid: true };
          
        case 'passingScore':
          if (assessment?.type !== 'PROVA_ABERTA') {
            const score = Number(value);
            if (isNaN(score) || score < 0 || score > 100) {
              return { isValid: false, message: t('errors.passingScoreInvalid') };
            }
          }
          return { isValid: true };
          
        case 'timeLimitInMinutes':
          if (assessment?.type === 'SIMULADO') {
            const time = Number(value);
            if (isNaN(time) || time < 1 || time > 600) {
              return { isValid: false, message: t('errors.timeLimitInvalid') };
            }
          }
          return { isValid: true };
          
        default:
          return { isValid: true };
      }
    },
    [assessment?.type, t]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    // Always validate title
    const titleValidation = validateField('title', formData.title);
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.message;
      isValid = false;
    }
    
    // Validate description if provided
    const descriptionValidation = validateField('description', formData.description);
    if (!descriptionValidation.isValid) {
      newErrors.description = descriptionValidation.message;
      isValid = false;
    }
    
    // Type-specific validations
    if (assessment?.type !== 'PROVA_ABERTA') {
      const passingScoreValidation = validateField('passingScore', formData.passingScore);
      if (!passingScoreValidation.isValid) {
        newErrors.passingScore = passingScoreValidation.message;
        isValid = false;
      }
    }
    
    if (assessment?.type === 'SIMULADO') {
      const timeLimitValidation = validateField('timeLimitInMinutes', formData.timeLimitInMinutes);
      if (!timeLimitValidation.isValid) {
        newErrors.timeLimitInMinutes = timeLimitValidation.message;
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  }, [formData, assessment?.type, validateField]);

  // Handle field validation on blur
  const handleFieldValidation = useCallback(
    (field: keyof FormData, value: string | number | boolean) => {
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
    (field: keyof FormData) => (value: string | number | boolean) => {
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

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce(
      (acc, field) => {
        acc[field as keyof FormData] = true;
        return acc;
      },
      {} as Record<keyof FormData, boolean>
    );
    setTouched(allTouched);
    
    if (!validateForm() || !assessment) {
      toast({
        title: t('errors.validationTitle'),
        description: t('errors.validationDescription'),
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare payload based on assessment type
      const payload: Record<string, string | number | boolean | null> = {
        title: formData.title.trim(),
      };
      
      // Add optional description
      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      
      // Add lesson ID only if it's a valid UUID (not "no-lesson" or empty)
      if (formData.lessonId && formData.lessonId !== 'no-lesson') {
        // Only include if it's different from current
        if (formData.lessonId !== assessment.lessonId) {
          payload.lessonId = formData.lessonId;
        }
      } else if (assessment.lessonId && formData.lessonId === 'no-lesson') {
        // If user explicitly selected "no lesson" and there was a lesson before,
        // we need to send null to remove the association
        payload.lessonId = null;
      }
      
      // Type-specific fields
      if (assessment.type !== 'PROVA_ABERTA') {
        payload.passingScore = formData.passingScore;
        payload.randomizeQuestions = formData.randomizeQuestions;
        payload.randomizeOptions = formData.randomizeOptions;
      }
      
      if (assessment.type === 'QUIZ') {
        payload.quizPosition = formData.quizPosition;
      }
      
      if (assessment.type === 'SIMULADO') {
        payload.timeLimitInMinutes = formData.timeLimitInMinutes;
      }
      
      console.log('Updating assessment with payload:', payload);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments/${assessment.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );
      
      if (!response.ok) {
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
        
        throw new Error('Failed to update assessment');
      }
      
      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating assessment:', error);
      toast({
        title: t('errors.updateTitle'),
        description: t('errors.updateDescription'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Load assessment data when modal opens
  useEffect(() => {
    if (isOpen && assessment) {
      setFormData({
        title: assessment.title || '',
        description: assessment.description || '',
        passingScore: assessment.passingScore || 70,
        randomizeQuestions: assessment.randomizeQuestions || false,
        randomizeOptions: assessment.randomizeOptions || false,
        lessonId: assessment.lessonId || 'no-lesson',
        quizPosition: (assessment.quizPosition as QuizPosition) || 'AFTER_LESSON',
        timeLimitInMinutes: assessment.timeLimitInMinutes || 60,
      });
      setErrors({});
      setTouched({});
      loadLessons();
    }
  }, [isOpen, assessment, loadLessons]);

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

  if (!isOpen || !assessment) return null;

  const getTypeIcon = (type: AssessmentType) => {
    switch (type) {
      case 'QUIZ':
        return <BookOpen size={20} className="text-blue-400" />;
      case 'SIMULADO':
        return <Clock size={20} className="text-yellow-400" />;
      case 'PROVA_ABERTA':
        return <FileText size={20} className="text-green-400" />;
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
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <ClipboardList size={28} className="text-secondary" />
            <h2 className="text-2xl font-bold text-white">
              {t('title')}
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full">
              {getTypeIcon(assessment.type)}
              <span className="text-sm text-gray-300">
                {t(`types.${assessment.type.toLowerCase()}`)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-gray-300 flex items-center gap-2 mb-2">
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
              {formData.title && !errors.title && touched.title && (
                <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
                  <Check size={14} />
                  {t('validation.titleValid')}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-gray-300 flex items-center gap-2 mb-2">
                <FileText size={16} />
                {t('fields.description')}
                <span className="text-gray-400 text-sm ml-2">({t('fields.optional')})</span>
              </Label>
              <textarea
                id="description"
                placeholder={t('placeholders.description')}
                value={formData.description}
                onChange={e => handleInputChange('description')(e.target.value)}
                onBlur={handleInputBlur('description')}
                rows={3}
                className={`w-full px-3 py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md border focus:outline-none focus:ring-2 focus:ring-secondary ${
                  errors.description ? 'border-red-400' : 'border-gray-600'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={14} />
                    {errors.description}
                  </div>
                )}
                <span className="text-xs text-gray-500 ml-auto">
                  {formData.description.length}/500
                </span>
              </div>
            </div>

            {/* Lesson Selection */}
            <div>
              <Label htmlFor="lesson" className="text-gray-300 flex items-center gap-2 mb-2">
                <BookOpen size={16} />
                {t('fields.lesson')}
                <span className="text-gray-400 text-sm ml-2">({t('fields.optional')})</span>
              </Label>
              <Select
                value={formData.lessonId}
                onValueChange={value => {
                  setFormData(prev => ({ ...prev, lessonId: value }));
                  setTouched(prev => ({ ...prev, lessonId: true }));
                }}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder={loadingLessons ? t('loadingLessons') : t('placeholders.lesson')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="no-lesson" className="text-white hover:bg-gray-600">
                    {t('placeholders.noLesson')}
                  </SelectItem>
                  {lessons.map(lesson => {
                    const lessonTitle = lesson.translations.find(t => t.locale === 'pt')?.title || lesson.translations[0]?.title || 'Unknown Lesson';
                    return (
                      <SelectItem
                        key={lesson.id}
                        value={lesson.id}
                        className="text-white hover:bg-gray-600"
                      >
                        {lessonTitle} - {lesson.courseName} / {lesson.moduleName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-gray-400 text-xs mt-1">
                {t('fields.lessonHelp')}
              </p>
            </div>

            {/* Type-specific fields */}
            {assessment.type !== 'PROVA_ABERTA' && (
              <>
                {/* Passing Score */}
                <div>
                  <Label htmlFor="passingScore" className="text-gray-300 flex items-center gap-2 mb-2">
                    <Award size={16} />
                    {t('fields.passingScore')}
                    <span className="text-red-400">*</span>
                  </Label>
                  <TextField
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    placeholder={t('placeholders.passingScore')}
                    value={formData.passingScore}
                    onChange={e => handleInputChange('passingScore')(Number(e.target.value))}
                    onBlur={handleInputBlur('passingScore')}
                    error={errors.passingScore}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                </div>

                {/* Randomization Options */}
                <div className="space-y-4">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Shuffle size={16} />
                    {t('randomization.title')}
                  </h4>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Randomize Questions */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="randomizeQuestions"
                        checked={formData.randomizeQuestions}
                        onChange={e => handleInputChange('randomizeQuestions')(e.target.checked)}
                        className="w-4 h-4 text-secondary bg-gray-700 border-gray-600 rounded focus:ring-secondary"
                      />
                      <Label htmlFor="randomizeQuestions" className="text-gray-300">
                        {t('randomization.questions')}
                      </Label>
                    </div>

                    {/* Randomize Options */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="randomizeOptions"
                        checked={formData.randomizeOptions}
                        onChange={e => handleInputChange('randomizeOptions')(e.target.checked)}
                        className="w-4 h-4 text-secondary bg-gray-700 border-gray-600 rounded focus:ring-secondary"
                      />
                      <Label htmlFor="randomizeOptions" className="text-gray-300">
                        {t('randomization.options')}
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Quiz-specific fields */}
            {assessment.type === 'QUIZ' && (
              <div>
                <Label htmlFor="quizPosition" className="text-gray-300 flex items-center gap-2 mb-2">
                  <ArrowRight size={16} />
                  {t('fields.quizPosition')}
                </Label>
                <Select
                  value={formData.quizPosition}
                  onValueChange={(value: QuizPosition) => {
                    setFormData(prev => ({ ...prev, quizPosition: value }));
                  }}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="BEFORE_LESSON" className="text-white hover:bg-gray-600">
                      {t('quizPositions.beforeLesson')}
                    </SelectItem>
                    <SelectItem value="AFTER_LESSON" className="text-white hover:bg-gray-600">
                      {t('quizPositions.afterLesson')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Simulado-specific fields */}
            {assessment.type === 'SIMULADO' && (
              <div>
                <Label htmlFor="timeLimitInMinutes" className="text-gray-300 flex items-center gap-2 mb-2">
                  <Clock size={16} />
                  {t('fields.timeLimit')}
                  <span className="text-red-400">*</span>
                </Label>
                <TextField
                  id="timeLimitInMinutes"
                  type="number"
                  min="1"
                  max="600"
                  placeholder={t('placeholders.timeLimit')}
                  value={formData.timeLimitInMinutes}
                  onChange={e => handleInputChange('timeLimitInMinutes')(Number(e.target.value))}
                  onBlur={handleInputBlur('timeLimitInMinutes')}
                  error={errors.timeLimitInMinutes}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
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
      </div>
    </div>
  );
}