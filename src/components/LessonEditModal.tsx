// src/components/LessonEditModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
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

interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  videoId?: string;
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
  videoId?: string;
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
  order: number;
  videoId: string;
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
      order: 1, // ✅ Sempre começar com 1
      videoId: 'no-video', // ✅ Valor padrão seguro
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

  // Função para buscar lições existentes do módulo
  const fetchExistingLessons = useCallback(
    async (courseId: string, moduleId: string) => {
      setLoadingOrders(true);
      try {
        const response = await fetch(
          `${apiUrl}/courses/${courseId}/modules/${moduleId}/lessons`
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
          `${apiUrl}/courses/${courseId}/lessons/${lessonId}/videos`,
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
          `${apiUrl}/assessments`,
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
          `${apiUrl}/assessments?lessonId=${lessonId}`,
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

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.imageUrl.trim()) {
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

  // Submeter formulário
  const handleSubmit = async (
    e: React.FormEvent
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm() || !lesson) return;

    setLoading(true);
    try {
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
        flashcardIds?: string[];
        quizIds?: string[];
        commentIds?: string[];
      } = {
        imageUrl: formData.imageUrl.trim(),
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
        `${apiUrl}/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`,
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
            `${apiUrl}/assessments/${assessmentId}`,
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

      console.log('Dados processados:', {
        processedVideoId,
        processedOrder,
      });

      setFormData({
        imageUrl: lesson.imageUrl || '',
        order: processedOrder,
        videoId: processedVideoId,
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
  ]);

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

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <ImageIcon
                      size={16}
                      className="inline mr-2"
                    />
                    {t('fields.imageUrl')}
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        imageUrl: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                      errors.imageUrl
                        ? 'border-red-500'
                        : 'border-gray-600'
                    }`}
                    placeholder={t('placeholders.imageUrl')}
                  />
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

              {/* Traduções - TEMPORARIAMENTE DESABILITADO PARA DEBUG */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe size={20} />
                  {t('translations.title')}
                </h3>

                <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-400">
                  <span>
                    Traduções temporariamente desabilitadas
                    para debug
                  </span>
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
