'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  Video,
  Calendar,
  Clock,
  Globe,
  Hash,
  Copy,
  Timer,
  Play,
  ExternalLink,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface VideoViewData {
  id: string;
  slug: string;
  providerVideoId: string;
  durationInSeconds: number;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface VideoViewModalProps {
  courseId: string | null;
  lessonId: string | null;
  videoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoViewModal({
  courseId,
  lessonId,
  videoId,
  isOpen,
  onClose,
}: VideoViewModalProps) {
  const t = useTranslations('Admin.videoView');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [video, setVideo] = useState<VideoViewData | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Debug log
  console.log('VideoViewModal props:', {
    courseId,
    lessonId,
    videoId,
    isOpen,
  });

  // Buscar detalhes do vídeo
  const fetchVideoDetails =
    useCallback(async (): Promise<void> => {
      if (!courseId || !lessonId || !videoId) return;

      setLoading(true);
      try {
        const videoResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/lessons/${lessonId}/videos/${videoId}`
        );

        if (!videoResponse.ok) {
          throw new Error('Erro ao buscar vídeo');
        }

        const videoData: VideoViewData =
          await videoResponse.json();
        setVideo(videoData);
      } catch (error) {
        console.error(
          'Erro ao carregar detalhes do vídeo:',
          error
        );
        toast({
          title: t('error.fetchTitle'),
          description: t('error.fetchDescription'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }, [courseId, lessonId, videoId, t, toast]);

  // Buscar dados quando abrir o modal
  useEffect(() => {
    if (isOpen && courseId && lessonId && videoId) {
      fetchVideoDetails();
    }
  }, [
    isOpen,
    courseId,
    lessonId,
    videoId,
    fetchVideoDetails,
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

  // Copiar texto para área de transferência
  const copyToClipboard = async (
    text: string,
    field: string
  ): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('copySuccess'),
        description: `${field} ${t('copyDescription')}`,
      });
    } catch (copyError) {
      console.error(
        'Erro ao copiar para área de transferência:',
        copyError
      );
      toast({
        title: t('copyError'),
        description: t('copyErrorDescription'),
        variant: 'destructive',
      });
    }
  };

  // Obter tradução por locale
  const getTranslationByLocale = (
    translations: Translation[],
    targetLocale: string
  ): Translation => {
    return (
      translations.find(tr => tr.locale === targetLocale) ||
      translations[0]
    );
  };

  // Obter tradução específica por locale
  const getTranslationForLocale = (
    translations: Translation[],
    targetLocale: string
  ): Translation | undefined => {
    return translations.find(
      tr => tr.locale === targetLocale
    );
  };

  // Formatar duração do vídeo
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Formatar duração detalhada
  const formatDetailedDuration = (
    seconds: number
  ): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes
        .toString()
        .padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  if (!isOpen) {
    console.log(
      'VideoViewModal: isOpen is false, returning null'
    );
    return null;
  }

  console.log('VideoViewModal: rendering modal');

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
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-48 bg-gray-700 rounded-lg"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ) : video ? (
            <div className="space-y-6">
              {/* Preview do Vídeo */}
              <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <Play
                    size={48}
                    className="text-red-500 mx-auto mb-2"
                  />
                  <p className="text-white font-medium">
                    {getTranslationByLocale(
                      video.translations,
                      locale
                    )?.title || t('noTitle')}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {formatDuration(
                      video.durationInSeconds
                    )}
                  </p>
                </div>
              </div>

              {/* Informações básicas */}
              <div className="space-y-4">
                {/* ID do Vídeo */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Hash
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.id')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono">
                      {video.id}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(video.id, 'ID')
                      }
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Slug */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Hash
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.slug')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono">
                      {video.slug}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(video.slug, 'Slug')
                      }
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Provider Video ID */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ExternalLink
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.providerVideoId')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono truncate max-w-xs">
                      {video.providerVideoId}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          video.providerVideoId,
                          'Provider ID'
                        )
                      }
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Duração */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Timer
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.duration')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-white font-medium">
                      {formatDuration(
                        video.durationInSeconds
                      )}
                    </span>
                    <div className="text-xs text-gray-400">
                      (
                      {formatDetailedDuration(
                        video.durationInSeconds
                      )}
                      )
                    </div>
                  </div>
                </div>

                {/* Duração em Segundos */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.durationInSeconds')}
                    </span>
                  </div>
                  <span className="text-sm text-white font-medium">
                    {video.durationInSeconds}{' '}
                    {t('fields.seconds')}
                  </span>
                </div>

                {/* Data de Criação */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.createdAt')}
                    </span>
                  </div>
                  <span className="text-sm text-white">
                    {new Date(
                      video.createdAt
                    ).toLocaleString(locale)}
                  </span>
                </div>

                {/* Última Atualização */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.updatedAt')}
                    </span>
                  </div>
                  <span className="text-sm text-white">
                    {new Date(
                      video.updatedAt
                    ).toLocaleString(locale)}
                  </span>
                </div>
              </div>

              {/* Traduções do Vídeo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe size={20} />
                  {t('translations.title')}
                </h3>

                <div className="grid gap-4">
                  {/* Português */}
                  {getTranslationForLocale(
                    video.translations,
                    'pt'
                  ) && (
                    <div className="border border-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        🇧🇷 {t('translations.portuguese')}
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-400">
                            {t('fields.title')}:
                          </span>{' '}
                          <span className="text-white">
                            {
                              getTranslationForLocale(
                                video.translations,
                                'pt'
                              )?.title
                            }
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">
                            {t('fields.description')}:
                          </span>{' '}
                          <span className="text-white">
                            {
                              getTranslationForLocale(
                                video.translations,
                                'pt'
                              )?.description
                            }
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Espanhol */}
                  {getTranslationForLocale(
                    video.translations,
                    'es'
                  ) && (
                    <div className="border border-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        🇪🇸 {t('translations.spanish')}
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-400">
                            {t('fields.title')}:
                          </span>{' '}
                          <span className="text-white">
                            {
                              getTranslationForLocale(
                                video.translations,
                                'es'
                              )?.title
                            }
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">
                            {t('fields.description')}:
                          </span>{' '}
                          <span className="text-white">
                            {
                              getTranslationForLocale(
                                video.translations,
                                'es'
                              )?.description
                            }
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Italiano */}
                  {getTranslationForLocale(
                    video.translations,
                    'it'
                  ) && (
                    <div className="border border-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        🇮🇹 {t('translations.italian')}
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-400">
                            {t('fields.title')}:
                          </span>{' '}
                          <span className="text-white">
                            {
                              getTranslationForLocale(
                                video.translations,
                                'it'
                              )?.title
                            }
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">
                            {t('fields.description')}:
                          </span>{' '}
                          <span className="text-white">
                            {
                              getTranslationForLocale(
                                video.translations,
                                'it'
                              )?.description
                            }
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Video
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-gray-400">
                {t('videoNotFound')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
