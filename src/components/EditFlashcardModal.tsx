// /src/components/EditFlashcardModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  X,
  CreditCard,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Upload,
  Type,
  Image as ImageIcon,
  Tag,
  List,
  BookOpen,
  Layers,
  FileText,
} from 'lucide-react';
import TagSelectionModal from '@/components/TagSelectionModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth.store';

// Tag type that includes slug (from API response)
interface FlashcardTagWithSlug {
  id: string;
  name: string;
  slug: string;
}

// Tag type for TagSelectionModal (without slug)
interface FlashcardTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Argument {
  id: string;
  title: string;
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
}

interface Module {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
  lessons?: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
  modules?: Module[];
}

interface FlashcardData {
  id: string;
  slug: string;
  questionText: string | null;
  questionImageUrl: string | null;
  questionType: 'TEXT' | 'IMAGE';
  answerText: string | null;
  answerImageUrl: string | null;
  answerType: 'TEXT' | 'IMAGE';
  argumentId: string;
  tags: FlashcardTagWithSlug[];
  lessons?: Array<{
    id: string;
    order: number;
    lesson: Lesson;
  }>;
}

interface EditFlashcardModalProps {
  flashcard: FlashcardData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  questionType: 'TEXT' | 'IMAGE';
  questionContent: string;
  answerType: 'TEXT' | 'IMAGE';
  answerContent: string;
  slug: string;
  argumentId: string;
  tags: FlashcardTagWithSlug[];
  courseId: string;
  moduleId: string;
  lessons: Array<{
    lessonId: string;
    order: number;
  }>;
}

