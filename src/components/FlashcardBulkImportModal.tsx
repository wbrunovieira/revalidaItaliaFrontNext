// /src/components/FlashcardBulkImportModal.tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Upload,
  FileText,
  Check,
  X,
  AlertCircle,
  Loader2,
  Download,
  Eye,
  BookOpen,
  Tag,
} from 'lucide-react';

interface FlashcardBulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Argument {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  translations: Array<{
    locale: string;
    title: string;
  }>;
}

interface Module {
  id: string;
  order: number;
  translations: Array<{
    locale: string;
    title: string;
  }>;
  lessons?: Lesson[];
}

interface Course {
  id: string;
  slug: string;
  translations: Array<{
    locale: string;
    title: string;
  }>;
  modules?: Module[];
}

interface FlashcardTag {
  id: string;
  name: string;
}

interface BulkImportResponse {
  success: boolean;
  data: {
    batchId: string;
    summary: {
      totalLines: number;
      totalCreated: number;
      totalSkipped: number;
      argumentId: string;
      argumentName: string;
      lessonIds?: string[];
      tagIds?: string[];
    };
    flashcards: Array<{
      id: string;
      slug: string;
      question: string;
      answer: string;
    }>;
    errors: Array<{
      line: number;
      error: string;
      content: string;
    }>;
  };
}

type Step = 'upload' | 'processing' | 'result';
type SeparatorType = 'TAB' | 'PIPE' | 'COLON';

