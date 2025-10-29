// /src/components/CreateQuestionForm.tsx
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
  HelpCircle,
  X,
  FileText,
  ClipboardList,
  List,
  Check,
  RotateCcw,
  CircleDot,
  FileQuestion,
  Plus,
  Trash2,
  Languages,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type QuestionType = 'MULTIPLE_CHOICE' | 'OPEN';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Explanation {
  pt: string;
  it: string;
  es: string;
}

interface FormData {
  text: string;
  type: QuestionType | '';
  assessmentId: string;
  argumentId: string;
  options: Option[];
  explanation: Explanation;
}

interface FormErrors {
  text?: string;
  type?: string;
  assessmentId?: string;
  argumentId?: string;
  options?: string[];
  explanation?: {
    pt?: string;
    it?: string;
    es?: string;
  };
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface CreateQuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionCreated: () => void;
}

interface Assessment {
  id: string;
  title: string;
  type: string;
  slug: string;
  createdAt: string;
}

interface Argument {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function CreateQuestionForm({
  isOpen,
  onClose,
  onQuestionCreated,
}: CreateQuestionFormProps) {
  const t = useTranslations('Admin.createQuestion');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [argumentsList, setArgumentsList] = useState<Argument[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingArguments, setLoadingArguments] = useState(false);
  const [argumentsPage, setArgumentsPage] = useState(1);
  const [argumentsPagination, setArgumentsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const [formData, setFormData] = useState<FormData>({
    text: '',
    type: '',
    assessmentId: '',
    argumentId: 'no-argument',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    explanation: {
      pt: '',
      it: '',
      es: '',
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

  const loadAssessments = useCallback(async () => {
    setLoadingAssessments(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assessments`,
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

  const loadArguments = useCallback(async (page = 1) => {
    setLoadingArguments(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/arguments?${params}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load arguments');
      }

      const data = await response.json();
      setArgumentsList(data.arguments || []);

      if (data.pagination) {
        setArgumentsPagination(data.pagination);
      }

      setArgumentsPage(page);
    } catch (error) {
      console.error('Error loading arguments:', error);
      // Not showing toast for arguments as it's optional
    } finally {
      setLoadingArguments(false);
    }
  }, []);

  // Load assessments and arguments when component mounts
  useEffect(() => {
    if (isOpen) {
      loadAssessments();
      loadArguments();
    }
  }, [isOpen, loadAssessments, loadArguments]);

  const validateField = useCallback(
    (field: keyof FormData, value: string): ValidationResult => {
      switch (field) {
        case 'text':
          if (!String(value).trim()) {
            return {
              isValid: false,
              message: t('errors.textRequired'),
            };
          }
          if (String(value).trim().length < 10) {
            return {
              isValid: false,
              message: t('errors.textMin'),
            };
          }
          if (String(value).length > 1000) {
            return {
              isValid: false,
              message: t('errors.textMax'),
            };
          }
          return { isValid: true };

        case 'type':
          // Type is auto-selected based on assessment, no validation needed
          return { isValid: true };

        case 'assessmentId':
          if (!value) {
            return {
              isValid: false,
              message: t('errors.assessmentRequired'),
            };
          }
          return { isValid: true };

        case 'argumentId':
          // argumentId is optional, always valid
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
    const textValidation = validateField('text', formData.text);
    if (!textValidation.isValid) {
      newErrors.text = textValidation.message;
      isValid = false;
    }

    // Type is auto-selected, no validation needed

    const assessmentValidation = validateField('assessmentId', formData.assessmentId);
    if (!assessmentValidation.isValid) {
      newErrors.assessmentId = assessmentValidation.message;
      isValid = false;
    }

    // Validate options for multiple choice questions
    if (formData.type === 'MULTIPLE_CHOICE') {
      const optionErrors: string[] = [];
      let hasCorrectOption = false;
      let hasEmptyOption = false;

      formData.options.forEach((option, index) => {
        if (!option.text.trim()) {
          optionErrors[index] = t('errors.optionRequired');
          hasEmptyOption = true;
          isValid = false;
        }
        if (option.isCorrect) {
          hasCorrectOption = true;
        }
      });

      if (!hasCorrectOption) {
        // Mark all options as having error to highlight the issue
        formData.options.forEach((_, index) => {
          if (!optionErrors[index]) {
            optionErrors[index] = ''; // Empty string to trigger error state without message
          }
        });
        isValid = false;
        // Add specific error message if no options have errors yet
        if (!hasEmptyOption) {
          toast({
            title: t('errors.noCorrectOption'),
            description: t('errors.selectCorrectOption'),
            variant: 'destructive',
          });
        }
      }

      if (optionErrors.length > 0 && optionErrors.some(err => err !== undefined)) {
        newErrors.options = optionErrors;
      }

      // Validate explanations if there's a correct option
      if (hasCorrectOption) {
        const explanationErrors: FormErrors['explanation'] = {};
        
        if (!formData.explanation.pt.trim()) {
          explanationErrors.pt = t('errors.explanationRequired');
          isValid = false;
        }
        if (!formData.explanation.it.trim()) {
          explanationErrors.it = t('errors.explanationRequired');
          isValid = false;
        }
        if (!formData.explanation.es.trim()) {
          explanationErrors.es = t('errors.explanationRequired');
          isValid = false;
        }

        if (Object.keys(explanationErrors).length > 0) {
          newErrors.explanation = explanationErrors;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField, t, toast]);

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

  const handleAssessmentChange = useCallback(
    (assessmentId: string) => {
      setFormData(prev => ({ ...prev, assessmentId }));
      handleFieldValidation('assessmentId', assessmentId);
      
      // Auto-select question type based on assessment type
      const selectedAssessment = assessments.find(a => a.id === assessmentId);
      if (selectedAssessment) {
        if (selectedAssessment.type === 'QUIZ' || selectedAssessment.type === 'SIMULADO') {
          setFormData(prev => ({ ...prev, type: 'MULTIPLE_CHOICE' }));
          setTouched(prev => ({ ...prev, type: true }));
        } else if (selectedAssessment.type === 'PROVA_ABERTA') {
          setFormData(prev => ({ ...prev, type: 'OPEN' }));
          setTouched(prev => ({ ...prev, type: true }));
        }
      }
    },
    [assessments, handleFieldValidation]
  );

  const handleInputBlur = useCallback(
    (field: keyof FormData) => () => {
      setTouched(prev => ({ ...prev, [field]: true }));
      // Only call handleFieldValidation for string fields
      if (typeof formData[field] === 'string') {
        handleFieldValidation(field, formData[field] as string);
      }
    },
    [formData, handleFieldValidation]
  );

  const addOption = useCallback(() => {
    if (formData.options.length < 5) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { text: '', isCorrect: false }],
      }));
    }
  }, [formData.options.length]);

  const removeOption = useCallback((index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  }, [formData.options.length]);

  const handleOptionTextChange = useCallback((index: number, text: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, text } : opt
      ),
    }));
    
    // Clear error for this option if text is provided
    if (text.trim() && errors.options?.[index]) {
      setErrors(prev => ({
        ...prev,
        options: prev.options?.map((err, i) => i === index ? undefined : err) as string[]
      }));
    }
  }, [errors.options]);

  const handleCorrectOptionChange = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      })),
    }));
  }, []);

  const handleExplanationChange = useCallback((locale: 'pt' | 'it' | 'es', value: string) => {
    setFormData(prev => ({
      ...prev,
      explanation: {
        ...prev.explanation,
        [locale]: value,
      },
    }));
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const createWithRetry = async <T,>(
    fn: () => Promise<T>,
    maxRetries = 3
  ): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await delay(300 * (i + 1)); // Exponential backoff
      }
    }
    throw new Error('Max retries reached');
  };

  const createQuestionWithOptions = async () => {
    // Step 1: Create the question
    const questionPayload = {
      text: formData.text.trim(),
      type: formData.type,
      assessmentId: formData.assessmentId,
      ...(formData.argumentId && formData.argumentId !== 'no-argument' && {
        argumentId: formData.argumentId,
      }),
    };

    console.log('Creating question:', questionPayload);

    const questionResponse = await createWithRetry(async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/questions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionPayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create question: ${response.status} - ${errorText}`);
      }

      return response.json();
    });

    // If it's a multiple choice question, create options and answer
    if (formData.type === 'MULTIPLE_CHOICE') {
      const questionId = questionResponse.id || questionResponse.question?.id;
      
      // Step 2: Create options in parallel
      console.log('Creating options...');
      const optionPromises = formData.options.map((option, index) =>
        createWithRetry(async () => {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/questions/${questionId}/options`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ text: option.text.trim() }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create option ${index + 1}: ${response.status} - ${errorText}`);
          }

          const optionData = await response.json();
          console.log('Option created:', optionData);
          return { ...optionData, isCorrect: option.isCorrect };
        })
      );

      const optionResponses = await Promise.all(optionPromises);
      console.log('All options created:', optionResponses);
      
      // Find the correct option
      const correctOption = optionResponses.find(opt => opt.isCorrect);
      if (!correctOption) {
        throw new Error('No correct option selected');
      }
      
      console.log('Correct option found:', correctOption);

      // Step 3: Create answer with a small delay
      await delay(200);
      console.log('Creating answer...');
      
      const answerPayload = {
        explanation: formData.explanation.pt,
        questionId: questionId,
        correctOptionId: correctOption.questionOption?.id || correctOption.id,
        translations: [
          { locale: 'pt', explanation: formData.explanation.pt },
          { locale: 'it', explanation: formData.explanation.it },
          { locale: 'es', explanation: formData.explanation.es },
        ],
      };
      
      console.log('Answer payload:', answerPayload);

      await createWithRetry(async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/answers`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(answerPayload),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create answer: ${response.status} - ${errorText}`);
        }

        return response.json();
      });
    }

    return questionResponse;
  };

  const resetForm = () => {
    setFormData({
      text: '',
      type: '',
      assessmentId: '',
      argumentId: 'no-argument',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
      explanation: {
        pt: '',
        it: '',
        es: '',
      },
    });
    setErrors({});
    setTouched({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show validation errors
    const allTouched = Object.keys(formData).reduce(
      (acc, field) => {
        acc[field as keyof FormData] = true;
        return acc;
      },
      {} as Record<keyof FormData, boolean>
    );
    setTouched(allTouched);

    // Validate form before making any API requests
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
      await createQuestionWithOptions();

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'success',
      });

      resetForm();
      onQuestionCreated();
      onClose();
    } catch (error) {
      console.error('Error creating question:', error);
      
      // Check for duplicate question error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('DUPLICATE_QUESTION') || errorMessage.includes('409')) {
        toast({
          title: t('error.duplicateTitle'),
          description: t('error.duplicateDescription'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('error.title'),
          description: t('error.description'),
          variant: 'destructive',
        });
      }
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
            <HelpCircle size={24} className="text-purple-400" />
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
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/20 rounded-full">
                  <FileQuestion size={20} className="text-purple-400" />
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
              {/* Assessment - FIRST */}
              <div className="space-y-2">
                <Label htmlFor="assessmentId" className="text-gray-300 flex items-center gap-2">
                  <ClipboardList size={16} />
                  {t('fields.assessment')}
                  <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.assessmentId}
                  onValueChange={handleAssessmentChange}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder={loadingAssessments ? t('loadingAssessments') : t('placeholders.assessment')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
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
                {errors.assessmentId && (
                  <p className="text-red-400 text-sm">{errors.assessmentId}</p>
                )}
                {!formData.assessmentId && (
                  <p className="text-yellow-400 text-sm italic">
                    {t('fields.selectAssessmentFirst')}
                  </p>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label htmlFor="text" className="text-gray-300 flex items-center gap-2">
                  <FileText size={16} />
                  {t('fields.text')}
                  <span className="text-red-400">*</span>
                </Label>
                <textarea
                  id="text"
                  placeholder={t('placeholders.text')}
                  value={formData.text}
                  onChange={e => handleInputChange('text')(e.target.value)}
                  onBlur={handleInputBlur('text')}
                  rows={4}
                  disabled={!formData.assessmentId}
                  className={`w-full px-3 py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.text ? 'border-red-400' : 'border-gray-600'
                  } ${!formData.assessmentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.text && (
                  <p className="text-red-400 text-sm">{errors.text}</p>
                )}
                <p className="text-gray-400 text-xs">
                  {t('fields.textHelp')}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Question Type - Read Only */}
                <div className="space-y-2">
                  <Label className="text-gray-300 flex items-center gap-2">
                    <CircleDot size={16} />
                    {t('fields.type')}
                  </Label>
                  <div className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md ${!formData.assessmentId ? 'opacity-50' : ''}`}>
                    {formData.assessmentId ? (
                      <span className="flex items-center gap-2">
                        {formData.type === 'MULTIPLE_CHOICE' ? (
                          <>
                            <CircleDot size={16} className="text-blue-400" />
                            {t('types.multipleChoice')}
                          </>
                        ) : formData.type === 'OPEN' ? (
                          <>
                            <FileText size={16} className="text-purple-400" />
                            {t('types.open')}
                          </>
                        ) : (
                          <span className="text-gray-400">{t('placeholders.type')}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">{t('placeholders.type')}</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs">
                    {t('fields.typeAutoSelected')}
                  </p>
                </div>
              </div>

              {/* Argument - Optional */}
              <div className="space-y-2">
                <Label htmlFor="argumentId" className="text-gray-300 flex items-center gap-2">
                  <List size={16} />
                  {t('fields.argument')}
                  <span className="text-gray-400 text-sm ml-2">({t('fields.optional')})</span>
                </Label>
                <Select
                  value={formData.argumentId}
                  onValueChange={value => {
                    setFormData(prev => ({ ...prev, argumentId: value }));
                    setTouched(prev => ({ ...prev, argumentId: true }));
                  }}
                  disabled={!formData.assessmentId}
                >
                  <SelectTrigger className={`bg-gray-700 border-gray-600 text-white ${!formData.assessmentId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue placeholder={loadingArguments ? t('loadingArguments') : t('placeholders.argument')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="no-argument" className="text-white hover:bg-gray-600">
                      {t('placeholders.noArgument')}
                    </SelectItem>
                    {argumentsList.map(argument => (
                      <SelectItem
                        key={argument.id}
                        value={argument.id}
                        className="text-white hover:bg-gray-600"
                      >
                        {argument.title}
                      </SelectItem>
                    ))}

                    {/* Pagination Controls inside dropdown */}
                    {argumentsPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between px-2 py-3 mt-1 border-t border-gray-600 bg-gray-800/80">
                        <div className="text-xs text-gray-400">
                          Pág. {argumentsPagination.page}/{argumentsPagination.totalPages}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              loadArguments(argumentsPage - 1);
                            }}
                            disabled={!argumentsPagination.hasPrevious || loadingArguments}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Página anterior"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              loadArguments(argumentsPage + 1);
                            }}
                            disabled={!argumentsPagination.hasNext || loadingArguments}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Próxima página"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </SelectContent>
                </Select>

                <p className="text-gray-400 text-xs">
                  {t('fields.argumentHelp')}
                </p>
              </div>

              {/* Options Section - Only for Multiple Choice */}
              {formData.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300 flex items-center gap-2">
                        <CircleDot size={16} />
                        {t('fields.options')}
                        <span className="text-red-400">*</span>
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">{t('fields.selectCorrectOption')}</p>
                    </div>
                    {formData.options.length < 5 && (
                      <button
                        type="button"
                        onClick={addOption}
                        className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Plus size={16} />
                        {t('addOption')}
                      </button>
                    )}
                  </div>

                  {/* Warning if no correct option selected */}
                  {!formData.options.some(opt => opt.isCorrect) && errors.options && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                      <CircleDot size={20} className="text-red-400 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-medium">{t('errors.noCorrectOption')}</p>
                        <p className="text-red-300 text-sm">{t('errors.selectCorrectOption')}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {formData.options.map((option, index) => {
                      const optionLetter = String.fromCharCode(65 + index);
                      return (
                        <div key={index} className="space-y-3">
                          <div className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                            option.isCorrect 
                              ? 'bg-purple-500/10 border-purple-500/30' 
                              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                          }`}>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-gray-400 font-bold text-lg w-6">{optionLetter}</span>
                              <input
                                type="radio"
                                name="correctOption"
                                checked={option.isCorrect}
                                onChange={() => handleCorrectOptionChange(index)}
                                disabled={!formData.assessmentId}
                                className="w-5 h-5 text-purple-500 bg-gray-700 border-gray-600 focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </div>
                            <div className="flex-1">
                              <TextField
                                placeholder={t('placeholders.optionText')}
                                value={option.text}
                                onChange={e => handleOptionTextChange(index, e.target.value)}
                                error={errors.options?.[index]}
                                disabled={!formData.assessmentId}
                                className={`bg-gray-700 border-gray-600 text-white placeholder-gray-400 ${!formData.assessmentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                              />
                              {option.isCorrect && (
                                <span className="text-xs text-purple-400 mt-1 flex items-center gap-1">
                                  <Check size={14} />
                                  {t('correctOption')}
                                </span>
                              )}
                            </div>
                            {formData.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                disabled={!formData.assessmentId}
                                className="mt-1 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          {/* Explanation Section - Shows directly below the correct option */}
                          {option.isCorrect && (
                            <div className="ml-12 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <Languages size={20} className="text-purple-400" />
                                  <Label className="text-gray-300">
                                    {t('fields.explanation')}
                                    <span className="text-red-400 ml-1">*</span>
                                  </Label>
                                </div>
                                
                                <p className="text-sm text-gray-400">
                                  {t('fields.explanationHelp')}
                                </p>

                                <div className="space-y-4">
                                  {/* Portuguese */}
                                  <div className="space-y-2">
                                    <Label className="text-gray-300 text-sm flex items-center gap-2">
                                      🇧🇷 {t('languages.pt')}
                                      <span className="text-red-400">*</span>
                                    </Label>
                                    <textarea
                                      placeholder={t('placeholders.explanationPt')}
                                      value={formData.explanation.pt}
                                      onChange={e => handleExplanationChange('pt', e.target.value)}
                                      rows={3}
                                      className={`w-full px-3 py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                        errors.explanation?.pt ? 'border-red-400' : 'border-gray-600'
                                      }`}
                                    />
                                    {errors.explanation?.pt && (
                                      <p className="text-red-400 text-sm">{errors.explanation.pt}</p>
                                    )}
                                  </div>

                                  {/* Italian */}
                                  <div className="space-y-2">
                                    <Label className="text-gray-300 text-sm flex items-center gap-2">
                                      🇮🇹 {t('languages.it')}
                                      <span className="text-red-400">*</span>
                                    </Label>
                                    <textarea
                                      placeholder={t('placeholders.explanationIt')}
                                      value={formData.explanation.it}
                                      onChange={e => handleExplanationChange('it', e.target.value)}
                                      rows={3}
                                      className={`w-full px-3 py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                        errors.explanation?.it ? 'border-red-400' : 'border-gray-600'
                                      }`}
                                    />
                                    {errors.explanation?.it && (
                                      <p className="text-red-400 text-sm">{errors.explanation.it}</p>
                                    )}
                                  </div>

                                  {/* Spanish */}
                                  <div className="space-y-2">
                                    <Label className="text-gray-300 text-sm flex items-center gap-2">
                                      🇪🇸 {t('languages.es')}
                                      <span className="text-red-400">*</span>
                                    </Label>
                                    <textarea
                                      placeholder={t('placeholders.explanationEs')}
                                      value={formData.explanation.es}
                                      onChange={e => handleExplanationChange('es', e.target.value)}
                                      rows={3}
                                      className={`w-full px-3 py-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-md border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                        errors.explanation?.es ? 'border-red-400' : 'border-gray-600'
                                      }`}
                                    />
                                    {errors.explanation?.es && (
                                      <p className="text-red-400 text-sm">{errors.explanation.es}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
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