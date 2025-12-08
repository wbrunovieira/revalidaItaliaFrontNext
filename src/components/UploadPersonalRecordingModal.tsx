// src/components/UploadPersonalRecordingModal.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Button from '@/components/Button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';
import {
  User,
  FileText,
  X,
  Check,
  RotateCcw,
  Info,
  UserCheck,
  Search,
  Mail,
  Loader2,
  Upload,
  FileVideo,
  HardDrive,
  AlertCircle,
} from 'lucide-react';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
];
const ACCEPTED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

const uploadRecordingSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres').max(200, 'Título muito longo (máx. 200 caracteres)'),
  description: z.string().max(1000, 'Descrição muito longa (máx. 1000 caracteres)').optional().default(''),
  studentId: z.string().min(1, 'Selecione um aluno'),
  recordedAt: z.string().optional(),
});

interface UploadPersonalRecordingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface StudentSearchResult {
  id: string;
  name: string;
  email: string;
  nationalId?: string;
  profileImageUrl?: string;
}

export default function UploadPersonalRecordingModal({
  open,
  onClose,
  onSuccess,
}: UploadPersonalRecordingModalProps) {
  const t = useTranslations('Admin.UploadPersonalRecording');
  const { toast } = useToast();
  const { token } = useAuth();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Student search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<z.input<typeof uploadRecordingSchema>>({
    resolver: zodResolver(uploadRecordingSchema),
    defaultValues: {
      title: '',
      description: '',
      studentId: '',
      recordedAt: '',
    },
  });

  // Search students
  const searchStudents = useCallback(async (query: string) => {
    if (!token || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const params = new URLSearchParams({
        name: query,
        pageSize: '10',
      });

      const response = await fetch(`${apiUrl}/api/v1/users/search?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search students');
      }

      const data = await response.json();
      // Filter only students
      const students = (data.users || []).filter(
        (user: StudentSearchResult & { role?: string }) => user.role === 'student'
      );
      setSearchResults(students);
    } catch (err) {
      console.error('Error searching students:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [token]);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        searchStudents(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery, searchStudents]);

  // Select student
  const handleSelectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student);
    form.setValue('studentId', student.id);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  // Clear selected student
  const handleClearStudent = () => {
    setSelectedStudent(null);
    form.setValue('studentId', '');
  };

  // File validation
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(extension)) {
        return t('errors.invalidFileType');
      }
    }
    if (file.size > MAX_FILE_SIZE) {
      return t('errors.fileTooLarge');
    }
    return null;
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
    } else {
      setFileError(null);
      setSelectedFile(file);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const onSubmit = async (values: z.input<typeof uploadRecordingSchema>) => {
    if (!selectedFile) {
      setFileError(t('errors.noFile'));
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const formData = new FormData();
      formData.append('videoFile', selectedFile);
      formData.append('studentId', values.studentId);
      formData.append('title', values.title);

      if (values.description) {
        formData.append('description', values.description);
      }

      if (values.recordedAt) {
        formData.append('recordedAt', new Date(values.recordedAt).toISOString());
      }

      // Use XMLHttpRequest for upload progress
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ success: true, data });
            } catch {
              resolve({ success: true });
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject({ statusCode: xhr.status, message: errorData.detail || errorData.message });
            } catch {
              reject({ statusCode: xhr.status, message: 'Upload failed' });
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject({ statusCode: 0, message: 'Network error' });
        });

        xhr.addEventListener('abort', () => {
          reject({ statusCode: 0, message: 'Upload cancelled' });
        });

        xhr.open('POST', `${API_URL}/api/v1/personal-recordings/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      await uploadPromise;

      toast({
        title: t('success.title'),
        description: t('success.description', { studentName: selectedStudent?.name || '' }),
      });

      form.reset();
      setSelectedStudent(null);
      setSelectedFile(null);
      setUploadProgress(0);
      onClose();
      onSuccess?.();
    } catch (error: unknown) {
      console.error('❌ Error uploading recording:', error);

      let errorMessage = t('errors.generic');

      if (error && typeof error === 'object' && 'statusCode' in error) {
        const apiError = error as { statusCode: number; message?: string };
        if (apiError.statusCode === 400) {
          errorMessage = apiError.message || t('errors.validation');
        } else if (apiError.statusCode === 403) {
          errorMessage = t('errors.forbidden');
        } else if (apiError.statusCode === 404) {
          errorMessage = t('errors.notFound');
        } else if (apiError.statusCode === 413) {
          errorMessage = t('errors.fileTooLarge');
        }
      }

      toast({
        title: t('errors.title'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      form.reset();
      setSelectedStudent(null);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedFile(null);
      setFileError(null);
      setUploadProgress(0);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Upload size={24} className="text-purple-400" />
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Info Card */}
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-full">
                    <Info size={20} className="text-purple-400" />
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

              {/* File Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <FileVideo className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">
                    {t('sections.video')}
                  </h3>
                </div>

                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragging
                      ? 'border-purple-500 bg-purple-500/10'
                      : selectedFile
                      ? 'border-green-500/50 bg-green-500/5'
                      : fileError
                      ? 'border-red-500/50 bg-red-500/5'
                      : 'border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/5'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.join(',')}
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={loading}
                  />

                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <Check size={24} />
                        <span className="font-semibold">{t('fileSelected')}</span>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-gray-300">
                        <span className="truncate max-w-xs">{selectedFile.name}</span>
                        <span className="flex items-center gap-1 text-sm text-gray-400">
                          <HardDrive size={14} />
                          {formatFileSize(selectedFile.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFileError(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        disabled={loading}
                        className="text-sm text-gray-400 hover:text-white underline"
                      >
                        {t('changeFile')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload size={48} className={`mx-auto ${isDragging ? 'text-purple-400' : 'text-gray-500'}`} />
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          className="text-purple-400 hover:text-purple-300 font-semibold"
                        >
                          {t('selectFile')}
                        </button>
                        <span className="text-gray-400"> {t('orDragDrop')}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {t('supportedFormats')}: MP4, MOV, AVI, MKV, WebM
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('maxSize')}: 500MB
                      </p>
                    </div>
                  )}
                </div>

                {fileError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {fileError}
                  </div>
                )}
              </div>

              {/* Student Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <User className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">
                    {t('sections.student')}
                  </h3>
                </div>

                <div className="space-y-3">
                  <FormLabel className="text-gray-300 flex items-center gap-2">
                    {t('fields.student.label')}
                    <span className="text-red-400">*</span>
                  </FormLabel>

                  {!selectedStudent ? (
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => {
                          setSearchQuery(e.target.value);
                          setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                        placeholder={t('fields.student.placeholder')}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                      />

                      {/* Search Results Dropdown */}
                      {showResults && (searchQuery.length >= 2 || isSearching) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto">
                          {isSearching ? (
                            <div className="flex items-center justify-center gap-2 p-4 text-gray-400">
                              <Loader2 size={16} className="animate-spin" />
                              {t('fields.student.searching')}
                            </div>
                          ) : searchResults.length > 0 ? (
                            <ul>
                              {searchResults.map(student => (
                                <li key={student.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectStudent(student)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-600 transition-colors text-left"
                                  >
                                    <div className="p-2 bg-purple-500/20 rounded-full flex-shrink-0">
                                      <User size={16} className="text-purple-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-white font-medium truncate">
                                        {student.name}
                                      </p>
                                      <p className="text-sm text-gray-400 truncate flex items-center gap-1">
                                        <Mail size={12} />
                                        {student.email}
                                      </p>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : searchQuery.length >= 2 ? (
                            <div className="p-4 text-center text-gray-400">
                              {t('fields.student.noResults')}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {searchQuery.length > 0 && searchQuery.length < 2 && (
                        <p className="mt-2 text-xs text-gray-500">{t('fields.student.minChars')}</p>
                      )}
                    </div>
                  ) : (
                    /* Selected Student Card */
                    <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-full">
                          <User size={18} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">{selectedStudent.name}</p>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Mail size={12} />
                            {selectedStudent.email}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearStudent}
                        disabled={loading}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                        title={t('fields.student.change')}
                      >
                        <X size={18} className="text-gray-400" />
                      </button>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="studentId"
                    render={() => (
                      <FormItem className="hidden">
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Show rest of form only after student is selected */}
              {selectedStudent && (
                <>
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300 mb-4">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <h3 className="text-lg font-semibold">
                        {t('sections.basicInfo')}
                      </h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 flex items-center gap-2">
                            {t('fields.title.label')}
                            <span className="text-red-400">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('fields.title.placeholder')}
                              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            {t('fields.title.helper')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">
                            {t('fields.description.label')}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('fields.description.placeholder')}
                              rows={3}
                              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            {t('fields.description.helper')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recordedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">
                            {t('fields.recordedAt.label')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              className="bg-gray-700 border-gray-600 text-white"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-gray-400">
                            {t('fields.recordedAt.helper')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Upload Progress */}
                  {loading && uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{t('uploading')}</span>
                        <span className="text-purple-400 font-semibold">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="px-6 py-2 text-gray-300 bg-transparent border border-gray-600 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      {t('actions.cancel')}
                    </button>
                    <Button
                      type="submit"
                      disabled={loading || !selectedFile}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <RotateCcw size={16} className="animate-spin" />
                          {t('actions.uploading')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Check size={16} />
                          {t('actions.upload')}
                        </div>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Message when no student selected */}
              {!selectedStudent && (
                <div className="text-center py-8 text-gray-400">
                  <UserCheck size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{t('selectStudentFirst')}</p>
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
