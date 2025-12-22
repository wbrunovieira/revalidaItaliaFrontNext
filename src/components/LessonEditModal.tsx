// src/components/LessonEditModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  X,
  BookOpen,
  Image as ImageIcon,
  Globe,
  Save,
  Loader2,
  Hash,
  Video,
  CreditCard,
  ClipboardList,
  MessageSquare,
  Clock,
  Play,
  Type,
  FileText,
  Upload,
  ArrowRight,
  Music,
  Box,
  Gamepad2,
  Info,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface VideoData {
  id: string;
  slug: string;
  providerVideoId: string;
  durationInSeconds: number;
  isSeen?: boolean;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface AvailableVideo {
  id: string;
  slug: string;
  providerVideoId: string;
  durationInSeconds: number;
  createdAt: string;
  updatedAt: string;
  translations: Translation[];
}

type LessonType = 'STANDARD' | 'ENVIRONMENT_3D';

interface Environment3DTranslation {
  locale: string;
  title: string;
  description?: string;
}

interface Environment3DItem {
  id: string;
  slug: string;
  translations: Environment3DTranslation[];
}

interface AudioItem {
  id: string;
  slug: string;
  order: number;
  translations: Translation[];
}

interface AnimationItem {
  id: string;
  type: 'COMPLETE_SENTENCE' | 'MULTIPLE_CHOICE';
  targetWord: string;
  fullSentence?: string;
  enabled: boolean;
  translations: Translation[];
}

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  type?: LessonType;
  videoId?: string;
  environment3dId?: string;
  audioIds?: string[];
  animationIds?: string[];
  flashcardIds: string[];
  commentIds: string[];
  imageUrl?: string;
  translations: Translation[];
  video?: VideoData;
  createdAt: string;
  updatedAt: string;
}

interface Assessment {
  id: string;
  slug: string;
  title: string;
  type: string;
  lessonId?: string;
}

interface LessonEditData {
  id: string;
  moduleId: string;
  order: number;
  type?: LessonType;
  videoId?: string;
  environment3dId?: string;
  audioIds?: string[];
  animationIds?: string[];
  flashcardIds: string[];
  commentIds: string[];
  imageUrl: string;
  translations: Translation[];
  video?: VideoData;
}

interface LessonEditModalProps {
  lesson: LessonEditData | null;
  courseId: string;
  moduleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface FormTranslations {
  pt: Translation;
  es: Translation;
  it: Translation;
}

interface FormData {
  imageUrl: string;
  newImageUrl: string;
  newImageFile: File | undefined;
  order: number;
  lessonType: LessonType;
  videoId: string;
  environment3dId: string;
  audioIds: string[];
  animationIds: string[];
  flashcardIds: string;
  commentIds: string;
  selectedAssessmentId: string;
  translations: FormTranslations;
}

interface FormErrors {
  [key: string]: string | undefined;
}

export default function LessonEditModal({
  lesson,
  courseId,
  moduleId,
  isOpen,
  onClose,
  onSave,
}: LessonEditModalProps) {
  const t = useTranslations('Admin.lessonEdit');
  const { toast } = useToast();

  // ✅ Componente wrapper seguro para SelectItem
  const SafeSelectItem = ({
    value,
    children,
    className,
    ...props
  }: {
    value: string;
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => {
    // ✅ Verificação rigorosa antes de renderizar
    if (value === undefined || value === null) {
      console.error(
        'SafeSelectItem: valor undefined/null detectado!',
        { value, children }
      );
      return null;
    }

    const stringValue = String(value);
    if (!stringValue || stringValue.trim() === '') {
      console.error(
        'SafeSelectItem: valor vazio detectado!',
        {
          originalValue: value,
          stringValue,
          children,
          stack: new Error().stack,
        }
      );
      return null;
    }

    const safeValue = stringValue.trim();
    if (!safeValue) {
      console.error(
        'SafeSelectItem: valor vazio após trim!',
        {
          originalValue: value,
          stringValue,
          safeValue,
          children,
          stack: new Error().stack,
        }
      );
      return null;
    }

    return (
      <SelectItem
        value={safeValue}
        className={className}
        {...props}
      >
        {children}
      </SelectItem>
    );
  };

  const [formData, setFormData] = useState<FormData>(
    () => ({
      imageUrl: '',
      newImageUrl: '',
      newImageFile: undefined,
      order: 1, // ✅ Sempre começar com 1
      lessonType: 'STANDARD' as LessonType,
      videoId: 'no-video', // ✅ Valor padrão seguro
      environment3dId: '',
      audioIds: [],
      animationIds: [],
      flashcardIds: '',
      commentIds: '',
      selectedAssessmentId: '',
      translations: {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      },
    })
  );

  const [loading, setLoading] = useState(false);
  const [savedImageName, setSavedImageName] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  // Estados para gerenciar orders
  const [existingOrders, setExistingOrders] = useState<
    number[]
  >([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<
    number | null
  >(null);

  // Estados para gerenciar vídeos
  const [availableVideos, setAvailableVideos] = useState<
    AvailableVideo[]
  >([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Estados para gerenciar assessments
  const [availableAssessments, setAvailableAssessments] =
    useState<Assessment[]>([]);
  const [linkedAssessments, setLinkedAssessments] =
    useState<Assessment[]>([]);
  const [loadingAssessments, setLoadingAssessments] =
    useState(false);

  // Estados para Interactive Lessons
  const [environments3D, setEnvironments3D] = useState<Environment3DItem[]>([]);
  const [loadingEnvironments, setLoadingEnvironments] = useState(false);
  const [availableAudios, setAvailableAudios] = useState<AudioItem[]>([]);
  const [loadingAudios, setLoadingAudios] = useState(false);
  const [availableAnimations, setAvailableAnimations] = useState<AnimationItem[]>([]);
  const [loadingAnimations, setLoadingAnimations] = useState(false);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333';

  // Função para obter o token
  const getAuthToken = (): string | null => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2)
        return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const tokenFromCookie = getCookie('token');
    const tokenFromLocal =
      localStorage.getItem('accessToken');
    const tokenFromSession =
      sessionStorage.getItem('accessToken');

    console.log('Token sources:', {
      cookie: tokenFromCookie ? 'Found' : 'Not found',
      localStorage: tokenFromLocal ? 'Found' : 'Not found',
      sessionStorage: tokenFromSession
        ? 'Found'
        : 'Not found',
    });

    return (
      tokenFromCookie || tokenFromLocal || tokenFromSession
    );
  };

  // Extract filename from URL
  const extractFilenameFromUrl = useCallback((url: string): string | null => {
    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      // If it looks like a filename (has extension), return it
      if (filename && filename.includes('.')) {
        return filename;
      }
    } catch (error) {
      console.error('Error extracting filename:', error);
    }
    return null;
  }, []);

  // Delete image from storage
  const deleteImage = useCallback(async (imageUrl: string) => {
    try {
      // Extract path from URL - assuming URL structure includes /images/lessons/filename
      const urlParts = imageUrl.split('/');
      const imagesIndex = urlParts.findIndex(part => part === 'images');
      if (imagesIndex === -1) {
        console.error('Could not extract path from URL');
        return false;
      }
      
      const path = urlParts.slice(imagesIndex).join('/');
      
      const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }, []);

  // Handle image selection (preview only, no upload)
  const handleImageSelection = useCallback(
    (file: File) => {
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          imageUrl: t('errors.invalidImageType'),
        }));
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          imageUrl: t('errors.imageTooLarge'),
        }));
        return;
      }

