// /src/components/CreateAssessmentForm.tsx
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
  ClipboardList,
  X,
  FileText,
  Clock,
  Award,
  BookOpen,
  RotateCcw,
  Shuffle,
  ArrowLeft,
  ArrowRight,
  Check,
  Mic,
} from 'lucide-react';

type AssessmentType = 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA' | 'ORAL_EXAM';
type QuizPosition = 'BEFORE_LESSON' | 'AFTER_LESSON';

interface FormData {
  title: string;
  description: string;
  type: AssessmentType | '';
  passingScore: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  lessonId: string;
  // Quiz specific
  quizPosition: QuizPosition;
  // Simulado specific
  timeLimitInMinutes: number;
}

interface FormErrors {
  title?: string;
  description?: string;
  type?: string;
  passingScore?: string;
  lessonId?: string;
  quizPosition?: string;
  timeLimitInMinutes?: string;
  randomizeQuestions?: string;
  randomizeOptions?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface CreateAssessmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAssessmentCreated: () => void;
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
  imageUrl?: string;
  videoId?: string;
  videoData?: {
    id: string;
    slug: string;
    durationInSeconds: number;
    translations: Translation[];
  };
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
  courseName: string;
  moduleName: string;
}

interface Module {
  id: string;
  courseId: string;
  order: number;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
  modules: Module[];
}

