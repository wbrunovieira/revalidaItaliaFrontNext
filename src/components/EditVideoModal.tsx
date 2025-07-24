// /src/components/EditVideoModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/slug';
import {
  X,
  Video,
  Save,
  Loader2,
  Type,
  FileText,
  Globe,
  Clock,
  Hash,
  Image as ImageIcon,
  Copy,
  Check,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface VideoData {
  id: string;
  slug: string;
  imageUrl?: string;
  providerVideoId: string;
  durationInSeconds: number;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface EditVideoModalProps {
  courseId: string | null;
  lessonId: string | null;
  videoId: string | null;
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
  slug: string;
  imageUrl: string;
  providerVideoId: string;
  durationInSeconds: number;
  translations: FormTranslations;
}

interface FormErrors {
  [key: string]: string | undefined;
}

export default function EditVideoModal({
  courseId,
  lessonId,
  videoId,
  isOpen,
  onClose,
  onSave,
}: EditVideoModalProps) {
  const t = useTranslations('Admin.videoEdit');
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    slug: '',
    imageUrl: '',
    providerVideoId: '',
    durationInSeconds: 0,
    translations: {
      pt: { locale: 'pt', title: '', description: '' },
      es: { locale: 'es', title: '', description: '' },
      it: { locale: 'it', title: '', description: '' },
    },
  });

  const [loading, setLoading] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  // Função para obter o token
  const getAuthToken = (): string | null => {
    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      return null;
    };

    const tokenFromCookie = getCookie('token');
    const tokenFromLocal = localStorage.getItem('accessToken');
    const tokenFromSession = sessionStorage.getItem('accessToken');

    return tokenFromCookie || tokenFromLocal || tokenFromSession;
  };


  // Função para formatar duração
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Função para copiar texto para a área de transferência
  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: t('copied'),
        description: t('copiedDescription'),
      });
      // Resetar após 2 segundos
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: t('copyError'),
        description: t('copyErrorDescription'),
        variant: 'destructive',
      });
    }
  }, [t, toast]);

  // Função para buscar dados do vídeo
  const fetchVideoData = useCallback(async () => {
    if (!courseId || !lessonId || !videoId) return;

    setLoadingVideo(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/courses/${courseId}/lessons/${lessonId}/videos/${videoId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status}`);
      }

      const video: VideoData = await response.json();

      // Preparar traduções
      const translationsObj: FormTranslations = {
        pt: { locale: 'pt', title: '', description: '' },
        es: { locale: 'es', title: '', description: '' },
        it: { locale: 'it', title: '', description: '' },
      };

      // Preencher traduções existentes
      video.translations.forEach(trans => {
        if (trans.locale === 'pt' || trans.locale === 'es' || trans.locale === 'it') {
          translationsObj[trans.locale as keyof FormTranslations] = {
            locale: trans.locale,
            title: trans.title,
            description: trans.description,
          };
        }
      });

      setFormData({
        slug: video.slug || '',
        imageUrl: video.imageUrl || '',
        providerVideoId: video.providerVideoId || '',
        durationInSeconds: video.durationInSeconds || 0,
        translations: translationsObj,
      });

      setErrors({});
    } catch (error) {
      console.error('Error fetching video:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoadingVideo(false);
    }
  }, [courseId, lessonId, videoId, apiUrl, t, toast]);

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.slug.trim()) {
      newErrors.slug = t('errors.slugRequired');
    } else if (formData.slug.trim().length < 3) {
      newErrors.slug = t('errors.slugMin');
    }

    // Validar traduções
    const locales = ['pt', 'es', 'it'] as const;
    locales.forEach(locale => {
      if (!formData.translations[locale].title.trim()) {
        newErrors[`title_${locale}`] = t('errors.titleRequired');
      } else if (formData.translations[locale].title.trim().length < 3) {
        newErrors[`title_${locale}`] = t('errors.titleMin');
      }

      if (!formData.translations[locale].description.trim()) {
        newErrors[`description_${locale}`] = t('errors.descriptionRequired');
      } else if (formData.translations[locale].description.trim().length < 3) {
        newErrors[`description_${locale}`] = t('errors.descriptionMin');
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm() || !courseId || !lessonId || !videoId) return;

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
      const translations = Object.values(formData.translations).filter(
        translation => translation.title.trim() && translation.description.trim()
      );

      // Preparar dados para envio - removendo campos somente leitura
      const requestData = {
        slug: formData.slug.trim(),
        imageUrl: formData.imageUrl.trim() || undefined,
        translations,
      };

      const response = await fetch(
        `${apiUrl}/api/v1/courses/${courseId}/lessons/${lessonId}/videos/${videoId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(t('errors.unauthorized'));
        } else if (response.status === 404) {
          throw new Error(t('errors.notFound'));
        } else if (response.status === 409) {
          throw new Error(t('errors.conflict'));
        }
        throw new Error(t('errors.updateFailed'));
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('error.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar slug automaticamente quando o título em português muda
  const handleTitleChange = useCallback(
    (locale: 'pt' | 'es' | 'it', value: string) => {
      setFormData(prev => ({
        ...prev,
        translations: {
          ...prev.translations,
          [locale]: {
            ...prev.translations[locale],
            title: value,
          },
        },
        // Atualizar slug quando título português muda
        ...(locale === 'pt' && { slug: generateSlug(value) }),
      }));
    },
    []
  );

  // Buscar dados do vídeo quando modal abre
  useEffect(() => {
    if (isOpen && courseId && lessonId && videoId) {
      fetchVideoData();
    }
  }, [isOpen, courseId, lessonId, videoId, fetchVideoData]);

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

  if (!isOpen) return null;

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
            <Video size={28} className="text-secondary" />
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Loading state */}
        {loadingVideo ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <Loader2 size={24} className="animate-spin text-secondary" />
              <span className="text-white">{t('loading')}</span>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Hash size={16} className="inline mr-2" />
                    {t('fields.slug')}
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                      errors.slug ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder={t('placeholders.slug')}
                  />
                  {errors.slug && (
                    <p className="text-red-400 text-sm mt-1">{errors.slug}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{t('hints.slug')}</p>
                </div>

                {/* Provider Video ID - Somente Leitura */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Video size={16} className="inline mr-2" />
                    {t('fields.providerVideoId')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.providerVideoId}
                      readOnly
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed pr-12"
                      placeholder={t('placeholders.providerVideoId')}
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.providerVideoId, 'providerVideoId')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
                      title={t('copyToClipboard')}
                    >
                      {copiedField === 'providerVideoId' ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('hints.providerVideoIdReadOnly')}</p>
                </div>

                {/* Duration - Somente Leitura */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock size={16} className="inline mr-2" />
                    {t('fields.duration')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={`${formData.durationInSeconds} ${t('seconds')}`}
                      readOnly
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed pr-12"
                      placeholder={t('placeholders.duration')}
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.durationInSeconds.toString(), 'duration')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-all"
                      title={t('copyToClipboard')}
                    >
                      {copiedField === 'duration' ? (
                        <Check size={16} className="text-green-400" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('hints.durationReadOnly')} ({formatDuration(formData.durationInSeconds)})
                  </p>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <ImageIcon size={16} className="inline mr-2" />
                    {t('fields.imageUrl')}
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary"
                    placeholder={t('placeholders.imageUrl')}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('hints.imageUrl')}</p>
                </div>
              </div>

              {/* Traduções */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe size={20} />
                  {t('translations.title')}
                </h3>

                {(['pt', 'es', 'it'] as const).map(loc => (
                  <div
                    key={loc}
                    className="border border-gray-700 rounded-lg p-4 transition-colors"
                  >
                    <h5 className="text-white font-medium mb-4 flex items-center gap-2">
                      {loc === 'pt' ? '🇧🇷' : loc === 'es' ? '🇪🇸' : '🇮🇹'}
                      {t(`translations.${loc === 'pt' ? 'portuguese' : loc === 'es' ? 'spanish' : 'italian'}`)}
                    </h5>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Título */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Type size={16} className="inline mr-2" />
                          {t('fields.title')}
                        </label>
                        <input
                          type="text"
                          value={formData.translations[loc].title}
                          onChange={e => handleTitleChange(loc, e.target.value)}
                          className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary ${
                            errors[`title_${loc}`] ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder={t('placeholders.title')}
                        />
                        {errors[`title_${loc}`] && (
                          <p className="text-red-400 text-sm mt-1">{errors[`title_${loc}`]}</p>
                        )}
                      </div>

                      {/* Descrição */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <FileText size={16} className="inline mr-2" />
                          {t('fields.description')}
                        </label>
                        <textarea
                          value={formData.translations[loc].description}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              translations: {
                                ...prev.translations,
                                [loc]: {
                                  ...prev.translations[loc],
                                  description: e.target.value,
                                },
                              },
                            }))
                          }
                          className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary resize-none ${
                            errors[`description_${loc}`] ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder={t('placeholders.description')}
                          rows={3}
                        />
                        {errors[`description_${loc}`] && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors[`description_${loc}`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        )}

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
            disabled={loading || loadingVideo}
            className="px-6 py-2 bg-secondary text-primary font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}