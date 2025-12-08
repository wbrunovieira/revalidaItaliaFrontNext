// src/components/CreatePersonalSessionModal.tsx
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
  Calendar,
  FileText,
  X,
  Check,
  RotateCcw,
  Info,
  UserCheck,
  Search,
  Mail,
  Loader2,
} from 'lucide-react';

const personalSessionSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').nullable().default(''),
  studentId: z.string().min(1, 'Selecione um aluno'),
  scheduledStartTime: z.string().min(1, 'Data e hora de início são obrigatórias'),
  scheduledEndTime: z.string().min(1, 'Data e hora de término são obrigatórias'),
  // Settings
  recordingEnabled: z.boolean().default(true),
  waitingRoomEnabled: z.boolean().default(false),
  chatEnabled: z.boolean().default(true),
  autoStartRecording: z.boolean().default(true),
}).refine((data) => {
  if (!data.scheduledStartTime || !data.scheduledEndTime) return true;
  const start = new Date(data.scheduledStartTime);
  const end = new Date(data.scheduledEndTime);
  return end > start;
}, {
  message: "A data de término deve ser posterior à data de início",
  path: ["scheduledEndTime"],
}).refine((data) => {
  if (!data.scheduledStartTime || !data.scheduledEndTime) return true;
  const start = new Date(data.scheduledStartTime);
  const end = new Date(data.scheduledEndTime);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  return durationMinutes >= 15;
}, {
  message: "A duração mínima da sessão é de 15 minutos",
  path: ["scheduledEndTime"],
}).refine((data) => {
  if (!data.scheduledStartTime || !data.scheduledEndTime) return true;
  const start = new Date(data.scheduledStartTime);
  const end = new Date(data.scheduledEndTime);
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  return durationMinutes <= 480;
}, {
  message: "A duração máxima da sessão é de 8 horas",
  path: ["scheduledEndTime"],
});

interface CreatePersonalSessionModalProps {
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

export default function CreatePersonalSessionModal({
  open,
  onClose,
  onSuccess,
}: CreatePersonalSessionModalProps) {
  const t = useTranslations('Admin.CreatePersonalSession');
  const { toast } = useToast();
  const { token } = useAuth();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(false);

  // Student search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<z.input<typeof personalSessionSchema>>({
    resolver: zodResolver(personalSessionSchema),
    defaultValues: {
      title: '',
      description: '',
      studentId: '',
      scheduledStartTime: '',
      scheduledEndTime: '',
      recordingEnabled: true,
      waitingRoomEnabled: false,
      chatEnabled: true,
      autoStartRecording: true,
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

  const onSubmit = async (values: z.input<typeof personalSessionSchema>) => {
    try {
      setLoading(true);

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      const requestBody = {
        title: values.title,
        description: values.description || null,
        studentId: values.studentId,
        scheduledStartTime: new Date(values.scheduledStartTime).toISOString(),
        scheduledEndTime: new Date(values.scheduledEndTime).toISOString(),
        settings: {
          recordingEnabled: values.recordingEnabled,
          waitingRoomEnabled: values.waitingRoomEnabled,
          chatEnabled: values.chatEnabled,
          autoStartRecording: values.autoStartRecording,
        },
      };

      console.log('📤 Creating personal session with payload:', requestBody);

      const response = await fetch(`${API_URL}/api/v1/personal-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Personal session created successfully:', data);

        toast({
          title: t('success.title'),
          description: t('success.description', { studentName: selectedStudent?.name || '' }),
        });

        form.reset();
        setSelectedStudent(null);
        onClose();
        onSuccess?.();
      } else {
        const errorData = await response.json();
        console.error('❌ Error creating personal session:', errorData);

        throw {
          statusCode: response.status,
          message: errorData.detail || errorData.message,
          error: errorData.error,
        };
      }
    } catch (error: unknown) {
      console.error('❌ Error in onSubmit:', error);

      let errorMessage = t('errors.generic');

      if (error && typeof error === 'object' && 'statusCode' in error) {
        const apiError = error as { statusCode: number; message?: string };
        if (apiError.statusCode === 400) {
          errorMessage = apiError.message || t('errors.validation');
        } else if (apiError.statusCode === 403) {
          errorMessage = t('errors.forbidden');
        } else if (apiError.statusCode === 404) {
          errorMessage = t('errors.notFound');
        } else if (apiError.statusCode === 503) {
          errorMessage = t('errors.zoomError');
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
            <UserCheck size={24} className="text-secondary" />
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
              <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary/20 rounded-full">
                    <Info size={20} className="text-secondary" />
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

              {/* Student Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <User className="h-5 w-5 text-secondary" />
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
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-secondary transition-colors"
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
                                    <div className="p-2 bg-secondary/20 rounded-full flex-shrink-0">
                                      <User size={16} className="text-secondary" />
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
                    <div className="flex items-center justify-between p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/20 rounded-full">
                          <User size={18} className="text-secondary" />
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
                  </div>

                  {/* Schedule Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-300 mb-4">
                      <Calendar className="h-5 w-5 text-green-400" />
                      <h3 className="text-lg font-semibold">
                        {t('sections.schedule')}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="scheduledStartTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 flex items-center gap-2">
                              {t('fields.startTime.label')}
                              <span className="text-red-400">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                className="bg-gray-700 border-gray-600 text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="scheduledEndTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 flex items-center gap-2">
                              {t('fields.endTime.label')}
                              <span className="text-red-400">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="datetime-local"
                                className="bg-gray-700 border-gray-600 text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

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
                      disabled={loading}
                      className="bg-secondary hover:bg-secondary/80 text-primary-dark px-8 py-3"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <RotateCcw size={16} className="animate-spin" />
                          {t('actions.creating')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Check size={16} />
                          {t('actions.create')}
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
