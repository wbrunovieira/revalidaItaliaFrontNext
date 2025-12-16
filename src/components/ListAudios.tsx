// /src/components/ListAudios.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
  Loader2,
  AlertCircle,
  Eye,
  X,
  Calendar,
  Globe,
  Clock,
  FileAudio,
  BookOpen,
  Layers,
  Play,
  HardDrive,
} from 'lucide-react';

interface Translation {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description?: string;
}

interface Audio {
  id: string;
  lessonId: string;
  filename: string;
  durationInSeconds: number;
  formattedDuration: string;
  fileSize: number;
  mimeType: string;
  order: number;
  transcription?: string;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
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

export default function ListAudios() {
  const t = useTranslations('Admin.listAudios');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');

  const [audios, setAudios] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedAudio, setSelectedAudio] = useState<Audio | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch lessons for a specific module
  const fetchLessonsForModule = useCallback(
    async (courseId: string, moduleId: string): Promise<Lesson[]> => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons?limit=100`,
          { credentials: 'include' }
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

  // Fetch modules for a specific course
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<Module[]> => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          return [];
        }

        const modules: Module[] = await response.json();

        // Fetch lessons for each module
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

  // Fetch courses with modules and lessons
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

      const coursesData: Course[] = await response.json();

      // Fetch modules and lessons for each course
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
        title: t('error.fetchCoursesTitle'),
        description: t('error.fetchCoursesDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [t, toast, fetchModulesForCourse]);

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

  // Get audio translation by locale
  const getAudioTranslation = useCallback(
    (translations: Translation[]) => {
      return (
        translations.find(tr => tr.locale === locale) ||
        translations.find(tr => tr.locale === 'pt') ||
        translations[0]
      );
    },
    [locale]
  );

  // Get selected course
  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  // Get modules for selected course
  const modules = selectedCourse?.modules || [];

  // Get selected module
  const selectedModule = modules.find(m => m.id === selectedModuleId);

  // Get lessons for selected module
  const lessons = selectedModule?.lessons || [];

  // Handle course change
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId('');
    setSelectedLessonId('');
    setAudios([]);
  };

  // Handle module change
  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedLessonId('');
    setAudios([]);
  };

  // Handle lesson change
  const handleLessonChange = async (lessonId: string) => {
    setSelectedLessonId(lessonId);
    if (lessonId) {
      await fetchAudios(lessonId);
    } else {
      setAudios([]);
    }
  };

  // Fetch audios for lesson
  const fetchAudios = useCallback(async (lessonId: string) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/audios?lessonId=${lessonId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audios');
      }

      const data = await response.json();
      setAudios(data.audios || []);
    } catch (error) {
      console.error('Error fetching audios:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Open view modal
  const openViewModal = (audio: Audio) => {
    setSelectedAudio(audio);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAudio(null);
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

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Course Select */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <BookOpen size={16} className="text-secondary" />
              {t('fields.course')}
            </Label>
            <Select
              value={selectedCourseId}
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
          </div>

          {/* Module Select */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Layers size={16} className="text-secondary" />
              {t('fields.module')}
            </Label>
            <Select
              value={selectedModuleId}
              onValueChange={handleModuleChange}
              disabled={!selectedCourseId || modules.length === 0}
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
          </div>

          {/* Lesson Select */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Play size={16} className="text-secondary" />
              {t('fields.lesson')}
            </Label>
            <Select
              value={selectedLessonId}
              onValueChange={handleLessonChange}
              disabled={!selectedModuleId || lessons.length === 0}
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
          </div>
        </div>

        {/* Content */}
        {!selectedLessonId ? (
          <div className="text-center py-8">
            <Music className="mx-auto mb-3 text-gray-500" size={32} />
            <p className="text-gray-400 text-sm">{t('selectLesson')}</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-secondary animate-spin" />
            <span className="ml-2 text-gray-400 text-sm">{t('loading')}</span>
          </div>
        ) : audios.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto mb-3 text-gray-500" size={32} />
            <p className="text-gray-400 text-sm">{t('noAudios')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audios.map(audio => {
              const translation = getAudioTranslation(audio.translations);
              return (
                <div
                  key={audio.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <FileAudio size={24} className="text-secondary" />
                    <div>
                      <p className="text-white font-medium">{translation?.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {audio.formattedDuration}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive size={12} />
                          {formatFileSize(audio.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openViewModal(audio)}
                    className="p-2 text-gray-400 hover:text-secondary hover:bg-gray-700 rounded-lg transition-colors"
                    title={t('view')}
                  >
                    <Eye size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Modal */}
      {isModalOpen && selectedAudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-gray-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileAudio size={20} className="text-secondary" />
                {t('modal.title')}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* File Info */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <FileAudio size={32} className="text-secondary" />
                  <div>
                    <p className="text-white font-medium">{selectedAudio.filename}</p>
                    <p className="text-xs text-gray-400">{selectedAudio.mimeType}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={14} />
                    <span>{t('modal.duration')}: {selectedAudio.formattedDuration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <HardDrive size={14} />
                    <span>{t('modal.size')}: {formatFileSize(selectedAudio.fileSize)}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} />
                    {t('modal.createdAt')}
                  </label>
                  <p className="text-gray-300 text-sm mt-1">{formatDate(selectedAudio.createdAt)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} />
                    {t('modal.updatedAt')}
                  </label>
                  <p className="text-gray-300 text-sm mt-1">{formatDate(selectedAudio.updatedAt)}</p>
                </div>
              </div>

              {/* Transcription */}
              {selectedAudio.transcription && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                    {t('modal.transcription')}
                  </label>
                  <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedAudio.transcription}</p>
                  </div>
                </div>
              )}

              {/* Translations */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-3">
                  <Globe size={12} />
                  {t('modal.translations')}
                </label>
                <div className="space-y-3">
                  {selectedAudio.translations.map(tr => (
                    <div
                      key={tr.locale}
                      className="p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {tr.locale === 'pt' ? '🇧🇷' : tr.locale === 'it' ? '🇮🇹' : '🇪🇸'}
                        </span>
                        <span className="text-xs text-gray-400 uppercase font-semibold">
                          {tr.locale === 'pt' ? 'Português' : tr.locale === 'it' ? 'Italiano' : 'Español'}
                        </span>
                      </div>
                      <p className="text-white font-medium">{tr.title}</p>
                      {tr.description && (
                        <p className="text-gray-400 text-sm mt-1">{tr.description}</p>
                      )}
                      {!tr.description && (
                        <p className="text-gray-600 text-sm mt-1 italic">{t('modal.noDescription')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-gray-700 sticky bottom-0 bg-gray-800">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {t('modal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