export default function FlashcardBulkImportModal({
  open,
  onOpenChange,
  onSuccess,
}: FlashcardBulkImportModalProps) {
  const t = useTranslations('Admin.flashcards.bulkImport');
  const { toast } = useToast();

  // State
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string[]>([]);
  const [lineCount, setLineCount] = useState<number>(0);

  const [argumentId, setArgumentId] = useState<string>('');
  const [separator, setSeparator] = useState<SeparatorType>('TAB');
  const [courseId, setCourseId] = useState<string>('');
  const [moduleId, setModuleId] = useState<string>('');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Data
  const [availableArguments, setAvailableArguments] = useState<Argument[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tags, setTags] = useState<FlashcardTag[]>([]);

  // Loading
  const [loading, setLoading] = useState(false);
  const [loadingArguments, setLoadingArguments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  // Result
  const [result, setResult] = useState<BulkImportResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Arguments
  const fetchArguments = useCallback(async () => {
    setLoadingArguments(true);
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/arguments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableArguments(data.arguments || []);
      }
    } catch (error) {
      console.error('Error fetching arguments:', error);
    } finally {
      setLoadingArguments(false);
    }
  }, []);

  // Fetch Lessons for a specific module
  const fetchLessonsForModule = useCallback(
    async (courseId: string, moduleId: string): Promise<Lesson[]> => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules/${moduleId}/lessons?limit=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          return [];
        }

        const lessonsData = await response.json();
        return lessonsData.lessons || [];
      } catch (error) {
        console.error('Error fetching lessons:', error);
        return [];
      }
    },
    []
  );

  // Fetch Modules for a specific course
  const fetchModulesForCourse = useCallback(
    async (courseId: string): Promise<Module[]> => {
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          return [];
        }

        const modules: Module[] = await response.json();

        // Buscar aulas para cada módulo
        const modulesWithLessons = await Promise.all(
          modules.map(async (module) => {
            const lessons = await fetchLessonsForModule(courseId, module.id);
            return { ...module, lessons };
          })
        );

        return modulesWithLessons;
      } catch (error) {
        console.error('Error fetching modules:', error);
        return [];
      }
    },
    [fetchLessonsForModule]
  );

  // Fetch Courses with all modules and lessons
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const coursesData: Course[] = await response.json();

      // Buscar módulos e aulas para cada curso
      const coursesWithData = await Promise.all(
        coursesData.map(async (course) => {
          const modules = await fetchModulesForCourse(course.id);
          return { ...course, modules };
        })
      );

      setCourses(coursesWithData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: t('errors.fetchCourses'),
        description: t('errors.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setLoadingCourses(false);
    }
  }, [toast, t, fetchModulesForCourse]);

  // Fetch Tags
  const fetchTags = useCallback(async () => {
    setLoadingTags(true);
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcard-tags`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Tags API response:', data);
        // API retorna objeto com propriedade flashcardTags
        const tagsData = data.flashcardTags || [];
        console.log('Tags data:', tagsData);
        setTags(tagsData);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoadingTags(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (open) {
      fetchArguments();
      fetchCourses();
      fetchTags();
    }
  }, [open, fetchArguments, fetchCourses, fetchTags]);

  // Reset dependent fields when course changes
  useEffect(() => {
    if (courseId) {
      setModuleId('');
      setSelectedLessonIds([]);
    }
  }, [courseId]);

  // Reset lessons when module changes
  useEffect(() => {
    if (moduleId) {
      setSelectedLessonIds([]);
    }
  }, [moduleId]);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      // Validate file type
      if (!selectedFile.name.endsWith('.txt')) {
        toast({
          title: t('errors.invalidFileType'),
          description: t('errors.onlyTxtAllowed'),
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: t('errors.fileTooLarge'),
          description: t('errors.maxSize5MB'),
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);

      // Read file and generate preview
      try {
        const text = await selectedFile.text();

        // Check if file is RTF format
        if (text.startsWith('{\\rtf')) {
          toast({
            title: t('errors.rtfNotAllowed'),
            description: t('errors.usePlainText'),
            variant: 'destructive',
          });
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        const lines = text.split('\n').filter((line) => line.trim() !== '');

        setLineCount(lines.length);
        setFilePreview(lines.slice(0, 5));

        // Warn if too many lines
        if (lines.length > 1000) {
          toast({
            title: t('warnings.tooManyLines'),
            description: t('warnings.max1000Lines', { count: lines.length }),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error reading file:', error);
        toast({
          title: t('errors.readError'),
          description: t('errors.couldNotReadFile'),
          variant: 'destructive',
        });
      }
    },
    [toast, t]
  );

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!file || !argumentId) {
      toast({
        title: t('errors.requiredFields'),
        description: t('errors.fileAndArgumentRequired'),
        variant: 'destructive',
      });
      return;
    }

    setStep('processing');
    setLoading(true);

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('token='))
        ?.split('=')[1];

      const formData = new FormData();
      formData.append('file', file);
      formData.append('argumentId', argumentId);
      formData.append('separator', separator);

      if (selectedLessonIds.length > 0) {
        formData.append('lessonIds', JSON.stringify(selectedLessonIds));
      }

      if (selectedTagIds.length > 0) {
        formData.append('tagIds', JSON.stringify(selectedTagIds));
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/flashcards/bulk`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setStep('result');

        if (data.data.summary.totalSkipped === 0) {
          toast({
            title: t('success.allCreated'),
            description: t('success.created', {
              count: data.data.summary.totalCreated,
            }),
          });
        } else {
          toast({
            title: t('success.partialCreated'),
            description: t('success.partialCreatedDesc', {
              created: data.data.summary.totalCreated,
              total: data.data.summary.totalLines,
            }),
            variant: 'default',
          });
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: t('errors.uploadFailed'),
          description: data.message || t('errors.unknownError'),
          variant: 'destructive',
        });
        setStep('upload');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: t('errors.uploadFailed'),
        description: t('errors.networkError'),
        variant: 'destructive',
      });
      setStep('upload');
    } finally {
      setLoading(false);
    }
  }, [
    file,
    argumentId,
    separator,
    selectedLessonIds,
    selectedTagIds,
    toast,
    t,
    onSuccess,
  ]);

  // Reset modal
  const handleReset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setFilePreview([]);
    setLineCount(0);
    setArgumentId('');
    setSeparator('TAB');
    setCourseId('');
    setModuleId('');
    setSelectedLessonIds([]);
    setSelectedTagIds([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    handleReset();
    onOpenChange(false);
  }, [handleReset, onOpenChange]);

  // Download error report
  const handleDownloadErrorReport = useCallback(() => {
    if (!result || result.data.errors.length === 0) return;

    const errorText = result.data.errors
      .map(
        (err) =>
          `Linha ${err.line}: ${err.error}\n${err.content}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([errorText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-errors-${result.data.batchId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  // Filter modules and lessons based on selection (like CreateVideoForm)
  const selectedCourse = courses.find((course) => course.id === courseId);
  const availableModules = selectedCourse?.modules || [];
  const selectedModule = availableModules.find(
    (module) => module.id === moduleId
  );
  const availableLessons = selectedModule?.lessons || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-secondary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file" className="text-white">
                {t('fields.file')} *
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  file
                    ? 'border-secondary bg-secondary/10'
                    : 'border-gray-600 hover:border-secondary hover:bg-gray-700/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  accept=".txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 text-secondary mx-auto" />
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-gray-400 text-sm">
                      {(file.size / 1024).toFixed(2)} KB • {lineCount}{' '}
                      {t('fields.lines')}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setFilePreview([]);
                        setLineCount(0);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('actions.remove')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="text-white">{t('fields.clickToUpload')}</p>
                    <p className="text-gray-400 text-sm">
                      {t('fields.txtOnly')} • {t('fields.max5MB')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* File Preview */}
            {filePreview.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {t('fields.preview')}
                </Label>
                <div className="bg-gray-900 rounded-lg p-4 space-y-1 font-mono text-sm max-h-40 overflow-y-auto border border-gray-700">
                  {filePreview.map((line, index) => (
                    <div key={index} className="text-gray-300">
                      <span className="text-gray-500 mr-2">{index + 1}.</span>
                      {line}
                    </div>
                  ))}
                  {lineCount > 5 && (
                    <div className="text-gray-500 italic">
                      ... +{lineCount - 5} {t('fields.moreLines')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Argument Selection */}
            <div className="space-y-2">
              <Label htmlFor="argument" className="text-white">
                {t('fields.argument')} *
              </Label>
              <Select value={argumentId} onValueChange={setArgumentId}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder={t('fields.selectArgument')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {loadingArguments ? (
                    <SelectItem value="loading" disabled>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      {t('fields.loading')}
                    </SelectItem>
                  ) : (
                    availableArguments.map((arg) => (
                      <SelectItem
                        key={arg.id}
                        value={arg.id}
                        className="text-white hover:bg-gray-700"
                      >
                        {arg.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Separator Selection */}
            <div className="space-y-2">
              <Label className="text-white">{t('fields.separator')}</Label>
              <RadioGroup value={separator} onValueChange={(value) => setSeparator(value as SeparatorType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="TAB" id="sep-tab" />
                  <Label htmlFor="sep-tab" className="text-white font-normal cursor-pointer">
                    TAB ({t('fields.recommended')})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PIPE" id="sep-pipe" />
                  <Label htmlFor="sep-pipe" className="text-white font-normal cursor-pointer">
                    PIPE (|)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COLON" id="sep-colon" />
                  <Label htmlFor="sep-colon" className="text-white font-normal cursor-pointer">
                    COLON (:)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Optional: Course -> Module -> Lessons */}
            <div className="border-t border-gray-700 pt-4 space-y-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" />
                {t('fields.associateWithLessons')} ({t('fields.optional')})
              </h3>

              {/* Course */}
              <div className="space-y-2">
                <Label htmlFor="course" className="text-white">
                  {t('fields.course')}
                </Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder={t('fields.selectCourse')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {loadingCourses ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        {t('fields.loading')}
                      </SelectItem>
                    ) : (
                      courses.map((course) => (
                        <SelectItem
                          key={course.id}
                          value={course.id}
                          className="text-white hover:bg-gray-700"
                        >
                          {course.translations[0]?.title || course.slug}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Module */}
              {courseId && (
                <div className="space-y-2">
                  <Label htmlFor="module" className="text-white">
                    {t('fields.module')}
                  </Label>
                  <Select value={moduleId} onValueChange={setModuleId}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder={t('fields.selectModule')} />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {availableModules.map((module) => (
                        <SelectItem
                          key={module.id}
                          value={module.id}
                          className="text-white hover:bg-gray-700"
                        >
                          {module.translations[0]?.title || `Module ${module.order}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Lessons */}
              {moduleId && (
                <div className="space-y-2">
                  <Label className="text-white">
                    {t('fields.lessons')}
                  </Label>
                  <div className="bg-gray-900 rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto border border-gray-700">
                    {availableLessons.length === 0 ? (
                      <div className="text-center text-gray-400">
                        {t('fields.noLessons')}
                      </div>
                    ) : (
                      availableLessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`lesson-${lesson.id}`}
                            checked={selectedLessonIds.includes(lesson.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLessonIds([...selectedLessonIds, lesson.id]);
                              } else {
                                setSelectedLessonIds(
                                  selectedLessonIds.filter((id) => id !== lesson.id)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`lesson-${lesson.id}`}
                            className="text-white font-normal cursor-pointer"
                          >
                            {lesson.translations[0]?.title || `Lesson ${lesson.order}`}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Optional: Tags */}
            <div className="border-t border-gray-700 pt-4 space-y-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Tag className="w-5 h-5 text-secondary" />
                {t('fields.tags')} ({t('fields.optional')})
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto border border-gray-700">
                {loadingTags ? (
                  <div className="text-center text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    {t('fields.loading')}
                  </div>
                ) : tags.length === 0 ? (
                  <div className="text-center text-gray-400">
                    {t('fields.noTags')}
                  </div>
                ) : (
                  tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTagIds([...selectedTagIds, tag.id]);
                          } else {
                            setSelectedTagIds(
                              selectedTagIds.filter((id) => id !== tag.id)
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`tag-${tag.id}`}
                        className="text-white font-normal cursor-pointer"
                      >
                        {tag.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-16 h-16 text-secondary animate-spin" />
            <p className="text-white text-lg font-medium">
              {t('processing.title')}
            </p>
            <p className="text-gray-400 text-sm">
              {t('processing.description')}
            </p>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && result && (
          <div className="space-y-6 py-4">
            {/* Summary */}
            <div
              className={`rounded-lg p-6 border ${
                result.data.summary.totalSkipped === 0
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-yellow-900/20 border-yellow-500/30'
              }`}
            >
              <div className="flex items-start gap-4">
                {result.data.summary.totalSkipped === 0 ? (
                  <Check className="w-8 h-8 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3
                    className={`text-lg font-bold mb-2 ${
                      result.data.summary.totalSkipped === 0
                        ? 'text-green-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {result.data.summary.totalSkipped === 0
                      ? t('result.allCreatedTitle')
                      : t('result.partialCreatedTitle')}
                  </h3>
                  <div className="space-y-1 text-white">
                    <p>
                      {t('result.totalCreated')}:{' '}
                      <span className="font-bold">
                        {result.data.summary.totalCreated}
                      </span>
                    </p>
                    <p>
                      {t('result.totalLines')}:{' '}
                      <span className="font-bold">
                        {result.data.summary.totalLines}
                      </span>
                    </p>
                    {result.data.summary.totalSkipped > 0 && (
                      <p className="text-yellow-400">
                        {t('result.totalSkipped')}:{' '}
                        <span className="font-bold">
                          {result.data.summary.totalSkipped}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {result.data.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-medium">
                    {t('result.errors')} ({result.data.errors.length})
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrorReport}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('actions.downloadReport')}
                  </Button>
                </div>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                  {result.data.errors.map((error, index) => (
                    <div
                      key={index}
                      className="border-l-2 border-red-500 pl-3 space-y-1"
                    >
                      <p className="text-red-400 text-sm font-medium">
                        {t('result.line')} {error.line}: {error.error}
                      </p>
                      <p className="text-gray-400 text-xs font-mono">
                        {error.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Created Flashcards Preview */}
            {result.data.flashcards.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white font-medium">
                  {t('result.createdFlashcards')} ({result.data.flashcards.length})
                </Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.data.flashcards.slice(0, 3).map((flashcard) => (
                    <div
                      key={flashcard.id}
                      className="bg-gray-900 rounded-lg p-3 border border-gray-700"
                    >
                      <p className="text-white font-medium mb-1">
                        {flashcard.question}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {flashcard.answer}
                      </p>
                    </div>
                  ))}
                  {result.data.flashcards.length > 3 && (
                    <p className="text-center text-gray-500 text-sm">
                      ... +{result.data.flashcards.length - 3}{' '}
                      {t('result.moreFlashcards')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('actions.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!file || !argumentId || loading}
                className="bg-secondary hover:bg-secondary/90 text-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('actions.uploading')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('actions.upload')}
                  </>
                )}
              </Button>
            </>
          )}
          {step === 'result' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('actions.close')}
              </Button>
              <Button
                onClick={handleReset}
                className="bg-secondary hover:bg-secondary/90 text-primary"
              >
                {t('actions.importAnother')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
