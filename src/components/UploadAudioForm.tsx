// /src/components/UploadAudioForm.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Music,
  Globe,
  BookOpen,
  Play,
  Layers,
  Check,
  Upload,
  Trash2,
  Clock,
  FileAudio,
  AlertCircle,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
}

interface Module {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
  lessons?: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Array<{
    locale: string;
    title: string;
    description: string;
  }>;
  modules?: Module[];
}

interface FormData {
  courseId: string;
  moduleId: string;
  lessonId: string;
  file: File | null;
  durationInSeconds: number;
  translations: {
    pt: Translation;
    es: Translation;
    it: Translation;
  };
}

interface FormErrors {
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  file?: string;
  durationInSeconds?: string;
  title_pt?: string;
  title_es?: string;
  title_it?: string;
}

type Locale = 'pt' | 'es' | 'it';

const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/webm',
];

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

export default function UploadAudioForm() {
  const t = useTranslations('Admin.uploadAudio');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [calculatingDuration, setCalculatingDuration] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    moduleId: '',
    lessonId: '',
    file: null,
    durationInSeconds: 0,
    translations: {
      pt: { locale: 'pt', title: '', description: '' },
      es: { locale: 'es', title: '', description: '' },
      it: { locale: 'it', title: '', description: '' },
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/courses`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: t('error.fetchCoursesTitle'),
        description: t('error.fetchCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Get translation by locale
  const getTranslation = useCallback(
    (translations: Array<{ locale: string; title: string }>) => {
      return (
        translations.find(tr => tr.locale === locale) ||
        translations.find(tr => tr.locale === 'pt') ||
        translations[0]
      );
    },
    [locale]
  );

  // Get selected course
  const selectedCourse = courses.find(c => c.id === formData.courseId);

  // Get modules for selected course
  const modules = selectedCourse?.modules || [];

  // Get selected module
  const selectedModule = modules.find(m => m.id === formData.moduleId);

  // Get lessons for selected module
  const lessons = selectedModule?.lessons || [];

  // Handle course change
  const handleCourseChange = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseId,
      moduleId: '',
      lessonId: '',
    }));
    setTouched(prev => ({ ...prev, courseId: true }));
  };

  // Handle module change
  const handleModuleChange = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      moduleId,
      lessonId: '',
    }));
    setTouched(prev => ({ ...prev, moduleId: true }));
  };

  // Handle lesson change
  const handleLessonChange = (lessonId: string) => {
    setFormData(prev => ({ ...prev, lessonId }));
    setTouched(prev => ({ ...prev, lessonId: true }));
  };

  // Calculate audio duration
  const calculateDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(Math.round(audio.duration));
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load audio file'));
      });

      audio.src = objectUrl;
    });
  }, []);

  // Handle file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setFormData(prev => ({ ...prev, file: null, durationInSeconds: 0 }));
      return;
    }

    // Validate file type
    if (!SUPPORTED_AUDIO_TYPES.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        file: t('errors.invalidFileType'),
      }));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrors(prev => ({
        ...prev,
        file: t('errors.fileTooLarge'),
      }));
      return;
    }

    setErrors(prev => ({ ...prev, file: undefined }));
    setCalculatingDuration(true);

    try {
      const duration = await calculateDuration(file);
      setFormData(prev => ({
        ...prev,
        file,
        durationInSeconds: duration,
      }));
    } catch (error) {
      console.error('Error calculating duration:', error);
      setErrors(prev => ({
        ...prev,
        file: t('errors.durationCalculationFailed'),
      }));
    } finally {
      setCalculatingDuration(false);
    }

    setTouched(prev => ({ ...prev, file: true }));
  };

  // Remove file
  const handleRemoveFile = () => {
    setFormData(prev => ({ ...prev, file: null, durationInSeconds: 0 }));
    setErrors(prev => ({ ...prev, file: undefined }));
  };

  // Handle translation change
  const handleTranslationChange = (
    localeKey: Locale,
    field: 'title' | 'description',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [localeKey]: {
          ...prev.translations[localeKey],
          [field]: value,
        },
      },
    }));

    if (field === 'title') {
      setTouched(prev => ({ ...prev, [`title_${localeKey}`]: true }));
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.courseId) {
      newErrors.courseId = t('errors.courseRequired');
    }
    if (!formData.moduleId) {
      newErrors.moduleId = t('errors.moduleRequired');
    }
    if (!formData.lessonId) {
      newErrors.lessonId = t('errors.lessonRequired');
    }
    if (!formData.file) {
      newErrors.file = t('errors.fileRequired');
    }
    if (!formData.translations.pt.title.trim()) {
      newErrors.title_pt = t('errors.titleRequired');
    }
    if (!formData.translations.it.title.trim()) {
      newErrors.title_it = t('errors.titleRequired');
    }
    if (!formData.translations.es.title.trim()) {
      newErrors.title_es = t('errors.titleRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

      const formDataToSend = new FormData();
      formDataToSend.append('file', formData.file!);
      formDataToSend.append('lessonId', formData.lessonId);
      formDataToSend.append('durationInSeconds', formData.durationInSeconds.toString());
      formDataToSend.append(
        'translations',
        JSON.stringify([
          {
            locale: 'pt',
            title: formData.translations.pt.title,
            description: formData.translations.pt.description || null,
          },
          {
            locale: 'it',
            title: formData.translations.it.title,
            description: formData.translations.it.description || null,
          },
          {
            locale: 'es',
            title: formData.translations.es.title,
            description: formData.translations.es.description || null,
          },
        ])
      );

      const response = await fetch(`${apiUrl}/api/v1/audios/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });

      if (response.status === 400) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid data');
      }

      if (response.status === 404) {
        throw new Error('lesson_not_found');
      }

      if (response.status === 413) {
        throw new Error('file_too_large');
      }

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
        variant: 'default',
      });

      // Reset form
      setFormData({
        courseId: '',
        moduleId: '',
        lessonId: '',
        file: null,
        durationInSeconds: 0,
        translations: {
          pt: { locale: 'pt', title: '', description: '' },
          es: { locale: 'es', title: '', description: '' },
          it: { locale: 'it', title: '', description: '' },
        },
      });
      setTouched({});
      setErrors({});
    } catch (error) {
      console.error('Error uploading audio:', error);

      if (error instanceof Error) {
        if (error.message === 'lesson_not_found') {
          toast({
            title: t('error.uploadTitle'),
            description: t('error.lessonNotFound'),
            variant: 'destructive',
          });
        } else if (error.message === 'file_too_large') {
          toast({
            title: t('error.uploadTitle'),
            description: t('error.fileTooLarge'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('error.uploadTitle'),
            description: t('error.uploadDescription'),
            variant: 'destructive',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6 border-b border-gray-700 pb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Music size={24} className="text-secondary" />
            {t('title')}
          </h3>
          <p className="text-gray-400 text-sm mt-1">{t('description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course, Module, Lesson Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Course Select */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <BookOpen size={16} className="text-secondary" />
                {t('fields.course')} *
              </Label>
              <Select
                value={formData.courseId}
                onValueChange={handleCourseChange}
                disabled={loadingCourses}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder={loadingCourses ? t('loading') : t('placeholders.course')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id} className="text-white hover:bg-gray-600">
                      {getTranslation(course.translations)?.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.courseId && touched.courseId && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.courseId}
                </p>
              )}
            </div>

            {/* Module Select */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Layers size={16} className="text-secondary" />
                {t('fields.module')} *
              </Label>
              <Select
                value={formData.moduleId}
                onValueChange={handleModuleChange}
                disabled={!formData.courseId}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder={t('placeholders.module')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {modules.map(module => (
                    <SelectItem key={module.id} value={module.id} className="text-white hover:bg-gray-600">
                      {getTranslation(module.translations)?.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.moduleId && touched.moduleId && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.moduleId}
                </p>
              )}
            </div>

            {/* Lesson Select */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Play size={16} className="text-secondary" />
                {t('fields.lesson')} *
              </Label>
              <Select
                value={formData.lessonId}
                onValueChange={handleLessonChange}
                disabled={!formData.moduleId}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder={t('placeholders.lesson')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {lessons.map(lesson => (
                    <SelectItem key={lesson.id} value={lesson.id} className="text-white hover:bg-gray-600">
                      {getTranslation(lesson.translations)?.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.lessonId && touched.lessonId && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.lessonId}
                </p>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <FileAudio size={16} className="text-secondary" />
              {t('fields.file')} *
            </Label>

            {!formData.file ? (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-secondary transition-colors">
                <input
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/mp4,audio/webm"
                  onChange={handleFileChange}
                  className="hidden"
                  id="audio-upload"
                  disabled={calculatingDuration}
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <Upload size={40} className="mx-auto text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">{t('uploadHint')}</p>
                  <p className="text-gray-500 text-xs mt-1">{t('supportedFormats')}</p>
                  <p className="text-gray-500 text-xs">{t('maxSize')}</p>
                </label>
              </div>
            ) : (
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileAudio size={32} className="text-secondary" />
                    <div>
                      <p className="text-white font-medium">{formData.file.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>{formatFileSize(formData.file.size)}</span>
                        {calculatingDuration ? (
                          <span className="flex items-center gap-1">
                            <Clock size={14} className="animate-spin" />
                            {t('calculatingDuration')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDuration(formData.durationInSeconds)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}

            {errors.file && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.file}
              </p>
            )}
          </div>

          {/* Translations */}
          <div className="space-y-4">
            <Label className="text-gray-300 flex items-center gap-2">
              <Globe size={16} className="text-secondary" />
              {t('fields.translations')}
            </Label>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Portuguese */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🇧🇷</span>
                  <span className="text-sm text-gray-400 font-semibold">Português</span>
                </div>
                <div className="space-y-3">
                  <TextField
                    label={`${t('fields.title')} *`}
                    placeholder={t('placeholders.title')}
                    value={formData.translations.pt.title}
                    onChange={e => handleTranslationChange('pt', 'title', e.target.value)}
                    error={errors.title_pt}
                  />
                  <TextField
                    label={t('fields.description')}
                    placeholder={t('placeholders.description')}
                    value={formData.translations.pt.description}
                    onChange={e => handleTranslationChange('pt', 'description', e.target.value)}
                  />
                </div>
              </div>

              {/* Italian */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🇮🇹</span>
                  <span className="text-sm text-gray-400 font-semibold">Italiano</span>
                </div>
                <div className="space-y-3">
                  <TextField
                    label={`${t('fields.title')} *`}
                    placeholder={t('placeholders.title')}
                    value={formData.translations.it.title}
                    onChange={e => handleTranslationChange('it', 'title', e.target.value)}
                    error={errors.title_it}
                  />
                  <TextField
                    label={t('fields.description')}
                    placeholder={t('placeholders.description')}
                    value={formData.translations.it.description}
                    onChange={e => handleTranslationChange('it', 'description', e.target.value)}
                  />
                </div>
              </div>

              {/* Spanish */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🇪🇸</span>
                  <span className="text-sm text-gray-400 font-semibold">Español</span>
                </div>
                <div className="space-y-3">
                  <TextField
                    label={`${t('fields.title')} *`}
                    placeholder={t('placeholders.title')}
                    value={formData.translations.es.title}
                    onChange={e => handleTranslationChange('es', 'title', e.target.value)}
                    error={errors.title_es}
                  />
                  <TextField
                    label={t('fields.description')}
                    placeholder={t('placeholders.description')}
                    value={formData.translations.es.description}
                    onChange={e => handleTranslationChange('es', 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-700">
            <Button
              type="submit"
              disabled={loading || calculatingDuration}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Upload size={18} className="animate-spin" />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <Check size={18} />
                  {t('submit')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