export default function CreateAssessmentForm({
  isOpen,
  onClose,
  onAssessmentCreated,
}: CreateAssessmentFormProps) {
  const t = useTranslations('Admin.createAssessment');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: '',
    passingScore: 70,
    randomizeQuestions: false,
    randomizeOptions: false,
    lessonId: 'no-lesson',
    quizPosition: 'AFTER_LESSON',
    timeLimitInMinutes: 60,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  const loadLessons = useCallback(async () => {
    setLoadingLessons(true);
    try {
      // First, fetch all courses
      const coursesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!coursesResponse.ok) {
        throw new Error('Failed to load courses');
      }

      const courses: Course[] = await coursesResponse.json();
      const allLessons: Lesson[] = [];

      // For each course, fetch modules and lessons
      for (const course of courses) {
        try {
          const modulesResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${course.id}/modules`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (!modulesResponse.ok) {
            continue; // Skip this course if modules can't be loaded
          }

          const modules: Module[] = await modulesResponse.json();

          // For each module, fetch lessons
          for (const moduleItem of modules) {
            try {
              const lessonsResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${course.id}/modules/${moduleItem.id}/lessons`,
                {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }
              );

              if (!lessonsResponse.ok) {
                continue; // Skip this module if lessons can't be loaded
              }

              const lessonsData = await lessonsResponse.json();
              const lessons = lessonsData.lessons || [];

              // Add course and module names to each lesson
              const lessonsWithContext = lessons.map((lesson: Lesson) => ({
                ...lesson,
                courseName: course.translations.find(t => t.locale === 'pt')?.title || course.translations[0]?.title || 'Unknown Course',
                moduleName: moduleItem.translations.find(t => t.locale === 'pt')?.title || moduleItem.translations[0]?.title || 'Unknown Module',
              }));

              allLessons.push(...lessonsWithContext);
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

  // Load lessons when component mounts
  useEffect(() => {
    if (isOpen) {
      loadLessons();
    }
  }, [isOpen, loadLessons]);

  const validateField = useCallback(
    (field: keyof FormData, value: string | number | boolean): ValidationResult => {
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
          if (String(value).length > 200) {
            return {
              isValid: false,
              message: t('errors.titleMax'),
            };
          }
          return { isValid: true };

        case 'description':
          // Description is optional, but if provided, validate length
          if (String(value).trim().length > 0) {
            if (String(value).trim().length < 10) {
              return {
                isValid: false,
                message: t('errors.descriptionMin'),
              };
            }
            if (String(value).length > 1000) {
              return {
                isValid: false,
                message: t('errors.descriptionMax'),
              };
            }
          }
          return { isValid: true };

        case 'type':
          if (!value) {
            return {
              isValid: false,
              message: t('errors.typeRequired'),
            };
          }
          if (!['QUIZ', 'SIMULADO', 'PROVA_ABERTA', 'ORAL_EXAM'].includes(String(value))) {
            return {
              isValid: false,
              message: t('errors.typeInvalid'),
            };
          }
          return { isValid: true };

        case 'passingScore':
          const score = Number(value);
          if (isNaN(score)) {
            return {
              isValid: false,
              message: t('errors.passingScoreNumber'),
            };
          }
          if (score < 0 || score > 100) {
            return {
              isValid: false,
              message: t('errors.passingScoreRange'),
            };
          }
          return { isValid: true };

        case 'lessonId':
          // lessonId is optional, always valid
          return { isValid: true };

        case 'timeLimitInMinutes':
          if (formData.type === 'SIMULADO') {
            const time = Number(value);
            if (isNaN(time)) {
              return {
                isValid: false,
                message: t('errors.timeLimitNumber'),
              };
            }
            if (time < 1) {
              return {
                isValid: false,
                message: t('errors.timeLimitMin'),
              };
            }
            if (time > 600) {
              return {
                isValid: false,
                message: t('errors.timeLimitMax'),
              };
            }
          }
          return { isValid: true };

        default:
          return { isValid: true };
      }
    },
    [formData.type, t]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate common required fields
    const titleValidation = validateField('title', formData.title);
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.message;
      isValid = false;
    }

    // Description is optional, but validate if provided
    if (formData.description.trim().length > 0) {
      const descriptionValidation = validateField('description', formData.description);
      if (!descriptionValidation.isValid) {
        newErrors.description = descriptionValidation.message;
        isValid = false;
      }
    }

    const typeValidation = validateField('type', formData.type);
    if (!typeValidation.isValid) {
      newErrors.type = typeValidation.message;
      isValid = false;
    }

    // lessonId is optional, so we don't validate it as required

    // Validate passingScore for QUIZ and SIMULADO only
    if (formData.type === 'QUIZ' || formData.type === 'SIMULADO') {
      const passingScoreValidation = validateField('passingScore', formData.passingScore);
      if (!passingScoreValidation.isValid) {
        newErrors.passingScore = passingScoreValidation.message;
        isValid = false;
      }
    }
    
    // Validate timeLimitInMinutes for SIMULADO only
    if (formData.type === 'SIMULADO') {
      const timeLimitValidation = validateField('timeLimitInMinutes', formData.timeLimitInMinutes);
      if (!timeLimitValidation.isValid) {
        newErrors.timeLimitInMinutes = timeLimitValidation.message;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

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

  const handleTypeSelect = (type: AssessmentType) => {
    setFormData(prev => ({ ...prev, type }));
    setStep('form');
  };

  const handleBackToTypeSelection = () => {
    setStep('type');
    setFormData(prev => ({ ...prev, type: '', lessonId: 'no-lesson' }));
    setErrors({});
    setTouched({});
  };

  const createAssessment = async () => {
    const payload = {
      title: formData.title.trim(),
      type: formData.type,
      ...(formData.lessonId && formData.lessonId !== 'no-lesson' && {
        lessonId: formData.lessonId,
      }),
      ...(formData.description.trim() && {
        description: formData.description.trim(),
      }),
      // ORAL_EXAM and PROVA_ABERTA don't need these fields
      ...(formData.type !== 'PROVA_ABERTA' && formData.type !== 'ORAL_EXAM' && {
        passingScore: formData.passingScore,
        randomizeQuestions: formData.randomizeQuestions,
        randomizeOptions: formData.randomizeOptions,
      }),
      ...(formData.type === 'QUIZ' && {
        quizPosition: formData.quizPosition,
      }),
      ...(formData.type === 'SIMULADO' && {
        timeLimitInMinutes: formData.timeLimitInMinutes,
      }),
    };

    console.log('Assessment payload:', payload);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments`,
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
      throw new Error(`Failed to create assessment: ${response.status} - ${errorText}`);
    }

    return response.json();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: '',
      passingScore: 70,
      randomizeQuestions: false,
      randomizeOptions: false,
      lessonId: 'no-lesson',
      quizPosition: 'AFTER_LESSON',
      timeLimitInMinutes: 60,
    });
    setErrors({});
    setTouched({});
    setStep('type');
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
        title: t('error.validationTitle'),
        description: t('error.validationDescription'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await createAssessment();

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      resetForm();
      onAssessmentCreated();
      onClose();
    } catch (error) {
      console.error('Error creating assessment:', error);
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
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <ClipboardList size={24} className="text-secondary" />
            <h2 className="text-xl font-semibold text-white">
              {step === 'type' ? t('title') : t('titleForm')}
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
          {step === 'type' ? (
            /* Type Selection Step */
            <div className="space-y-6">
              <p className="text-gray-300 text-center mb-8">
                {t('selectType')}
              </p>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Quiz Option */}
                <button
                  onClick={() => handleTypeSelect('QUIZ')}
                  className="p-6 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-secondary transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30">
                      <BookOpen size={32} className="text-blue-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {t('types.quiz.title')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t('types.quiz.description')}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Simulado Option */}
                <button
                  onClick={() => handleTypeSelect('SIMULADO')}
                  className="p-6 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-secondary transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-green-500/20 rounded-full group-hover:bg-green-500/30">
                      <Clock size={32} className="text-green-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {t('types.simulado.title')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t('types.simulado.description')}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Prova Aberta Option */}
                <button
                  onClick={() => handleTypeSelect('PROVA_ABERTA')}
                  className="p-6 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-secondary transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30">
                      <FileText size={32} className="text-purple-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {t('types.provaaberta.title')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t('types.provaaberta.description')}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Oral Exam Option */}
                <button
                  onClick={() => handleTypeSelect('ORAL_EXAM')}
                  className="p-6 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-secondary transition-all duration-200 group"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-full group-hover:bg-orange-500/30">
                      <Mic size={32} className="text-orange-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {t('types.oralexam.title')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t('types.oralexam.description')}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Form Step */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToTypeSelection}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                {t('backToTypeSelection')}
              </button>

              {/* Selected Type Info */}
              <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/20 rounded-full">
                    {formData.type === 'QUIZ' && <BookOpen size={20} className="text-blue-400" />}
                    {formData.type === 'SIMULADO' && <Clock size={20} className="text-green-400" />}
                    {formData.type === 'PROVA_ABERTA' && <FileText size={20} className="text-purple-400" />}
                    {formData.type === 'ORAL_EXAM' && <Mic size={20} className="text-orange-400" />}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {t(`types.${formData.type === 'PROVA_ABERTA' ? 'provaaberta' : formData.type === 'ORAL_EXAM' ? 'oralexam' : formData.type?.toLowerCase()}.title`)}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {t(`types.${formData.type === 'PROVA_ABERTA' ? 'provaaberta' : formData.type === 'ORAL_EXAM' ? 'oralexam' : formData.type?.toLowerCase()}.description`)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
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

                {/* Lesson */}
                <div className="space-y-2">
                  <Label htmlFor="lessonId" className="text-gray-300 flex items-center gap-2">
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
                  <p className="text-gray-400 text-xs">
                    {t('fields.lessonHelp')}
                  </p>
                  {errors.lessonId && (
                    <p className="text-red-400 text-sm">{errors.lessonId}</p>
                  )}
                </div>

                {/* Passing Score - Not for PROVA_ABERTA or ORAL_EXAM */}
                {formData.type !== 'PROVA_ABERTA' && formData.type !== 'ORAL_EXAM' && (
                  <div className="space-y-2">
                    <Label htmlFor="passingScore" className="text-gray-300 flex items-center gap-2">
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
                )}

                {/* Quiz Position - Only for QUIZ type */}
                {formData.type === 'QUIZ' && (
                  <div className="space-y-2">
                    <Label htmlFor="quizPosition" className="text-gray-300 flex items-center gap-2">
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

                {/* Time Limit - Only for SIMULADO type */}
                {formData.type === 'SIMULADO' && (
                  <div className="space-y-2">
                    <Label htmlFor="timeLimitInMinutes" className="text-gray-300 flex items-center gap-2">
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

                {/* Description - Full width */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-gray-300 flex items-center gap-2">
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
                  {errors.description && (
                    <p className="text-red-400 text-sm">{errors.description}</p>
                  )}
                </div>

                {/* Randomization Options - Not for PROVA_ABERTA or ORAL_EXAM */}
                {formData.type !== 'PROVA_ABERTA' && formData.type !== 'ORAL_EXAM' && (
                  <div className="space-y-4 md:col-span-2">
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
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-secondary text-primary hover:bg-secondary/90 px-8 py-3"
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
          )}
        </div>
      </div>
    </div>
  );
}