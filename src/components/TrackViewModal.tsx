// /src/components/TrackViewModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  Route,
  Link,
  Image as ImageIcon,
  Calendar,
  Clock,
  Globe,
  Hash,
  BookOpen,
  Copy,
} from 'lucide-react';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}

interface TrackCourse {
  course: Course;
}

interface TrackViewData {
  id: string;
  slug: string;
  imageUrl: string;
  order: number;
  courseIds: string[];
  translations: Translation[];
  courses?: Course[];
  trackCourses?: TrackCourse[];
  createdAt?: string;
  updatedAt?: string;
}

interface TrackViewModalProps {
  trackId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrackViewModal({
  trackId,
  isOpen,
  onClose,
}: TrackViewModalProps) {
  const t = useTranslations('Admin.trackView');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [track, setTrack] = useState<TrackViewData | null>(
    null
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar detalhes da trilha
  const fetchTrackDetails =
    useCallback(async (): Promise<void> => {
      if (!trackId) return;

      setLoading(true);
      try {
        // Buscar trilha com detalhes completos
        const trackResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks/${trackId}`
        );

        if (!trackResponse.ok) {
          throw new Error('Erro ao buscar trilha');
        }

        const trackData: TrackViewData =
          await trackResponse.json();

        async function fetchCoursesByIds(
          ids: string[]
        ): Promise<Course[]> {
          const requests = ids.map(id =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${id}`
            ).then(res => {
              if (!res.ok)
                throw new Error(
                  `Curso ${id} não encontrado`
                );
              return res.json() as Promise<Course>;
            })
          );
          return Promise.all(requests);
        }

        const detailedCourses = await fetchCoursesByIds(
          trackData.courseIds || []
        );
        setCourses(detailedCourses);

        setTrack(trackData);
        setCourseIds(trackData.courseIds || []);
      } catch (error) {
        console.error(
          'Erro ao carregar detalhes da trilha:',
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
    }, [trackId, t, toast]);

  // Buscar dados quando abrir o modal
  useEffect(() => {
    if (isOpen && trackId) {
      fetchTrackDetails();
    }
  }, [isOpen, trackId, fetchTrackDetails]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Route size={28} className="text-secondary" />
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
          ) : track ? (
            <div className="space-y-6">
              {/* Imagem da trilha */}
              <div className="relative h-48 w-full rounded-lg overflow-hidden">
                <Image
                  src={track.imageUrl}
                  alt={
                    getTranslationByLocale(
                      track.translations,
                      locale
                    )?.title || ''
                  }
                  fill
                  className="object-cover"
                />
              </div>

              {/* Informações básicas */}
              <div className="space-y-4">
                {/* ID */}
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
                      {track.id}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(track.id, 'ID')
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
                    <Link
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.slug')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono">
                      {track.slug}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(track.slug, 'Slug')
                      }
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Order */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Hash
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.order')}
                    </span>
                  </div>
                  <span className="text-sm text-white font-mono">
                    {track.order}
                  </span>
                </div>

                {/* URL da Imagem */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ImageIcon
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.imageUrl')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono truncate max-w-xs">
                      {track.imageUrl}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          track.imageUrl,
                          'URL'
                        )
                      }
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Data de Criação */}
                {track.createdAt && (
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
                        track.createdAt
                      ).toLocaleString(locale)}
                    </span>
                  </div>
                )}

                {/* Última Atualização */}
                {track.updatedAt && (
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
                        track.updatedAt
                      ).toLocaleString(locale)}
                    </span>
                  </div>
                )}
              </div>

              {/* Traduções */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe size={20} />
                  {t('translations.title')}
                </h3>

                <div className="grid gap-4">
                  {/* Português */}
                  {getTranslationForLocale(
                    track.translations,
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
                                track.translations,
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
                                track.translations,
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
                    track.translations,
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
                                track.translations,
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
                                track.translations,
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
                    track.translations,
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
                                track.translations,
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
                                track.translations,
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

              {/* Cursos da Trilha */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen size={20} />
                  {t('courses.title')} ({courseIds.length})
                </h3>

                {courseIds.length > 0 ? (
                  <div className="grid gap-3">
                    {courses.map(course => {
                      const courseTranslation =
                        getTranslationByLocale(
                          course.translations,
                          locale
                        );
                      return (
                        <div
                          key={course.id}
                          className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
                        >
                          <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0">
                            <Image
                              src={course.imageUrl}
                              alt={
                                courseTranslation?.title ||
                                ''
                              }
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium">
                              {courseTranslation?.title ||
                                'Sem título'}
                            </h4>
                            <p className="text-sm text-gray-400 line-clamp-1">
                              {courseTranslation?.description ||
                                'Sem descrição'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Slug: {course.slug}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    {t('courses.noCourses')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Route
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-gray-400">
                {t('trackNotFound')}
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
