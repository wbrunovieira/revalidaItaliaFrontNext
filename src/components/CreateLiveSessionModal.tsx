// src/components/CreateLiveSessionModal.tsx
'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Button from '@/components/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth.store';
import { 
  Users, 
  Calendar, 
  BookOpen,
  FileText,
  Settings,
  X,
  Check,
  RotateCcw,
  Info,
  Radio
} from 'lucide-react';

const liveSessionSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().max(5000, 'Descrição muito longa').default(''),
  sessionType: z.enum(['MEETING', 'WEBINAR']),
  scheduledStartTime: z.string().min(1, 'Data e hora de início são obrigatórias'),
  scheduledEndTime: z.string().min(1, 'Data e hora de término são obrigatórias'),
  
  // Optional lesson association
  courseId: z.string().default(''),
  moduleId: z.string().default(''),
  lessonId: z.string().default(''),
  
  // Optional argument association
  argumentId: z.string().default(''),
  
  // Co-hosts
  coHostIds: z.array(z.string()).default([]),
  
  // Settings
  maxParticipants: z.number().min(1).max(1000).default(100),
  recordingEnabled: z.boolean().default(false),
  waitingRoomEnabled: z.boolean().default(true),
  chatEnabled: z.boolean().default(true),
  qnaEnabled: z.boolean().default(false),
  autoStartRecording: z.boolean().default(false),
  muteParticipantsOnEntry: z.boolean().default(true),
  allowParticipantsUnmute: z.boolean().default(false),
  allowRaiseHand: z.boolean().default(true),
  allowParticipantScreenShare: z.boolean().default(false),
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
}).refine((data) => {
  if (data.autoStartRecording && !data.recordingEnabled) {
    return false;
  }
  return true;
}, {
  message: "Para auto-iniciar gravação, a gravação deve estar habilitada",
  path: ["autoStartRecording"],
});

interface CreateLiveSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Course {
  id: string;
  slug: string;
  translations: Array<{
    locale: string;
    title: string;
  }>;
}

interface Module {
  id: string;
  slug: string;
  translations: Array<{
    locale: string;
    title: string;
  }>;
}

interface Lesson {
  id: string;
  slug: string;
  translations: Array<{
    locale: string;
    title: string;
  }>;
}

interface Argument {
  id: string;
  title: string;
}

interface User {
  id?: string;
  identityId: string;
  fullName: string;
  email: string;
  role: string;
}

