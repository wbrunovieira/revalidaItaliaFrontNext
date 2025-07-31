// /src/components/CreateFlashcardForm.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';
import NextImage from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateSlug } from '@/lib/slug';
import {
  CreditCard,
  Type,
  Image as ImageIcon,
  Tag,
  Check,
  X,
  Upload,
  RotateCcw,
  Plus,
  BookOpen,
  Layers,
  FileText,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import TagSelectionModal from '@/components/TagSelectionModal';

interface FormData {
  questionType: 'TEXT' | 'IMAGE';
  questionContent: string;
  answerType: 'TEXT' | 'IMAGE';
  answerContent: string;
  argumentId: string;
  tagIds: string[];
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
  argumentId?: string;
  tagIds?: string;
  courseId?: string;
  moduleId?: string;
  lessons?: string;
  [key: string]: string | undefined;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

interface CreateFlashcardFormProps {
  onFlashcardCreated?: () => void;
}

interface Argument {
  id: string;
  title: string;
  order: number;
  assessmentId: string;
  createdAt: string;
}

interface FlashcardTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface UploadedFile {
  file: File;
  url: string;
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

export default function CreateFlashcardForm({
  onFlashcardCreated,
}: CreateFlashcardFormProps) {
  const t = useTranslations('Admin.createFlashcard');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [argumentsList, setArgumentsList] = useState<
    Argument[]
  >([]);
  const [selectedTags, setSelectedTags] = useState<FlashcardTag[]>([]);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [loadingArguments, setLoadingArguments] =
    useState(false);
  const [questionImageFile, setQuestionImageFile] =
    useState<UploadedFile | null>(null);
  const [answerImageFile, setAnswerImageFile] =
    useState<UploadedFile | null>(null);
  const [
    uploadingQuestionImage,
    setUploadingQuestionImage,
  ] = useState(false);
  const [uploadingAnswerImage, setUploadingAnswerImage] =
    useState(false);
  
  // Estados para curso, módulo e aulas
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedLessons, setSelectedLessons] = useState<Lesson[]>([]);

  const [formData, setFormData] = useState<FormData>({
    questionType: 'TEXT',
    questionContent: '',
    answerType: 'TEXT',
    answerContent: '',
    argumentId: '',
    tagIds: [],
    courseId: '',
    moduleId: '',
    lessons: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});

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


  useEffect(() => {
    loadArguments();
  }, [loadArguments]);

  // Helper function to get translation by locale
  const getTranslationByLocale = (
    translations: Translation[],
    locale: string
  ): Translation => {
    return (
      translations.find(t => t.locale === locale) ||
      translations[0] || {
        locale: '',
        title: '',
        description: '',
      }
    );
  };

  // Função para buscar aulas de um módulo específico
  const fetchLessonsForModule = useCallback(
    async (courseId: string, moduleId: string): Promise<Lesson[]> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules/${moduleId}/lessons`
        );

        if (!response.ok) {
          return [];
        }

        const lessonsData = await response.json();
        return lessonsData.lessons || [];
      } catch (error) {
        console.error(`Error fetching lessons for module ${moduleId}:`, error);
        return [];
      }
    },
    []
  );

  // Função para buscar módulos de um curso específico
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<Module[]> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules`
        );

        if (!response.ok) {
          return [];
        }

        const modules: Module[] = await response.json();

        // Buscar aulas para cada módulo
        const modulesWithLessons = await Promise.all(
          modules.map(async module => {
            const lessons = await fetchLessonsForModule(courseId, module.id);
            return { ...module, lessons };
          })
        );

        return modulesWithLessons;
      } catch (error) {
        console.error(`Error fetching modules for course ${courseId}:`, error);
        return [];
      }
    },
    [fetchLessonsForModule]
  );

  // Função para buscar cursos com módulos e aulas
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const coursesData: Course[] = await response.json();

      // Buscar módulos e aulas para cada curso
      const coursesWithData = await Promise.all(
        coursesData.map(async course => {
          const modules = await fetchModulesForCourse(course.id);
          return { ...course, modules };
        })
      );

      setCourses(coursesWithData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: t('errors.loadCoursesTitle'),
        description: t('errors.loadCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [toast, t, fetchModulesForCourse]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const validateField = (
    name: keyof FormData,
    value: string | string[] | Array<{ lessonId: string; order: number }>
  ): ValidationResult => {
    switch (name) {
      case 'questionContent':
        if (
          !value ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return {
            isValid: false,
            message: t('errors.questionRequired'),
          };
        }
        if (
          typeof value === 'string' &&
          value.length > 1000
        ) {
          return {
            isValid: false,
            message: t('errors.questionTooLong'),
          };
        }
        break;
      case 'answerContent':
        if (
          !value ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return {
            isValid: false,
            message: t('errors.answerRequired'),
          };
        }
        if (
          typeof value === 'string' &&
          value.length > 1000
        ) {
          return {
            isValid: false,
            message: t('errors.answerTooLong'),
          };
        }
        break;
      case 'argumentId':
        if (
          !value ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          return {
            isValid: false,
            message: t('errors.argumentRequired'),
          };
        }
        break;
    }

    return { isValid: true };
  };

  const handleFieldChange = (
    name: keyof FormData,
    value: string | string[] | Array<{ lessonId: string; order: number }>
  ) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const validation = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: validation.isValid
          ? undefined
          : validation.message,
      }));
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = formData[name];
    const validation = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: validation.isValid
        ? undefined
        : validation.message,
    }));
  };

  // Handler para mudança de curso
  const handleCourseChange = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseId,
      moduleId: '',
      lessons: [],
    }));
    setSelectedLessons([]);
  };

  // Handler para mudança de módulo
  const handleModuleChange = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      moduleId,
      lessons: [],
    }));
    setSelectedLessons([]);
  };

  // Handler para seleção/deseleção de aulas
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

  const handleQuestionImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('errors.uploadFailedTitle'),
        description: t('errors.invalidImageType'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: t('errors.uploadFailedTitle'),
        description: t('errors.imageTooLarge'),
        variant: 'destructive',
      });
      return;
    }

    setUploadingQuestionImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'image');
      formData.append('folder', 'flashcards');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      const uploadedFile: UploadedFile = {
        file,
        url: data.url,
      };

      setQuestionImageFile(uploadedFile);
      handleFieldChange('questionContent', data.url);
      
      toast({
        title: t('success.uploadTitle'),
        description: t('success.uploadDescription'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : t('errors.uploadFailedDescription');
      toast({
        title: t('errors.uploadFailedTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploadingQuestionImage(false);
    }
  };

  const handleAnswerImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('errors.uploadFailedTitle'),
        description: t('errors.invalidImageType'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: t('errors.uploadFailedTitle'),
        description: t('errors.imageTooLarge'),
        variant: 'destructive',
      });
      return;
    }

    setUploadingAnswerImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'image');
      formData.append('folder', 'flashcards');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      const uploadedFile: UploadedFile = {
        file,
        url: data.url,
      };

      setAnswerImageFile(uploadedFile);
      handleFieldChange('answerContent', data.url);
      
      toast({
        title: t('success.uploadTitle'),
        description: t('success.uploadDescription'),
        variant: 'success',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : t('errors.uploadFailedDescription');
      toast({
        title: t('errors.uploadFailedTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploadingAnswerImage(false);
    }
  };

  const removeQuestionImage = () => {
    setQuestionImageFile(null);
    handleFieldChange('questionContent', '');
  };

  const removeAnswerImage = () => {
    setAnswerImageFile(null);
    handleFieldChange('answerContent', '');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const fieldsToValidate: (keyof FormData)[] = [
      'questionContent',
      'answerContent',
      'argumentId',
    ];

    fieldsToValidate.forEach(field => {
      // Skip lessons field as it has different type
      if (field === 'lessons') return;
      
      const validation = validateField(
        field,
        formData[field]
      );
      if (!validation.isValid) {
        newErrors[field] = validation.message;
      }
    });

    setErrors(newErrors);
    setTouched(
      fieldsToValidate.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {}
      )
    );

    return Object.keys(newErrors).length === 0;
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

      // Gerar slug automaticamente a partir da pergunta
      const slug = generateSlug(
        formData.questionType === 'TEXT' 
          ? formData.questionContent 
          : `flashcard-${Date.now()}`
      );

      const payload = {
        question: {
          type: formData.questionType,
          content: formData.questionContent,
        },
        answer: {
          type: formData.answerType,
          content: formData.answerContent,
        },
        argumentId: formData.argumentId,
        slug,
        ...(formData.tagIds.length > 0 && {
          tagIds: formData.tagIds,
        }),
        ...(formData.lessons.length > 0 && {
          lessons: formData.lessons,
        }),
      };

      console.log('📤 Sending flashcard payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcards`,
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
        console.error('❌ Backend error response:', errorData);
        throw new Error(
          errorData.message || 'Failed to create flashcard'
        );
      }

      toast({
        title: t('success.createTitle'),
        description: t('success.createDescription'),
      });

      if (onFlashcardCreated) {
        onFlashcardCreated();
      }
      resetForm();
    } catch (error) {
      console.error('Error creating flashcard:', error);
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
      questionType: 'TEXT',
      questionContent: '',
      answerType: 'TEXT',
      answerContent: '',
      argumentId: '',
      tagIds: [],
      courseId: '',
      moduleId: '',
      lessons: [],
    });
    setQuestionImageFile(null);
    setAnswerImageFile(null);
    setSelectedLessons([]);
    setErrors({});
    setTouched({});
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl space-y-6"
      >
        <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-secondary/20 rounded-lg">
            <CreditCard
              className="text-secondary"
              size={24}
            />
          </div>
          <h2 className="text-xl font-bold text-white">
            {t('title')}
          </h2>
        </div>
          {/* Question Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Type className="text-secondary" size={20} />
              {t('questionSection')}
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('questionType', 'TEXT');
                  handleFieldChange('questionContent', '');
                  setQuestionImageFile(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.questionType === 'TEXT'
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Type className="inline mr-2" size={16} />
                {t('textType')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleFieldChange(
                    'questionType',
                    'IMAGE'
                  );
                  handleFieldChange('questionContent', '');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.questionType === 'IMAGE'
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ImageIcon className="inline mr-2" size={16} />
                {t('imageType')}
              </button>
            </div>

            {formData.questionType === 'TEXT' ? (
              <div>
                <Label
                  htmlFor="questionContent"
                  className="text-gray-300"
                >
                  {t('questionText')}
                </Label>
                <Textarea
                  id="questionContent"
                  value={formData.questionContent}
                  onChange={(
                    e: React.ChangeEvent<HTMLTextAreaElement>
                  ) =>
                    handleFieldChange(
                      'questionContent',
                      e.target.value
                    )
                  }
                  onBlur={() =>
                    handleBlur('questionContent')
                  }
                  placeholder={t('questionPlaceholder')}
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-secondary focus:ring-secondary"
                  rows={3}
                />
                {errors.questionContent && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.questionContent}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label
                  htmlFor="questionImage"
                  className="text-gray-300"
                >
                  {t('questionImage')}
                </Label>
                {!questionImageFile ? (
                  <div className="mt-1">
                    <label
                      htmlFor="questionImageUpload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-secondary transition-colors"
                    >
                      <div className="text-center">
                        <Upload
                          className="mx-auto text-gray-400 mb-2"
                          size={24}
                        />
                        <p className="text-sm text-gray-400">
                          {uploadingQuestionImage
                            ? t('uploading')
                            : t('uploadImage')}
                        </p>
                      </div>
                    </label>
                    <input
                      id="questionImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleQuestionImageUpload}
                      className="hidden"
                      disabled={uploadingQuestionImage}
                    />
                  </div>
                ) : (
                  <div className="mt-1 relative bg-gray-700 rounded-lg p-4">
                    <NextImage
                      src={questionImageFile.url}
                      alt={t('questionImage')}
                      width={400}
                      height={128}
                      className="w-full h-32 object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={removeQuestionImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {errors.questionContent && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.questionContent}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Answer Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Check className="text-secondary" size={20} />
              {t('answerSection')}
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('answerType', 'TEXT');
                  handleFieldChange('answerContent', '');
                  setAnswerImageFile(null);
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.answerType === 'TEXT'
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Type className="inline mr-2" size={16} />
                {t('textType')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleFieldChange('answerType', 'IMAGE');
                  handleFieldChange('answerContent', '');
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.answerType === 'IMAGE'
                    ? 'bg-secondary text-primary'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ImageIcon className="inline mr-2" size={16} />
                {t('imageType')}
              </button>
            </div>

            {formData.answerType === 'TEXT' ? (
              <div>
                <Label
                  htmlFor="answerContent"
                  className="text-gray-300"
                >
                  {t('answerText')}
                </Label>
                <Textarea
                  id="answerContent"
                  value={formData.answerContent}
                  onChange={(
                    e: React.ChangeEvent<HTMLTextAreaElement>
                  ) =>
                    handleFieldChange(
                      'answerContent',
                      e.target.value
                    )
                  }
                  onBlur={() => handleBlur('answerContent')}
                  placeholder={t('answerPlaceholder')}
                  className="mt-1 w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-secondary focus:ring-secondary"
                  rows={3}
                />
                {errors.answerContent && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.answerContent}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Label
                  htmlFor="answerImage"
                  className="text-gray-300"
                >
                  {t('answerImage')}
                </Label>
                {!answerImageFile ? (
                  <div className="mt-1">
                    <label
                      htmlFor="answerImageUpload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-secondary transition-colors"
                    >
                      <div className="text-center">
                        <Upload
                          className="mx-auto text-gray-400 mb-2"
                          size={24}
                        />
                        <p className="text-sm text-gray-400">
                          {uploadingAnswerImage
                            ? t('uploading')
                            : t('uploadImage')}
                        </p>
                      </div>
                    </label>
                    <input
                      id="answerImageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleAnswerImageUpload}
                      className="hidden"
                      disabled={uploadingAnswerImage}
                    />
                  </div>
                ) : (
                  <div className="mt-1 relative bg-gray-700 rounded-lg p-4">
                    <NextImage
                      src={answerImageFile.url}
                      alt={t('answerImage')}
                      width={400}
                      height={128}
                      className="w-full h-32 object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={removeAnswerImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {errors.answerContent && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.answerContent}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Argument Selection */}
          <div>
            <Label
              htmlFor="argumentId"
              className="text-gray-300"
            >
              {t('argument')}
            </Label>
            <Select
              value={formData.argumentId}
              onValueChange={value =>
                handleFieldChange('argumentId', value)
              }
            >
              <SelectTrigger
                id="argumentId"
                className="mt-1 w-full bg-gray-700 border-gray-600 text-white focus:border-secondary focus:ring-secondary"
                onBlur={() => handleBlur('argumentId')}
              >
                <SelectValue
                  placeholder={t('selectArgument')}
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {loadingArguments ? (
                  <SelectItem value="loading" disabled>
                    {t('loadingArguments')}
                  </SelectItem>
                ) : argumentsList.length === 0 ? (
                  <SelectItem value="no-arguments" disabled>
                    {t('noArguments')}
                  </SelectItem>
                ) : (
                  argumentsList.map(argument => (
                    <SelectItem
                      key={argument.id}
                      value={argument.id}
                      className="text-white hover:bg-gray-600"
                    >
                      {argument.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.argumentId && (
              <p className="mt-1 text-sm text-red-400">
                {errors.argumentId}
              </p>
            )}
          </div>

          {/* Tags Selection */}
          <div>
            <Label className="text-gray-300 flex items-center gap-2">
              <Tag size={16} />
              {t('tags')}
              <span className="text-gray-400 text-sm ml-2">({t('optional')})</span>
            </Label>
            
            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 mb-3">
                {selectedTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-purple-300"
                  >
                    <Tag size={14} />
                    <span>{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
                        setFormData(prev => ({
                          ...prev,
                          tagIds: prev.tagIds.filter(id => id !== tag.id)
                        }));
                      }}
                      className="ml-1 p-0.5 hover:bg-purple-500/30 rounded-full transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Tags Button */}
            <button
              type="button"
              onClick={() => setTagModalOpen(true)}
              className="mt-2 w-full p-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {selectedTags.length > 0 
                ? t('addMoreTags', { count: selectedTags.length })
                : t('selectTags')
              }
            </button>
          </div>

          {/* Seleção de Curso, Módulo e Aulas */}
          <div className="space-y-4 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BookOpen className="text-secondary" size={20} />
              {t('lessonAssociation')}
              <span className="text-gray-400 text-sm ml-2">({t('optional')})</span>
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Seleção de Curso */}
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <BookOpen size={16} />
                  {t('course')}
                </Label>
                {loadingCourses ? (
                  <div className="animate-pulse">
                    <div className="h-10 bg-gray-700 rounded mt-1"></div>
                  </div>
                ) : (
                  <Select
                    value={formData.courseId}
                    onValueChange={handleCourseChange}
                  >
                    <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder={t('selectCourse')} />
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

              {/* Seleção de Módulo */}
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <Layers size={16} />
                  {t('module')}
                </Label>
                <Select
                  value={formData.moduleId}
                  onValueChange={handleModuleChange}
                  disabled={!formData.courseId}
                >
                  <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white disabled:opacity-50">
                    <SelectValue placeholder={t('selectModule')} />
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

            {/* Lista de Aulas */}
            {formData.moduleId && (
              <div>
                <Label className="text-gray-300 flex items-center gap-2 mb-3">
                  <FileText size={16} />
                  {t('selectLessons')}
                </Label>
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
                    {t('selectedLessonsCount', { count: selectedLessons.length })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="mr-2" size={18} />
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
    
    {/* Tag Selection Modal */}
    <TagSelectionModal
      isOpen={tagModalOpen}
      onClose={() => setTagModalOpen(false)}
      selectedTags={selectedTags}
      onTagsSelected={(tags) => {
        setSelectedTags(tags);
        setFormData(prev => ({
          ...prev,
          tagIds: tags.map(tag => tag.id)
        }));
      }}
    />
    </>
  );
}