interface FormErrors {
  questionContent?: string;
  answerContent?: string;
  slug?: string;
  argumentId?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export default function EditFlashcardModal({
  flashcard,
  isOpen,
  onClose,
  onSave,
}: EditFlashcardModalProps) {
  const t = useTranslations('Admin.flashcardEdit');
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as string;
  const { token, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    questionType: 'TEXT',
    questionContent: '',
    answerType: 'TEXT',
    answerContent: '',
    slug: '',
    argumentId: '',
    tags: [],
    courseId: '',
    moduleId: '',
    lessons: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);
  const [uploadingAnswerImage, setUploadingAnswerImage] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [showTagModal, setShowTagModal] = useState(false);
  const [argumentsList, setArgumentsList] = useState<Argument[]>([]);
  const [loadingArguments, setLoadingArguments] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [selectedLessons, setSelectedLessons] = useState<Lesson[]>([]);

  // Helper function to get translation by locale
  const getTranslationByLocale = (translations: Translation[], targetLocale: string) => {
    return translations.find(t => t.locale === targetLocale) || {
      locale: targetLocale,
      title: '',
      description: '',
    };
  };

  // Load arguments
  const loadArguments = useCallback(async () => {
    setLoadingArguments(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/arguments`,
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
    } catch (error) {
      console.error('Error loading arguments:', error);
      toast({
        title: t('errors.loadArgumentsTitle'),
        description: t('errors.loadArgumentsDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingArguments(false);
    }
  }, [t, toast]);

  // Load courses with modules and lessons
  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses?isDeleted=false&include=modules.lessons`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load courses');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: t('errors.loadCoursesTitle'),
        description: t('errors.loadCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [t, toast]);

  // Handler for course change
  const handleCourseChange = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseId,
      moduleId: '',
      lessons: [],
    }));
    setSelectedLessons([]);
  };

  // Handler for module change
  const handleModuleChange = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      moduleId,
      lessons: [],
    }));
    setSelectedLessons([]);
  };

  // Handler for lesson toggle
  const handleLessonToggle = (lesson: Lesson) => {
    const isSelected = selectedLessons.some(l => l.id === lesson.id);
    
    if (isSelected) {
      setSelectedLessons(prev => prev.filter(l => l.id !== lesson.id));
      setFormData(prev => ({
        ...prev,
        lessons: prev.lessons.filter(l => l.lessonId !== lesson.id),
      }));
    } else {
      setSelectedLessons(prev => [...prev, lesson]);
      setFormData(prev => ({
        ...prev,
        lessons: [...prev.lessons, { lessonId: lesson.id, order: 1 }],
      }));
    }
  };

  // Validate question content
  const validateQuestionContent = useCallback(
    (value: string | File | null, type: 'TEXT' | 'IMAGE'): ValidationResult => {
      const contentValue = typeof value === 'string' ? value : '';
      if (!contentValue.trim()) {
        return {
          isValid: false,
          message: t(`errors.question${type === 'TEXT' ? 'Text' : 'Image'}Required`),
        };
      }
      if (type === 'TEXT' && contentValue.trim().length > 1000) {
        return {
          isValid: false,
          message: t('errors.questionTextMax'),
        };
      }
      return { isValid: true };
    },
    [t]
  );

  // Validate answer content
  const validateAnswerContent = useCallback(
    (value: string | File | null, type: 'TEXT' | 'IMAGE'): ValidationResult => {
      const contentValue = typeof value === 'string' ? value : '';
      if (!contentValue.trim()) {
        return {
          isValid: false,
          message: t(`errors.answer${type === 'TEXT' ? 'Text' : 'Image'}Required`),
        };
      }
      if (type === 'TEXT' && contentValue.trim().length > 1000) {
        return {
          isValid: false,
          message: t('errors.answerTextMax'),
        };
      }
      return { isValid: true };
    },
    [t]
  );

  // Validate slug
  const validateSlug = useCallback(
    (value: string): ValidationResult => {
      if (!value.trim()) {
        return {
          isValid: false,
          message: t('errors.slugRequired'),
        };
      }
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(value)) {
        return {
          isValid: false,
          message: t('errors.slugInvalid'),
        };
      }
      return { isValid: true };
    },
    [t]
  );

  // Validate argument
  const validateArgument = useCallback(
    (value: string): ValidationResult => {
      if (!value.trim()) {
        return {
          isValid: false,
          message: t('errors.argumentRequired'),
        };
      }
      return { isValid: true };
    },
    [t]
  );

  // Handle input changes
  const handleInputChange = useCallback(
    (field: keyof FormData, value: string | File | null) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      if (touched[field]) {
        let validation: ValidationResult = { isValid: true };
        
        switch (field) {
          case 'questionContent':
            validation = validateQuestionContent(value, formData.questionType);
            break;
          case 'answerContent':
            validation = validateAnswerContent(value, formData.answerType);
            break;
          case 'slug':
            validation = validateSlug(typeof value === 'string' ? value : '');
            break;
          case 'argumentId':
            validation = validateArgument(typeof value === 'string' ? value : '');
            break;
        }
        
        setErrors(prev => ({
          ...prev,
          [field]: validation.isValid ? undefined : validation.message,
        }));
      }
    },
    [touched, formData.questionType, formData.answerType, validateQuestionContent, validateAnswerContent, validateSlug, validateArgument]
  );

  // Handle input blur
  const handleInputBlur = useCallback((field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    let validation: ValidationResult = { isValid: true };
    
    switch (field) {
      case 'questionContent':
        validation = validateQuestionContent(formData.questionContent, formData.questionType);
        break;
      case 'answerContent':
        validation = validateAnswerContent(formData.answerContent, formData.answerType);
        break;
      case 'slug':
        validation = validateSlug(formData.slug);
        break;
      case 'argumentId':
        validation = validateArgument(formData.argumentId);
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [field]: validation.isValid ? undefined : validation.message,
    }));
  }, [formData, validateQuestionContent, validateAnswerContent, validateSlug, validateArgument]);

  // Helper function to delete old image
  const deleteOldImage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.includes('/uploads/')) return;
    
    try {
      // Extract the path from the URL
      const pathMatch = imageUrl.match(/\/uploads\/(.+)/);
      if (!pathMatch) return;
      
      const path = pathMatch[1];
      await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  };

  // Handle question image upload
  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('error.imageTitle'),
        description: t('error.imageInvalid'),
        variant: 'destructive',
      });
      return;
    }

    setUploadingQuestionImage(true);

    try {
      
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('category', 'image');
      uploadData.append('folder', 'flashcards');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      handleInputChange('questionContent', data.url);
      
      toast({
        title: t('success.imageTitle'),
        description: t('success.imageDescription'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('error.imageTitle'),
        description: t('error.imageUploadFailed'),
        variant: 'destructive',
      });
    } finally {
      setUploadingQuestionImage(false);
    }
  };

  // Handle answer image upload
  const handleAnswerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('error.imageTitle'),
        description: t('error.imageInvalid'),
        variant: 'destructive',
      });
      return;
    }

    setUploadingAnswerImage(true);

    try {
      
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('category', 'image');
      uploadData.append('folder', 'flashcards');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      handleInputChange('answerContent', data.url);
      
      toast({
        title: t('success.imageTitle'),
        description: t('success.imageDescription'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('error.imageTitle'),
        description: t('error.imageUploadFailed'),
        variant: 'destructive',
      });
    } finally {
      setUploadingAnswerImage(false);
    }
  };

  // Handle tag selection from modal (convert from FlashcardTag to FlashcardTagWithSlug)
  const handleTagSelection = (tags: FlashcardTag[]) => {
    // Convert tags to include slug (using name as slug)
    const tagsWithSlug: FlashcardTagWithSlug[] = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.name.toLowerCase().replace(/\s+/g, '-'),
    }));
    setFormData(prev => ({ ...prev, tags: tagsWithSlug }));
  };

  // Validate form
  const validateForm = useCallback((): boolean => {
    const questionValidation = validateQuestionContent(formData.questionContent, formData.questionType);
    const answerValidation = validateAnswerContent(formData.answerContent, formData.answerType);
    const slugValidation = validateSlug(formData.slug);
    const argumentValidation = validateArgument(formData.argumentId);
    
    const newErrors: FormErrors = {};
    
    if (!questionValidation.isValid) {
      newErrors.questionContent = questionValidation.message;
    }
    if (!answerValidation.isValid) {
      newErrors.answerContent = answerValidation.message;
    }
    if (!slugValidation.isValid) {
      newErrors.slug = slugValidation.message;
    }
    if (!argumentValidation.isValid) {
      newErrors.argumentId = argumentValidation.message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateQuestionContent, validateAnswerContent, validateSlug, validateArgument]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      questionContent: true,
      answerContent: true,
      slug: true,
      argumentId: true,
    });

    if (!validateForm() || !flashcard) {
      toast({
        title: t('error.validationTitle'),
        description: t('error.validationDescription'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Get token from cookie
      const getCookie = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
      };
      
      if (!token || !isAuthenticated) {
        throw new Error('No authentication token');
      }
      const tokenFromStorage =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken');
      const token = tokenFromCookie || tokenFromStorage;
      
      const updateData: {
        question?: {
          type: 'TEXT' | 'IMAGE';
          content: string;
        };
        answer?: {
          type: 'TEXT' | 'IMAGE';
          content: string;
        };
        slug?: string;
        argumentId?: string;
        tagIds?: string[];
        lessons?: Array<{
          lessonId: string;
          order: number;
        }>;
      } = {};
      const imagesToDelete: string[] = [];
      
      // Only include fields that have changed
      if (formData.questionType !== flashcard.questionType || 
          formData.questionContent !== (flashcard.questionType === 'TEXT' ? flashcard.questionText : flashcard.questionImageUrl)) {
        updateData.question = {
          type: formData.questionType,
          content: formData.questionContent.trim(),
        };
        
        // Mark old question image for deletion if type changed or image changed
        if (flashcard.questionType === 'IMAGE' && flashcard.questionImageUrl && 
            (formData.questionType === 'TEXT' || formData.questionContent !== flashcard.questionImageUrl)) {
          imagesToDelete.push(flashcard.questionImageUrl);
        }
      }
      
      if (formData.answerType !== flashcard.answerType || 
          formData.answerContent !== (flashcard.answerType === 'TEXT' ? flashcard.answerText : flashcard.answerImageUrl)) {
        updateData.answer = {
          type: formData.answerType,
          content: formData.answerContent.trim(),
        };
        
        // Mark old answer image for deletion if type changed or image changed
        if (flashcard.answerType === 'IMAGE' && flashcard.answerImageUrl && 
            (formData.answerType === 'TEXT' || formData.answerContent !== flashcard.answerImageUrl)) {
          imagesToDelete.push(flashcard.answerImageUrl);
        }
      }
      
      if (formData.slug !== flashcard.slug) {
        updateData.slug = formData.slug.trim();
      }
      
      if (formData.argumentId !== flashcard.argumentId && formData.argumentId) {
        updateData.argumentId = formData.argumentId;
      }
      
      // Check if tags have changed
      const currentTagIds = flashcard.tags.map(t => t.id).sort();
      const newTagIds = formData.tags.map(t => t.id).sort();
      const tagsChanged = currentTagIds.join(',') !== newTagIds.join(',');
      
      if (tagsChanged) {
        updateData.tagIds = formData.tags.map(tag => tag.id);
      }
      
      // Check if lessons have changed
      const currentLessonIds = flashcard.lessons?.map(l => l.lesson.id).sort() || [];
      const newLessonIds = formData.lessons.map(l => l.lessonId).sort();
      const lessonsChanged = currentLessonIds.join(',') !== newLessonIds.join(',');
      
      if (lessonsChanged && formData.lessons.length > 0) {
        updateData.lessons = formData.lessons;
      }

      // If no changes, just close
      if (Object.keys(updateData).length === 0) {
        onClose();
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcards/${flashcard.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        let errorMessage = t('error.updateFailed');
        
        // Handle new error structure
        if (data.error) {
          switch (data.error.code) {
            case 'FLASHCARD_NOT_FOUND':
              errorMessage = t('error.flashcardNotFound');
              break;
            case 'INVALID_INPUT':
              errorMessage = data.error.message || t('error.invalidInput');
              break;
            case 'DUPLICATE_SLUG':
              errorMessage = t('error.duplicateSlug');
              break;
            case 'ARGUMENT_NOT_FOUND':
              errorMessage = t('error.argumentNotFound');
              break;
            case 'TAG_NOT_FOUND':
              errorMessage = t('error.tagNotFound');
              break;
            case 'LESSON_NOT_FOUND':
              errorMessage = t('error.lessonNotFound');
              break;
            default:
              errorMessage = data.error.message || t('error.updateFailed');
          }
        } else if (response.status === 400 && data.message) {
          // Legacy error handling
          errorMessage = Array.isArray(data.message) ? data.message[0] : data.message;
        } else if (response.status === 500) {
          errorMessage = t('error.serverError');
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

      // Delete old images after successful save
      for (const imageUrl of imagesToDelete) {
        await deleteOldImage(imageUrl);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast({
        title: t('error.updateTitle'),
        description: t('error.connectionError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update form when flashcard changes
  useEffect(() => {
    if (flashcard && isOpen) {
      // Set selected lessons from flashcard data
      const flashcardLessons = flashcard.lessons?.map(fl => fl.lesson) || [];
      setSelectedLessons(flashcardLessons);
      
      // Find course and module IDs from the first lesson
      let courseId = '';
      let moduleId = '';
      if (flashcardLessons.length > 0) {
        const firstLesson = flashcardLessons[0];
        moduleId = firstLesson.moduleId;
        
        // Find the course that contains this module
        courses.forEach(course => {
          if (course.modules?.some(m => m.id === moduleId)) {
            courseId = course.id;
          }
        });
      }
      
      setFormData({
        questionType: flashcard.questionType,
        questionContent: flashcard.questionType === 'TEXT' 
          ? flashcard.questionText || '' 
          : flashcard.questionImageUrl || '',
        answerType: flashcard.answerType,
        answerContent: flashcard.answerType === 'TEXT' 
          ? flashcard.answerText || '' 
          : flashcard.answerImageUrl || '',
        slug: flashcard.slug,
        argumentId: flashcard.argumentId,
        tags: flashcard.tags,
        courseId,
        moduleId,
        lessons: flashcard.lessons?.map(fl => ({
          lessonId: fl.lesson.id,
          order: fl.order,
        })) || [],
      });
      setErrors({});
      setTouched({});
    }
  }, [flashcard, isOpen, courses]);

  // Load arguments and courses when modal opens
  useEffect(() => {
    if (isOpen) {
      loadArguments();
      loadCourses();
    }
  }, [isOpen, loadArguments, loadCourses]);

  if (!isOpen || !flashcard) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <CreditCard size={24} className="text-secondary" />
              <h2 className="text-xl font-bold text-white">
                {t('title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Question Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {t('question.title')}
              </h3>

              {/* Question Type Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange('questionType', 'TEXT');
                    handleInputChange('questionContent', '');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                    formData.questionType === 'TEXT'
                      ? 'bg-secondary text-primary border-secondary'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  <Type size={18} className="inline mr-2" />
                  {t('types.text')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange('questionType', 'IMAGE');
                    handleInputChange('questionContent', '');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                    formData.questionType === 'IMAGE'
                      ? 'bg-secondary text-primary border-secondary'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  <ImageIcon size={18} className="inline mr-2" />
                  {t('types.image')}
                </button>
              </div>

              {/* Question Content */}
              {formData.questionType === 'TEXT' ? (
                <div>
                  <label className="block text-gray-300 mb-2">
                    {t('question.text')}
                  </label>
                  <textarea
                    value={formData.questionContent}
                    onChange={(e) => handleInputChange('questionContent', e.target.value)}
                    onBlur={() => handleInputBlur('questionContent')}
                    rows={3}
                    className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                      errors.questionContent ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder={t('question.textPlaceholder')}
                  />
                  {errors.questionContent && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.questionContent}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-gray-300 mb-2">
                    {t('question.image')}
                  </label>
                  {formData.questionContent ? (
                    <div className="relative">
                      <Image
                        src={formData.questionContent}
                        alt="Question"
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange('questionContent', '')}
                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQuestionImageUpload}
                        className="hidden"
                        disabled={uploadingQuestionImage}
                      />
                      <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        errors.questionContent ? 'border-red-500' : 'border-gray-600 hover:border-secondary'
                      }`}>
                        {uploadingQuestionImage ? (
                          <Loader2 size={40} className="mx-auto text-secondary animate-spin" />
                        ) : (
                          <Upload size={40} className="mx-auto text-gray-400" />
                        )}
                        <p className="mt-2 text-gray-400">
                          {uploadingQuestionImage ? t('uploading') : t('question.uploadPrompt')}
                        </p>
                      </div>
                    </label>
                  )}
                  {errors.questionContent && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.questionContent}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Answer Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {t('answer.title')}
              </h3>

              {/* Answer Type Toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange('answerType', 'TEXT');
                    handleInputChange('answerContent', '');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                    formData.answerType === 'TEXT'
                      ? 'bg-secondary text-primary border-secondary'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  <Type size={18} className="inline mr-2" />
                  {t('types.text')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleInputChange('answerType', 'IMAGE');
                    handleInputChange('answerContent', '');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                    formData.answerType === 'IMAGE'
                      ? 'bg-secondary text-primary border-secondary'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  <ImageIcon size={18} className="inline mr-2" />
                  {t('types.image')}
                </button>
              </div>

              {/* Answer Content */}
              {formData.answerType === 'TEXT' ? (
                <div>
                  <label className="block text-gray-300 mb-2">
                    {t('answer.text')}
                  </label>
                  <textarea
                    value={formData.answerContent}
                    onChange={(e) => handleInputChange('answerContent', e.target.value)}
                    onBlur={() => handleInputBlur('answerContent')}
                    rows={3}
                    className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                      errors.answerContent ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder={t('answer.textPlaceholder')}
                  />
                  {errors.answerContent && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.answerContent}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-gray-300 mb-2">
                    {t('answer.image')}
                  </label>
                  {formData.answerContent ? (
                    <div className="relative">
                      <Image
                        src={formData.answerContent}
                        alt="Answer"
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange('answerContent', '')}
                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAnswerImageUpload}
                        className="hidden"
                        disabled={uploadingAnswerImage}
                      />
                      <div className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        errors.answerContent ? 'border-red-500' : 'border-gray-600 hover:border-secondary'
                      }`}>
                        {uploadingAnswerImage ? (
                          <Loader2 size={40} className="mx-auto text-secondary animate-spin" />
                        ) : (
                          <Upload size={40} className="mx-auto text-gray-400" />
                        )}
                        <p className="mt-2 text-gray-400">
                          {uploadingAnswerImage ? t('uploading') : t('answer.uploadPrompt')}
                        </p>
                      </div>
                    </label>
                  )}
                  {errors.answerContent && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.answerContent}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-gray-300 mb-2">
                {t('slug.label')}
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
                onBlur={() => handleInputBlur('slug')}
                className={`w-full px-4 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                  errors.slug ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder={t('slug.placeholder')}
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.slug}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {t('slug.hint')}
              </p>
            </div>

            {/* Argument */}
            <div>
              <label className="block text-gray-300 mb-2">
                {t('argument.label')}
              </label>
              <Select
                value={formData.argumentId}
                onValueChange={(value) => handleInputChange('argumentId', value)}
                disabled={loadingArguments}
              >
                <SelectTrigger className={`w-full bg-gray-700 border text-white ${
                  errors.argumentId ? 'border-red-500' : 'border-gray-600'
                }`}>
                  <SelectValue placeholder={loadingArguments ? t('argument.loading') : t('argument.placeholder')}>
                    {loadingArguments ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        {t('argument.loading')}
                      </span>
                    ) : (
                      argumentsList.find(arg => arg.id === formData.argumentId)?.title || formData.argumentId
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {argumentsList.map(argument => (
                    <SelectItem
                      key={argument.id}
                      value={argument.id}
                      className="text-white hover:bg-gray-600 flex items-center gap-2"
                    >
                      <List size={16} className="text-gray-400" />
                      {argument.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.argumentId && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.argumentId}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-gray-300 mb-2">
                {t('tags.label')}
              </label>
              <button
                type="button"
                onClick={() => setShowTagModal(true)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-left hover:bg-gray-600 transition-colors flex items-center justify-between group"
              >
                <span className="text-gray-300 flex items-center gap-2">
                  <Tag size={18} />
                  {formData.tags.length > 0 ? (
                    <span className="text-white">
                      {t('tags.selected', { count: formData.tags.length })}
                    </span>
                  ) : (
                    t('tags.placeholder')
                  )}
                </span>
                <Check size={18} className="text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              {formData.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
                    >
                      <Tag size={12} />
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Lesson Association */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="text-secondary" size={20} />
                {t('lessonAssociation.title')}
                <span className="text-gray-400 text-sm ml-2">({t('lessonAssociation.optional')})</span>
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Course Selection */}
                <div>
                  <label className="block text-gray-300 mb-2 flex items-center gap-2">
                    <BookOpen size={16} />
                    {t('lessonAssociation.course')}
                  </label>
                  {loadingCourses ? (
                    <div className="animate-pulse">
                      <div className="h-10 bg-gray-700 rounded"></div>
                    </div>
                  ) : (
                    <Select
                      value={formData.courseId}
                      onValueChange={handleCourseChange}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder={t('lessonAssociation.selectCourse')} />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {courses.map(course => {
                          const courseTranslation = getTranslationByLocale(
                            course.translations,
                            locale
                          );
                          return (
                            <SelectItem
                              key={course.id}
                              value={course.id}
                              className="text-white hover:bg-gray-600"
                            >
                              {courseTranslation.title}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Module Selection */}
                <div>
                  <label className="block text-gray-300 mb-2 flex items-center gap-2">
                    <Layers size={16} />
                    {t('lessonAssociation.module')}
                  </label>
                  <Select
                    value={formData.moduleId}
                    onValueChange={handleModuleChange}
                    disabled={!formData.courseId}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white disabled:opacity-50">
                      <SelectValue placeholder={t('lessonAssociation.selectModule')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {formData.courseId &&
                        courses
                          .find(c => c.id === formData.courseId)
                          ?.modules?.map(module => {
                            const moduleTranslation = getTranslationByLocale(
                              module.translations,
                              locale
                            );
                            return (
                              <SelectItem
                                key={module.id}
                                value={module.id}
                                className="text-white hover:bg-gray-600"
                              >
                                {moduleTranslation.title}
                              </SelectItem>
                            );
                          })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lessons List */}
              {formData.moduleId && (
                <div>
                  <label className="block text-gray-300 mb-3 flex items-center gap-2">
                    <FileText size={16} />
                    {t('lessonAssociation.selectLessons')}
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto bg-gray-700/50 rounded-lg p-3">
                    {courses
                      .find(c => c.id === formData.courseId)
                      ?.modules?.find(m => m.id === formData.moduleId)
                      ?.lessons?.map(lesson => {
                        const lessonTranslation = getTranslationByLocale(
                          lesson.translations,
                          locale
                        );
                        const isSelected = selectedLessons.some(
                          l => l.id === lesson.id
                        );
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-600/50 rounded transition-colors"
                          >
                            <Checkbox
                              id={`lesson-${lesson.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleLessonToggle(lesson)}
                              className="border-gray-400 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                            />
                            <label
                              htmlFor={`lesson-${lesson.id}`}
                              className="text-sm text-gray-300 cursor-pointer flex-1"
                            >
                              {lessonTranslation.title}
                            </label>
                          </div>
                        );
                      })}
                  </div>
                  {selectedLessons.length > 0 && (
                    <p className="mt-2 text-sm text-gray-400">
                      {t('lessonAssociation.selectedCount', { count: selectedLessons.length })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={loading}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </form>
        </div>
      </div>

      {/* Tag Selection Modal */}
      <TagSelectionModal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        selectedTags={formData.tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))}
        onTagsSelected={handleTagSelection}
      />
    </>
  );
}