export default function CreateLiveSessionModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateLiveSessionModalProps) {
  const t = useTranslations('Admin.CreateLiveSession');
  const { toast } = useToast();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [argumentsList, setArgumentsList] = useState<Argument[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [, setLoadingCourses] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingArguments, setLoadingArguments] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const form = useForm<z.input<typeof liveSessionSchema>>({
    resolver: zodResolver(liveSessionSchema),
    defaultValues: {
      title: '',
      description: '',
      sessionType: 'WEBINAR',
      scheduledStartTime: '',
      scheduledEndTime: '',
      maxParticipants: 100,
      recordingEnabled: false,
      waitingRoomEnabled: true,
      chatEnabled: true,
      qnaEnabled: false,
      autoStartRecording: false,
      muteParticipantsOnEntry: true,
      allowParticipantsUnmute: false,
      allowRaiseHand: true,
      allowParticipantScreenShare: false,
      coHostIds: [],
    },
  });

  const selectedCourseId = form.watch('courseId');
  const selectedModuleId = form.watch('moduleId');

  // Load initial data
  useEffect(() => {
    if (open) {
      fetchCourses();
      fetchArguments();
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load modules when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      fetchModules(selectedCourseId);
      // Reset module and lesson when course changes
      form.setValue('moduleId', '');
      form.setValue('lessonId', '');
      setLessons([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  // Load lessons when module is selected
  useEffect(() => {
    if (selectedModuleId && selectedCourseId) {
      fetchLessons(selectedCourseId, selectedModuleId);
      // Reset lesson when module changes
      form.setValue('lessonId', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId, selectedCourseId]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/v1/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchModules = async (courseId: string) => {
    setLoadingModules(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/v1/courses/${courseId}/modules`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || data || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoadingModules(false);
    }
  };

  const fetchLessons = async (courseId: string, moduleId: string) => {
    setLoadingLessons(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/v1/courses/${courseId}/modules/${moduleId}/lessons`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons || data || []);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoadingLessons(false);
    }
  };

  const fetchArguments = async () => {
    setLoadingArguments(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/v1/arguments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setArgumentsList(data.arguments || data || []);
      }
    } catch (error) {
      console.error('Error fetching arguments:', error);
    } finally {
      setLoadingArguments(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      // Remove role parameter as backend returns 400 Bad Request with it
      const response = await fetch(`${API_URL}/api/v1/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // API returns users in data.items
        const usersList: User[] = data.items || [];
        
        // Temporarily allow all users as co-hosts since there are no tutors/admins in the system
        // TODO: Revert this when tutors/admins are added to the database
        // const tutors = usersList.filter((user: User) => 
        //   user.role === 'tutor' || user.role === 'admin'
        // );
        setUsers(usersList); // Using all users for now
      } else {
        console.warn('Failed to fetch users, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const onSubmit = async (values: z.input<typeof liveSessionSchema>) => {
    try {
      setLoading(true);
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      // Prepare the request body
      const requestBody: Record<string, unknown> = {
        title: values.title,
        description: values.description,
        sessionType: values.sessionType,
        scheduledStartTime: new Date(values.scheduledStartTime).toISOString(),
        scheduledEndTime: new Date(values.scheduledEndTime).toISOString(),
        settings: {
          maxParticipants: values.maxParticipants,
          recordingEnabled: values.recordingEnabled,
          waitingRoomEnabled: values.waitingRoomEnabled,
          chatEnabled: values.chatEnabled,
          qnaEnabled: values.qnaEnabled,
          autoStartRecording: values.autoStartRecording,
          muteParticipantsOnEntry: values.muteParticipantsOnEntry,
          allowParticipantsUnmute: values.allowParticipantsUnmute,
          allowRaiseHand: values.allowRaiseHand,
          allowParticipantScreenShare: values.allowParticipantScreenShare,
        },
      };

      // Add optional fields
      if (values.lessonId) {
        requestBody.lessonId = values.lessonId;
      }
      if (values.argumentId) {
        requestBody.argumentId = values.argumentId;
      }
      if (values.coHostIds && values.coHostIds.length > 0) {
        requestBody.coHostIds = values.coHostIds;
      }

      console.log('📤 Creating live session with payload:', requestBody);

      const response = await fetch(`${API_URL}/api/v1/live-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Live session created successfully:', data);
        console.log('📊 Live session details:', {
          sessionId: data.sessionId,
          title: data.title,
          zoomMeetingId: data.zoomMeetingId,
          hostJoinUrl: data.hostJoinUrl,
          participantJoinUrl: data.participantJoinUrl,
          status: data.status,
          scheduledStartTime: data.scheduledStartTime,
          scheduledEndTime: data.scheduledEndTime,
        });
        
        toast({
          title: t('success.title'),
          description: t('success.description'),
        });
        
        form.reset();
        onOpenChange(false);
        onSuccess?.();
      } else {
        console.error('❌ Error creating live session:', data);
        throw new Error(data.detail || data.message || t('error.createFailed'));
      }
    } catch (error) {
      console.error('❌ Error in onSubmit:', error);
      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      form.reset();
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Radio size={24} className="text-purple-400" />
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
                  name="sessionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 flex items-center gap-2">
                        {t('fields.sessionType.label')}
                        <span className="text-red-400">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder={t('fields.sessionType.placeholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="WEBINAR" className="text-white hover:bg-gray-600">
                            {t('fields.sessionType.options.webinar')}
                          </SelectItem>
                          <SelectItem value="MEETING" className="text-white hover:bg-gray-600">
                            {t('fields.sessionType.options.meeting')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-gray-400">
                        {t('fields.sessionType.helper')}
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

              {/* Optional Associations Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <BookOpen className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-semibold">
                    {t('sections.associations')}
                  </h3>
                </div>
                
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600 space-y-4">
                  <p className="text-sm text-gray-400">{t('associations.helper')}</p>
                  
                  {/* Course -> Module -> Lesson selection */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">
                            {t('fields.course.label')}
                          </FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} value={field.value || 'none'}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                <SelectValue placeholder={t('fields.course.placeholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="none" className="text-gray-400 hover:bg-gray-600">
                                {t('fields.course.none')}
                              </SelectItem>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id} className="text-white hover:bg-gray-600">
                                  {course.translations.find(t => t.locale === 'pt')?.title || course.slug}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedCourseId && (
                      <FormField
                        control={form.control}
                        name="moduleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              {t('fields.module.label')}
                            </FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} value={field.value || 'none'}>
                              <FormControl>
                                <SelectTrigger disabled={loadingModules} className="bg-gray-700 border-gray-600 text-white">
                                  <SelectValue placeholder={t('fields.module.placeholder')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="none" className="text-gray-400 hover:bg-gray-600">
                                  {t('fields.module.none')}
                                </SelectItem>
                                {modules.map((module) => (
                                  <SelectItem key={module.id} value={module.id} className="text-white hover:bg-gray-600">
                                    {module.translations.find(t => t.locale === 'pt')?.title || module.slug}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedModuleId && (
                      <FormField
                        control={form.control}
                        name="lessonId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              {t('fields.lesson.label')}
                            </FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} value={field.value || 'none'}>
                              <FormControl>
                                <SelectTrigger disabled={loadingLessons} className="bg-gray-700 border-gray-600 text-white">
                                  <SelectValue placeholder={t('fields.lesson.placeholder')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-700 border-gray-600">
                                <SelectItem value="none" className="text-gray-400 hover:bg-gray-600">
                                  {t('fields.lesson.none')}
                                </SelectItem>
                                {lessons.map((lesson) => (
                                  <SelectItem key={lesson.id} value={lesson.id} className="text-white hover:bg-gray-600">
                                    {lesson.translations.find(t => t.locale === 'pt')?.title || lesson.slug}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{t('associations.or')}</span>
                  </div>

                  {/* Argument selection */}
                  <FormField
                    control={form.control}
                    name="argumentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">
                          {t('fields.argument.label')}
                        </FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} value={field.value || 'none'}>
                          <FormControl>
                            <SelectTrigger disabled={loadingArguments} className="bg-gray-700 border-gray-600 text-white">
                              <SelectValue placeholder={t('fields.argument.placeholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="none" className="text-gray-400 hover:bg-gray-600">
                              {t('fields.argument.none')}
                            </SelectItem>
                            {argumentsList.map((argument) => (
                              <SelectItem key={argument.id} value={argument.id} className="text-white hover:bg-gray-600">
                                {argument.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-gray-400">
                          {t('fields.argument.helper')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Co-hosts Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <Users className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold">
                    {t('sections.hosts')}
                  </h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="coHostIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">
                        {t('fields.coHosts.label')}
                      </FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={(value) => {
                            const currentValues = field.value || [];
                            if (!currentValues.includes(value)) {
                              field.onChange([...currentValues, value]);
                            }
                          }}
                        >
                          <SelectTrigger disabled={loadingUsers} className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder={t('fields.coHosts.placeholder')} />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {users.length === 0 ? (
                              <div className="px-3 py-2 text-gray-400 text-sm">
                                {t('fields.coHosts.noUsers')}
                              </div>
                            ) : (
                              users.map((user) => (
                                <SelectItem 
                                  key={user.id || user.identityId} 
                                  value={user.id || user.identityId}
                                  disabled={field.value?.includes(user.id || user.identityId)}
                                  className="text-white hover:bg-gray-600 disabled:opacity-50"
                                >
                                  {user.fullName} ({user.email})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription className="text-gray-400">
                        {t('fields.coHosts.helper')}
                      </FormDescription>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((userId) => {
                            const user = users.find(u => (u.id || u.identityId) === userId);
                            return user ? (
                              <div 
                                key={userId}
                                className="bg-cyan-500/20 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-cyan-500/30"
                              >
                                <span className="text-white">{user.fullName}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(field.value?.filter(id => id !== userId));
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  ×
                                </button>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Settings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <Settings className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold">
                    {t('sections.settings')}
                  </h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">
                        {t('fields.maxParticipants.label')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={1000}
                          className="bg-gray-700 border-gray-600 text-white"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-gray-400">
                        {t('fields.maxParticipants.helper')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recordingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 p-3 bg-gray-700/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-300 text-sm">
                            {t('fields.recordingEnabled.label')}
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            {t('fields.recordingEnabled.helper')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoStartRecording"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 p-3 bg-gray-700/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-300 text-sm">
                            {t('fields.autoStartRecording.label')}
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            {t('fields.autoStartRecording.helper')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!form.watch('recordingEnabled')}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="waitingRoomEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 p-3 bg-gray-700/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-300 text-sm">
                            {t('fields.waitingRoomEnabled.label')}
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            {t('fields.waitingRoomEnabled.helper')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chatEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 p-3 bg-gray-700/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-300 text-sm">
                            {t('fields.chatEnabled.label')}
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            {t('fields.chatEnabled.helper')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qnaEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 p-3 bg-gray-700/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-300 text-sm">
                            {t('fields.qnaEnabled.label')}
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            {t('fields.qnaEnabled.helper')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="muteParticipantsOnEntry"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 p-3 bg-gray-700/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-300 text-sm">
                            {t('fields.muteParticipantsOnEntry.label')}
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            {t('fields.muteParticipantsOnEntry.helper')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowParticipantsUnmute"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 p-3 bg-gray-700/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-300 text-sm">
                            {t('fields.allowParticipantsUnmute.label')}
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            {t('fields.allowParticipantsUnmute.helper')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowRaiseHand"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 p-3 bg-gray-700/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-300 text-sm">
                            {t('fields.allowRaiseHand.label')}
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            {t('fields.allowRaiseHand.helper')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowParticipantScreenShare"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 p-3 bg-gray-700/30">
                        <div className="space-y-0.5">
                          <FormLabel className="text-gray-300 text-sm">
                            {t('fields.allowParticipantScreenShare.label')}
                          </FormLabel>
                          <FormDescription className="text-xs text-gray-400">
                            {t('fields.allowParticipantScreenShare.helper')}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
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
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
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
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}