      // Create a local URL for preview
      const localUrl = URL.createObjectURL(file);
      
      // Save file and preview URL
      setFormData(prev => ({
        ...prev,
        newImageFile: file,
        newImageUrl: localUrl,
      }));
      
      setSavedImageName(file.name);
      
      // Clear image error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.imageUrl;
        return newErrors;
      });
    },
    [t]
  );

  // Remove new image selection
  const handleImageRemove = useCallback(() => {
    // Revoke the object URL to free memory
    if (formData.newImageUrl && formData.newImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formData.newImageUrl);
    }
    
    setFormData(prev => ({
      ...prev,
      newImageFile: undefined,
      newImageUrl: '',
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.imageUrl;
      return newErrors;
    });
    setSavedImageName(null);
  }, [formData.newImageUrl]);

  // Função para buscar lições existentes do módulo
  const fetchExistingLessons = useCallback(
    async (courseId: string, moduleId: string) => {
      setLoadingOrders(true);
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch lessons: ${response.status}`
          );
        }

        const data = await response.json();
        const lessons = data.lessons || [];
        const orders = lessons.map(
          (lesson: Lesson) => lesson.order
        );
        setExistingOrders(orders);

        console.log('Orders existentes no módulo:', orders);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        setExistingOrders([]);
        toast({
          title: 'Erro ao carregar aulas',
          description:
            'Não foi possível carregar as aulas existentes do módulo.',
          variant: 'destructive',
        });
      } finally {
        setLoadingOrders(false);
      }
    },
    [toast, apiUrl]
  );

  // Função para buscar vídeos disponíveis
  const fetchAvailableVideos = useCallback(
    async (courseId: string, lessonId: string) => {
      setLoadingVideos(true);
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/courses/${courseId}/lessons/${lessonId}/videos`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            // Se não encontrar vídeos, apenas define array vazio
            setAvailableVideos([]);
            return;
          }
          throw new Error(
            `Failed to fetch videos: ${response.status}`
          );
        }

        const videos: AvailableVideo[] =
          await response.json();
        setAvailableVideos(videos || []);

        console.log('Vídeos disponíveis:', videos);
      } catch (error) {
        console.error('Error fetching videos:', error);
        setAvailableVideos([]);
        toast({
          title: 'Erro ao carregar vídeos',
          description:
            'Não foi possível carregar os vídeos disponíveis.',
          variant: 'destructive',
        });
      } finally {
        setLoadingVideos(false);
      }
    },
    [toast, apiUrl]
  );

  // Função para buscar assessments disponíveis
  const fetchAvailableAssessments =
    useCallback(async () => {
      setLoadingAssessments(true);
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/assessments`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch assessments: ${response.status}`
          );
        }

        const data = await response.json();
        setAvailableAssessments(data.assessments || []);
        console.log(
          'Assessments disponíveis:',
          data.assessments
        );
      } catch (error) {
        console.error('Error fetching assessments:', error);
        setAvailableAssessments([]);
        toast({
          title: 'Erro ao carregar avaliações',
          description:
            'Não foi possível carregar as avaliações disponíveis.',
          variant: 'destructive',
        });
      } finally {
        setLoadingAssessments(false);
      }
    }, [toast, apiUrl]);

  // Função para buscar assessments vinculados à lição
  const fetchLinkedAssessments = useCallback(
    async (lessonId: string) => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/assessments?lessonId=${lessonId}`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch linked assessments: ${response.status}`
          );
        }

        const data = await response.json();
        setLinkedAssessments(data.assessments || []);
        console.log(
          'Assessments vinculados:',
          data.assessments
        );
      } catch (error) {
        console.error(
          'Error fetching linked assessments:',
          error
        );
        setLinkedAssessments([]);
      }
    },
    [apiUrl]
  );

  // Função para buscar ambientes 3D disponíveis
  const fetchEnvironments3D = useCallback(async () => {
    setLoadingEnvironments(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/environments-3d`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setEnvironments3D([]);
          return;
        }
        throw new Error(`Failed to fetch environments: ${response.status}`);
      }

      const data = await response.json();
      setEnvironments3D(data || []);
      console.log('Environments 3D disponíveis:', data);
    } catch (error) {
      console.error('Error fetching environments 3D:', error);
      setEnvironments3D([]);
      toast({
        title: 'Erro ao carregar ambientes 3D',
        description: 'Não foi possível carregar os ambientes disponíveis.',
        variant: 'destructive',
      });
    } finally {
      setLoadingEnvironments(false);
    }
  }, [apiUrl, toast]);

  // Função para buscar áudios disponíveis
  const fetchAvailableAudios = useCallback(async () => {
    setLoadingAudios(true);
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        Accept: 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/api/v1/audios`, { headers });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) {
          setAvailableAudios([]);
          return;
        }
        throw new Error(`Failed to fetch audios: ${response.status}`);
      }

      const data = await response.json();
      setAvailableAudios(data.audios || data || []);
      console.log('Áudios disponíveis:', data);
    } catch (error) {
      console.error('Error fetching audios:', error);
      setAvailableAudios([]);
    } finally {
      setLoadingAudios(false);
    }
  }, [apiUrl]);

  // Função para buscar animações disponíveis
  const fetchAvailableAnimations = useCallback(async () => {
    setLoadingAnimations(true);
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {
        Accept: 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/api/v1/animations`, { headers });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) {
          setAvailableAnimations([]);
          return;
        }
        throw new Error(`Failed to fetch animations: ${response.status}`);
      }

      const data = await response.json();
      setAvailableAnimations(data.animations || data || []);
      console.log('Animações disponíveis:', data);
    } catch (error) {
      console.error('Error fetching animations:', error);
      setAvailableAnimations([]);
    } finally {
      setLoadingAnimations(false);
    }
  }, [apiUrl]);

  // Função para gerar lista de ordens disponíveis
  const getAvailableOrders = useCallback((): number[] => {
    const maxOrder = 50; // Limite máximo de ordem
    const availableOrders = [];

    for (let i = 1; i <= maxOrder; i++) {
      // Incluir o order original (da lição sendo editada) mesmo que já exista
      // Excluir outros orders que já existem
      if (
        !existingOrders.includes(i) ||
        i === originalOrder
      ) {
        availableOrders.push(i);
      }
    }

    // ✅ Garantir que sempre há pelo menos uma opção válida
    if (availableOrders.length === 0) {
      availableOrders.push(originalOrder || 1);
    }

    return availableOrders.filter(order => order > 0); // ✅ Filtrar valores inválidos
  }, [existingOrders, originalOrder]);

  // Função para converter string de IDs para array
  const stringToArray = (str: string): string[] => {
    return str
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  // Função para converter array de IDs para string
  const arrayToString = (arr: string[]): string => {
    return arr.join(', ');
  };

  // Função para obter tradução por locale
  const getTranslationByLocale = useCallback(
    (translations: Translation[], targetLocale: string) => {
      return (
        translations.find(
          tr => tr.locale === targetLocale
        ) || translations[0]
      );
    },
    []
  );

  // Função para formatar duração
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  // Função para atualizar traduções
  const updateTranslation = (
    locale: 'pt' | 'es' | 'it',
    field: 'title' | 'description',
    value: string
  ): void => {
    setFormData({
      ...formData,
      translations: {
        ...formData.translations,
        [locale]: {
          ...formData.translations[locale],
          [field]: value,
        },
      },
    });
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Image is required (either original or new)
    if (!formData.imageUrl.trim() && !formData.newImageUrl.trim()) {
      newErrors.imageUrl = t('errors.imageRequired');
    }

    if (formData.order < 1) {
      newErrors.order = t('errors.orderRequired');
    } else if (formData.order > 999) {
      newErrors.order = t('errors.orderMax');
    } else if (
      existingOrders.includes(formData.order) &&
      formData.order !== originalOrder
    ) {
      newErrors.order = t('errors.orderExists');
    }

    // Validar traduções
    const locales = ['pt', 'es', 'it'] as const;
    locales.forEach(locale => {
      if (!formData.translations[locale].title.trim()) {
        newErrors[`title_${locale}`] = t(
          'errors.titleRequired'
        );
      }
      if (
        !formData.translations[locale].description.trim()
      ) {
        newErrors[`description_${locale}`] = t(
          'errors.descriptionRequired'
        );
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate unique filename
  const generateUniqueFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || 'jpg';
    const cleanName = originalName.split('.')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
    return `${cleanName}-${timestamp}-${randomString}.${extension}`;
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const uniqueFileName = generateUniqueFileName(file.name);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'image');
    formData.append('folder', 'lessons');
    formData.append('filename', uniqueFileName);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.url;
  };

  // Submeter formulário
  const handleSubmit = async (
    e: React.FormEvent
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm() || !lesson) return;

    setLoading(true);
    let newUploadedUrl: string | null = null;
    
    try {
      let finalImageUrl = formData.imageUrl;
      
      // If there's a new image to upload
      if (formData.newImageFile) {
        toast({
          title: t('upload.uploading'),
          description: formData.newImageFile.name,
        });
        
        try {
          // Upload the new image
          newUploadedUrl = await uploadImage(formData.newImageFile);
          finalImageUrl = newUploadedUrl;
          
          toast({
            title: t('upload.success'),
            description: extractFilenameFromUrl(newUploadedUrl) || '',
          });
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast({
            title: t('error.uploadTitle'),
            description: t('error.uploadDescription'),
            variant: 'destructive',
          });
          return;
        } finally {
        }
      }
      
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Converter translations object para array
      const translations = Object.values(
        formData.translations
      );

      // Preparar dados para envio
      const requestData: {
        imageUrl: string;
        order: number;
        translations: Translation[];
        videoId?: string;
        environment3dId?: string;
        audioIds?: string[];
        animationIds?: string[];
        flashcardIds?: string[];
        quizIds?: string[];
        commentIds?: string[];
      } = {
        imageUrl: finalImageUrl.trim(),
        order: formData.order,
        translations,
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (
        formData.videoId &&
        formData.videoId !== 'no-video' &&
        formData.videoId.trim()
      ) {
        requestData.videoId = formData.videoId.trim();
      }

      // Adicionar campos de Interactive Lessons
      if (formData.lessonType === 'ENVIRONMENT_3D' && formData.environment3dId) {
        requestData.environment3dId = formData.environment3dId;
      }

      if (formData.audioIds.length > 0) {
        requestData.audioIds = formData.audioIds;
      }

      if (formData.animationIds.length > 0) {
        requestData.animationIds = formData.animationIds;
      }

      const flashcardIds = stringToArray(
        formData.flashcardIds
      );
      if (flashcardIds.length > 0) {
        requestData.flashcardIds = flashcardIds;
      }

      const commentIds = stringToArray(formData.commentIds);
      if (commentIds.length > 0) {
        requestData.commentIds = commentIds;
      }

      const response = await fetch(
        `${apiUrl}/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Não autorizado - faça login novamente'
          );
        } else if (response.status === 404) {
          throw new Error('Aula não encontrada');
        } else if (response.status === 409) {
          throw new Error(
            'Já existe uma aula com esta ordem'
          );
        }
        throw new Error('Erro ao atualizar aula');
      }

      // If update was successful and we uploaded a new image, delete the old one
      if (newUploadedUrl && formData.imageUrl && formData.imageUrl !== newUploadedUrl) {
        // Delete old image in background (don't wait for it)
        deleteImage(formData.imageUrl).catch(error => {
          console.error('Error deleting old image:', error);
        });
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
      toast({
        title: t('error.title'),
        description:
          error instanceof Error
            ? error.message
            : t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handler para mudança de order
  const handleOrderChange = useCallback(
    (value: string) => {
      // ✅ Verificação robusta para evitar valores inválidos
      if (!value || value.trim() === '') {
        console.warn('Valor de order inválido:', value);
        return;
      }

      const order = parseInt(value) || 1;

      // ✅ Garantir que o order seja válido
      if (order < 1 || order > 999) {
        console.warn('Order fora do range válido:', order);
        return;
      }

      setFormData(prev => ({ ...prev, order }));

      // Validar order em tempo real
      if (
        existingOrders.includes(order) &&
        order !== originalOrder
      ) {
        setErrors(prev => ({
          ...prev,
          order: t('errors.orderExists'),
        }));
      } else {
        setErrors(prev => ({ ...prev, order: undefined }));
      }
    },
    [existingOrders, originalOrder, t]
  );

  // Handler para mudança de vídeo
  const handleVideoChange = useCallback((value: string) => {
    // ✅ Verificação de entrada
    if (!value) {
      console.warn(
        'handleVideoChange: valor vazio recebido'
      );
      return;
    }

    // ✅ Garantir que nunca seja string vazia - sempre usar "no-video" se não há vídeo
    const videoId =
      value && value.trim() && value !== 'no-video'
        ? value
        : 'no-video';
    console.log('handleVideoChange:', {
      input: value,
      output: videoId,
    });
    setFormData(prev => ({ ...prev, videoId }));
  }, []);

  // Handler para mudança de assessment
  const handleAssessmentChange = useCallback(
    async (assessmentId: string) => {
      if (!assessmentId || assessmentId === 'none') {
        setFormData(prev => ({
          ...prev,
          selectedAssessmentId: '',
        }));
        return;
      }

      // Update assessment's lessonId
      if (lesson) {
        try {
          const response = await fetch(
            `${apiUrl}/api/v1/assessments/${assessmentId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                lessonId: lesson.id,
              }),
            }
          );

          if (!response.ok) {
            throw new Error('Failed to update assessment');
          }

          setFormData(prev => ({
            ...prev,
            selectedAssessmentId: assessmentId,
          }));

          // Refresh linked assessments
          await fetchLinkedAssessments(lesson.id);

          toast({
            title: 'Avaliação vinculada',
            description:
              'Avaliação foi vinculada à aula com sucesso.',
          });
        } catch (error) {
          console.error(
            'Error updating assessment:',
            error
          );
          toast({
            title: 'Erro ao vincular avaliação',
            description:
              'Não foi possível vincular a avaliação à aula.',
            variant: 'destructive',
          });
        }
      }
    },
    [lesson, apiUrl, fetchLinkedAssessments, toast]
  );

  // Atualizar formulário quando lesson mudar
  useEffect(() => {
    if (lesson && isOpen && courseId && moduleId) {
      // ✅ Verificação de dados de entrada
      console.log('Dados da lição recebidos:', {
        id: lesson.id,
        order: lesson.order,
        videoId: lesson.videoId,
        hasVideoId: !!lesson.videoId,
        videoIdTrimmed: lesson.videoId?.trim(),
      });

      const translationsObj: FormTranslations = {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      };

      // Preencher traduções existentes
      lesson.translations.forEach(trans => {
        if (
          trans.locale === 'pt' ||
          trans.locale === 'es' ||
          trans.locale === 'it'
        ) {
          translationsObj[
            trans.locale as keyof FormTranslations
          ] = {
            locale: trans.locale,
            title: trans.title,
            description: trans.description,
          };
        }
      });

      // ✅ Processamento mais seguro do videoId
      let processedVideoId = 'no-video';
      if (
        lesson.videoId &&
        typeof lesson.videoId === 'string' &&
        lesson.videoId.trim()
      ) {
        processedVideoId = lesson.videoId.trim();
      }

      // ✅ Processamento mais seguro do order
      const processedOrder =
        lesson.order && lesson.order > 0 ? lesson.order : 1;

      // ✅ Processamento do tipo da lição
      const processedLessonType: LessonType = lesson.type === 'ENVIRONMENT_3D' ? 'ENVIRONMENT_3D' : 'STANDARD';

      console.log('Dados processados:', {
        processedVideoId,
        processedOrder,
        processedLessonType,
        environment3dId: lesson.environment3dId,
        audioIds: lesson.audioIds,
        animationIds: lesson.animationIds,
      });

      setFormData({
        imageUrl: lesson.imageUrl || '',
        newImageUrl: '',
        newImageFile: undefined,
        order: processedOrder,
        lessonType: processedLessonType,
        videoId: processedVideoId,
        environment3dId: lesson.environment3dId || '',
        audioIds: lesson.audioIds || [],
        animationIds: lesson.animationIds || [],
        flashcardIds: arrayToString(
          lesson.flashcardIds || []
        ),
        commentIds: arrayToString(lesson.commentIds || []),
        selectedAssessmentId: '',
        translations: translationsObj,
      });

      // Armazenar o order original
      setOriginalOrder(processedOrder);
      setErrors({});

      // Buscar lições existentes do módulo, vídeos disponíveis e assessments
      fetchExistingLessons(courseId, moduleId);
      fetchAvailableVideos(courseId, lesson.id);
      fetchAvailableAssessments();
      fetchLinkedAssessments(lesson.id);

      // Buscar dados para Interactive Lessons
      fetchEnvironments3D();
      fetchAvailableAudios();
      fetchAvailableAnimations();
    }
  }, [
    lesson,
    isOpen,
    courseId,
    moduleId,
    fetchExistingLessons,
    fetchAvailableVideos,
    fetchAvailableAssessments,
    fetchLinkedAssessments,
    fetchEnvironments3D,
    fetchAvailableAudios,
    fetchAvailableAnimations,
  ]);

  // Cleanup blob URLs when modal closes
  useEffect(() => {
    return () => {
      if (formData.newImageUrl && formData.newImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.newImageUrl);
      }
    };
  }, [formData.newImageUrl]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !lesson) return null;

  // ✅ Verificação rigorosa: só renderizar quando dados estão prontos
  if (
    !formData ||
    typeof formData.order !== 'number' ||
    !formData.videoId
  ) {
    console.log('Aguardando dados do formulário...', {
      formData,
      lesson,
    });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="flex items-center gap-3">
            <Loader2
              size={24}
              className="animate-spin text-secondary"
            />
            <span className="text-white">
              Carregando...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Proteção adicional: garantir que formData tem valores válidos
  const safeFormData = {
    ...formData,
    videoId: formData.videoId || 'no-video',
    order: formData.order || 1,
  };

  // ✅ Verificação final antes de renderizar
  console.log('Renderizando modal com dados seguros:', {
    safeFormData: safeFormData,
    'availableVideos.length': availableVideos.length,
    'getAvailableOrders().length':
      getAvailableOrders().length,
    existingOrders: existingOrders,
    originalOrder: originalOrder,
    loadingOrders: loadingOrders,
    loadingVideos: loadingVideos,
  });

  // ✅ Try-catch para capturar erros de renderização
  try {
    // ✅ Log de debug seguro
    console.log(
      'Modal renderizado com sucesso até o final'
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <BookOpen
                size={28}
                className="text-secondary"
              />
              {t('title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-6"
          >
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Hash
                      size={16}
                      className="inline mr-2"
                    />
                    {t('fields.order')}
                  </label>
                  {loadingOrders ? (
                    <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                      <Loader2
                        size={16}
                        className="animate-spin inline mr-2"
                      />
                      {t('loadingOrders')}
                    </div>
                  ) : getAvailableOrders().length === 0 ? (
                    <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                      <span>{t('noOrdersAvailable')}</span>
                    </div>
                  ) : (
                    <Select
                      value={safeFormData.order.toString()} // ✅ Usar safeFormData
                      onValueChange={handleOrderChange}
                      disabled={loadingOrders}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue
                          placeholder={t(
                            'placeholders.order'
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 max-h-60 overflow-y-auto">
                        {
                          getAvailableOrders()
                            .filter(
                              order => order && order > 0
                            ) // ✅ Filtrar valores inválidos
                            .map(order => {
                              const orderString =
                                order.toString();
                              // ✅ Verificação adicional para garantir que não é string vazia
                              if (
                                !orderString ||
                                orderString.trim() === ''
                              ) {
                                console.warn(
                                  'Order inválido encontrado:',
                                  order
                                );
                                return null;
                              }

                              return (
                                <SafeSelectItem
                                  key={`order-${order}`}
                                  value={orderString}
                                  className="text-white hover:bg-gray-600"
                                >
                                  {order}
                                  {order ===
                                    originalOrder && (
                                    <span className="text-xs text-gray-400 ml-2">
                                      ({t('current')})
                                    </span>
                                  )}
                                </SafeSelectItem>
                              );
                            })
                            .filter(Boolean) // ✅ Remover itens null
                        }
                      </SelectContent>
                    </Select>
                  )}
                  {errors.order && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.order}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {t('hints.order')}
                  </p>
                  {existingOrders.length > 0 &&
                    !loadingOrders && (
                      <p className="text-xs text-gray-400 mt-1">
                        {t('occupiedOrders')}:{' '}
                        {existingOrders
                          .filter(o => o !== originalOrder)
                          .sort((a, b) => a - b)
                          .join(', ')}
                      </p>
                    )}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <ImageIcon
                      size={16}
                      className="inline mr-2"
                    />
                    {t('lessonImage')}
                  </label>
                  
                  {/* Upload area if no image or new image */}
                  {!formData.imageUrl && !formData.newImageUrl ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageSelection(file);
                        }}
                        className="hidden"
                        id="lesson-image-upload"
                      />
                      <label
                        htmlFor="lesson-image-upload"
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors ${
                          errors.imageUrl
                            ? 'border-red-500'
                            : 'border-gray-600'
                        }`}
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-400">
                          {t('upload.clickToSelect')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('upload.supportedFormats')}: JPEG, PNG, GIF, WebP
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Original image preview */}
                      {formData.imageUrl && !formData.newImageUrl && (
                        <div>
                          <p className="text-xs text-gray-400 mb-2">{t('image.current')}</p>
                          <div className="relative group">
                            <Image
                              src={formData.imageUrl}
                              alt="Current lesson image"
                              width={200}
                              height={112}
                              className="rounded-lg object-cover w-full h-28"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageSelection(file);
                                }}
                                className="hidden"
                                id="lesson-image-change"
                              />
                              <label
                                htmlFor="lesson-image-change"
                                className="px-3 py-1 bg-white text-black text-sm rounded cursor-pointer hover:bg-gray-200"
                              >
                                {t('upload.change')}
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Dual preview when new image selected */}
                      {formData.imageUrl && formData.newImageUrl && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-400 mb-2">{t('image.original')}</p>
                            <Image
                              src={formData.imageUrl}
                              alt="Original lesson image"
                              width={200}
                              height={112}
                              className="rounded-lg object-cover w-full h-20"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-green-400 mb-2 flex items-center gap-1">
                              <ArrowRight size={12} />
                              {t('image.new')}
                            </p>
                            <div className="relative group">
                              <Image
                                src={formData.newImageUrl}
                                alt="New lesson image"
                                width={200}
                                height={112}
                                className="rounded-lg object-cover w-full h-20 ring-2 ring-green-400"
                              />
                              <button
                                type="button"
                                onClick={handleImageRemove}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {savedImageName && (
                        <p className="text-xs text-gray-500">
                          {t('upload.savedAs')}: {savedImageName}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {errors.imageUrl && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.imageUrl}
                    </p>
                  )}
                </div>

                {/* Video Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Video
                      size={16}
                      className="inline mr-2"
                    />
                    {t('fields.video')}
                  </label>
                  {loadingVideos ? (
                    <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                      <Loader2
                        size={16}
                        className="animate-spin inline mr-2"
                      />
                      {t('loadingVideos')}
                    </div>
                  ) : (
                    <Select
                      value={safeFormData.videoId} // ✅ Usar safeFormData (já garantido como válido)
                      onValueChange={handleVideoChange}
                      disabled={loadingVideos}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue
                          placeholder={t(
                            'placeholders.selectVideo'
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 max-h-60 overflow-y-auto">
                        {/* Opção para não selecionar nenhum vídeo */}
                        <SafeSelectItem
                          value="no-video"
                          className="text-gray-400 hover:bg-gray-600"
                        >
                          <div className="flex items-center gap-2">
                            <span>🚫</span>
                            <span>
                              {t('fields.noVideo')}
                            </span>
                          </div>
                        </SafeSelectItem>

                        {availableVideos.length === 0 ? (
                          <div className="px-2 py-4 text-center text-gray-400 text-sm">
                            {t('fields.noVideosAvailable')}
                          </div>
                        ) : (
                          availableVideos.map(video => {
                            const translation =
                              getTranslationByLocale(
                                video.translations,
                                'pt'
                              );
                            return (
                              <SafeSelectItem
                                key={video.id}
                                value={video.id}
                                className="text-white hover:bg-gray-600"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="flex items-center gap-2">
                                    <Play
                                      size={14}
                                      className="text-secondary"
                                    />
                                    <span className="font-medium">
                                      {translation?.title ||
                                        video.slug}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Clock size={12} />
                                    <span>
                                      {formatDuration(
                                        video.durationInSeconds
                                      )}
                                    </span>
                                  </div>
                                </div>
                                {translation?.description && (
                                  <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                                    {
                                      translation.description
                                    }
                                  </div>
                                )}
                              </SafeSelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {t('hints.videoSelection')}
                  </p>
                </div>

                {/* Interactive Lessons Section */}
                <div className="md:col-span-2 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <Gamepad2 size={20} className="text-secondary" />
                    {t('interactiveLessons.title')}
                  </h3>

                  {/* Lesson Type (Read-only) */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Info size={16} className="inline mr-2" />
                      {t('interactiveLessons.lessonType')}
                    </label>
                    <div className="flex items-center gap-3 bg-gray-700/50 px-4 py-3 rounded-lg">
                      {formData.lessonType === 'ENVIRONMENT_3D' ? (
                        <>
                          <Box size={20} className="text-purple-400" />
                          <span className="text-white font-medium">
                            {t('interactiveLessons.types.environment3d')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Video size={20} className="text-blue-400" />
                          <span className="text-white font-medium">
                            {t('interactiveLessons.types.standard')}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-gray-400 ml-2">
                        ({t('interactiveLessons.typeReadOnly')})
                      </span>
                    </div>
                  </div>

                  {/* Environment 3D Selection (only for ENVIRONMENT_3D type) */}
                  {formData.lessonType === 'ENVIRONMENT_3D' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Box size={16} className="inline mr-2" />
                        {t('interactiveLessons.environment3d')}
                      </label>
                      {loadingEnvironments ? (
                        <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                          <Loader2 size={16} className="animate-spin inline mr-2" />
                          {t('interactiveLessons.loadingEnvironments')}
                        </div>
                      ) : (
                        <Select
                          value={formData.environment3dId || 'none'}
                          onValueChange={(value) => {
                            setFormData(prev => ({
                              ...prev,
                              environment3dId: value === 'none' ? '' : value,
                            }));
                          }}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder={t('interactiveLessons.selectEnvironment')} />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600 max-h-60 overflow-y-auto">
                            <SafeSelectItem value="none" className="text-gray-400 hover:bg-gray-600">
                              {t('interactiveLessons.noEnvironment')}
                            </SafeSelectItem>
                            {environments3D.map(env => {
                              const envTranslation = env.translations?.[0];
                              return (
                                <SafeSelectItem
                                  key={env.id}
                                  value={env.id}
                                  className="text-white hover:bg-gray-600"
                                >
                                  <div className="flex items-center gap-2">
                                    <Box size={14} className="text-purple-400" />
                                    <span>{envTranslation?.title || env.slug}</span>
                                  </div>
                                </SafeSelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {t('interactiveLessons.environment3dHint')}
                      </p>
                    </div>
                  )}

                  {/* Audio Selection (only for STANDARD type) */}
                  {formData.lessonType === 'STANDARD' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Music size={16} className="inline mr-2" />
                        {t('interactiveLessons.audios')}
                      </label>
                      {loadingAudios ? (
                        <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                          <Loader2 size={16} className="animate-spin inline mr-2" />
                          {t('interactiveLessons.loadingAudios')}
                        </div>
                      ) : availableAudios.length === 0 ? (
                        <div className="bg-gray-700/50 rounded-lg px-4 py-3 text-gray-400 text-sm">
                          {t('interactiveLessons.noAudiosAvailable')}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-700/50 rounded-lg p-3">
                          {availableAudios.map(audio => {
                            const translation = getTranslationByLocale(audio.translations, 'pt');
                            const isSelected = formData.audioIds.includes(audio.id);
                            return (
                              <label
                                key={audio.id}
                                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                  isSelected ? 'bg-secondary/20 border border-secondary' : 'hover:bg-gray-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        audioIds: [...prev.audioIds, audio.id],
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        audioIds: prev.audioIds.filter(id => id !== audio.id),
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-secondary focus:ring-secondary"
                                />
                                <Music size={14} className="text-blue-400" />
                                <span className="text-white text-sm">
                                  {translation?.title || audio.slug}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.audioIds.length > 0
                          ? t('interactiveLessons.selectedAudios', { count: formData.audioIds.length })
                          : t('interactiveLessons.audiosHint')}
                      </p>
                    </div>
                  )}

                  {/* Animations Selection (for all lesson types) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Gamepad2 size={16} className="inline mr-2" />
                      {t('interactiveLessons.animations')}
                    </label>
                    {loadingAnimations ? (
                      <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                        <Loader2 size={16} className="animate-spin inline mr-2" />
                        {t('interactiveLessons.loadingAnimations')}
                      </div>
                    ) : availableAnimations.length === 0 ? (
                      <div className="bg-gray-700/50 rounded-lg px-4 py-3 text-gray-400 text-sm">
                        {t('interactiveLessons.noAnimationsAvailable')}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-700/50 rounded-lg p-3">
                        {availableAnimations.filter(a => a.enabled).map(animation => {
                          const translation = getTranslationByLocale(animation.translations, 'pt');
                          const isSelected = formData.animationIds.includes(animation.id);
                          return (
                            <label
                              key={animation.id}
                              className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                                isSelected ? 'bg-secondary/20 border border-secondary' : 'hover:bg-gray-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      animationIds: [...prev.animationIds, animation.id],
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      animationIds: prev.animationIds.filter(id => id !== animation.id),
                                    }));
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-secondary focus:ring-secondary"
                              />
                              <Gamepad2 size={14} className="text-green-400" />
                              <div className="flex-1">
                                <span className="text-white text-sm">
                                  {translation?.title || animation.targetWord}
                                </span>
                                <span className="text-xs text-gray-400 ml-2">
                                  ({animation.type === 'COMPLETE_SENTENCE'
                                    ? t('interactiveLessons.animationTypes.completeSentence')
                                    : t('interactiveLessons.animationTypes.multipleChoice')})
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.animationIds.length > 0
                        ? t('interactiveLessons.selectedAnimations', { count: formData.animationIds.length })
                        : t('interactiveLessons.animationsHint')}
                    </p>
                  </div>
                </div>

                {/* Flashcard IDs */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <CreditCard
                      size={16}
                      className="inline mr-2"
                    />
                    {t('fields.flashcardIds')}
                  </label>
                  <input
                    type="text"
                    value={formData.flashcardIds}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        flashcardIds: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder={t(
                      'placeholders.flashcardIds'
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('hints.multipleIds')}
                  </p>
                </div>

                {/* Assessments */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <ClipboardList
                      size={16}
                      className="inline mr-2"
                    />
                    {t('fields.assessments')}
                  </label>
                  {loadingAssessments ? (
                    <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                      <Loader2
                        size={16}
                        className="animate-spin inline mr-2"
                      />
                      {t('loadingAssessments')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {linkedAssessments.length > 0 && (
                        <div className="p-3 bg-gray-700/50 rounded-lg">
                          <p className="text-sm text-white mb-2 font-bold ">
                            {t('linkedAssessments')}:
                          </p>
                          <div className="space-y-1">
                            {linkedAssessments.map(
                              assessment => (
                                <div
                                  key={assessment.id}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-gray-200">
                                    {assessment.title}
                                  </span>
                                  <span className="text-gray-400">
                                    (
                                    {t(
                                      `assessmentTypes.${assessment.type.toLowerCase()}`
                                    )}
                                    )
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      <Select
                        value={
                          formData.selectedAssessmentId
                        }
                        onValueChange={
                          handleAssessmentChange
                        }
                        disabled={loadingAssessments}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue
                            placeholder={t(
                              'placeholders.selectAssessment'
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600 max-h-60 overflow-y-auto">
                          <SafeSelectItem
                            value="none"
                            className="text-gray-400 hover:bg-gray-600"
                          >
                            {t('noAssessment')}
                          </SafeSelectItem>
                          {availableAssessments
                            .filter(
                              assessment =>
                                !assessment.lessonId
                            )
                            .map(assessment => (
                              <SafeSelectItem
                                key={assessment.id}
                                value={assessment.id}
                                className="text-white hover:bg-gray-600"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>
                                    {assessment.title}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    (
                                    {t(
                                      `assessmentTypes.${assessment.type.toLowerCase()}`
                                    )}
                                    )
                                  </span>
                                </div>
                              </SafeSelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('hints.assessmentSelection')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Comment IDs */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <MessageSquare
                      size={16}
                      className="inline mr-2"
                    />
                    {t('fields.commentIds')}
                  </label>
                  <input
                    type="text"
                    value={formData.commentIds}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        commentIds: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder={t(
                      'placeholders.commentIds'
                    )}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('hints.multipleIds')}
                  </p>
                </div>
              </div>

              {/* Traduções */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe size={20} />
                  {t('translations.title')}
                </h3>

                {/* Português */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    🇧🇷 {t('translations.portuguese')}
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        <Type
                          size={14}
                          className="inline mr-1"
                        />
                        {t('fields.title')}
                      </label>
                      <input
                        type="text"
                        value={
                          formData.translations.pt.title
                        }
                        onChange={e =>
                          updateTranslation(
                            'pt',
                            'title',
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                          errors.title_pt
                            ? 'border-red-500'
                            : 'border-gray-600'
                        }`}
                        placeholder={t(
                          'placeholders.title'
                        )}
                      />
                      {errors.title_pt && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.title_pt}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        <FileText
                          size={14}
                          className="inline mr-1"
                        />
                        {t('fields.description')}
                      </label>
                      <input
                        type="text"
                        value={
                          formData.translations.pt
                            .description
                        }
                        onChange={e =>
                          updateTranslation(
                            'pt',
                            'description',
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                          errors.description_pt
                            ? 'border-red-500'
                            : 'border-gray-600'
                        }`}
                        placeholder={t(
                          'placeholders.description'
                        )}
                      />
                      {errors.description_pt && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.description_pt}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Espanhol */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    🇪🇸 {t('translations.spanish')}
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        <Type
                          size={14}
                          className="inline mr-1"
                        />
                        {t('fields.title')}
                      </label>
                      <input
                        type="text"
                        value={
                          formData.translations.es.title
                        }
                        onChange={e =>
                          updateTranslation(
                            'es',
                            'title',
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                          errors.title_es
                            ? 'border-red-500'
                            : 'border-gray-600'
                        }`}
                        placeholder={t(
                          'placeholders.title'
                        )}
                      />
                      {errors.title_es && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.title_es}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        <FileText
                          size={14}
                          className="inline mr-1"
                        />
                        {t('fields.description')}
                      </label>
                      <input
                        type="text"
                        value={
                          formData.translations.es
                            .description
                        }
                        onChange={e =>
                          updateTranslation(
                            'es',
                            'description',
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                          errors.description_es
                            ? 'border-red-500'
                            : 'border-gray-600'
                        }`}
                        placeholder={t(
                          'placeholders.description'
                        )}
                      />
                      {errors.description_es && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.description_es}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Italiano */}
                <div className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    🇮🇹 {t('translations.italian')}
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        <Type
                          size={14}
                          className="inline mr-1"
                        />
                        {t('fields.title')}
                      </label>
                      <input
                        type="text"
                        value={
                          formData.translations.it.title
                        }
                        onChange={e =>
                          updateTranslation(
                            'it',
                            'title',
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                          errors.title_it
                            ? 'border-red-500'
                            : 'border-gray-600'
                        }`}
                        placeholder={t(
                          'placeholders.title'
                        )}
                      />
                      {errors.title_it && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.title_it}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">
                        <FileText
                          size={14}
                          className="inline mr-1"
                        />
                        {t('fields.description')}
                      </label>
                      <input
                        type="text"
                        value={
                          formData.translations.it
                            .description
                        }
                        onChange={e =>
                          updateTranslation(
                            'it',
                            'description',
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 bg-gray-700 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                          errors.description_it
                            ? 'border-red-500'
                            : 'border-gray-600'
                        }`}
                        placeholder={t(
                          'placeholders.description'
                        )}
                      />
                      {errors.description_it && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.description_it}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                loadingOrders ||
                loadingVideos ||
                loadingAssessments
              }
              className="px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error(
      'Erro ao renderizar LessonEditModal:',
      error
    );
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">
              Erro no Modal
            </h3>
            <p className="text-gray-300 mb-4">
              Ocorreu um erro ao carregar o modal de edição.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary text-primary rounded-lg hover:bg-secondary/90"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
