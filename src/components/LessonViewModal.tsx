'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  BookOpen,
  Link,
  Image as ImageIcon,
  Calendar,
  Clock,
  Globe,
  Hash,
  ListOrdered,
  Copy,
  Video,
  Timer,
  FileText,
  MessageSquare,
  CreditCard,
  Eye,
  EyeOff,
} from 'lucide-react';
import Image from 'next/image';

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
  isSeen: boolean;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface LessonViewData {
  id: string;
  moduleId: string;
  order: number;
  flashcardIds: string[];
  quizIds: string[];
  commentIds: string[];
  imageUrl: string;
  translations: Translation[];
  video: VideoData;
  createdAt: string;
  updatedAt: string;
}

interface LessonViewModalProps {
  courseId: string | null;
  moduleId: string | null;
  lessonId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LessonViewModal({
  courseId,
  moduleId,
  lessonId,
  isOpen,
  onClose,
}: LessonViewModalProps) {
  const t = useTranslations('Admin.lessonView');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [lesson, setLesson] =
    useState<LessonViewData | null>(null);
  const [loading, setLoading] = useState(false);

  // Buscar detalhes da lição
  const fetchLessonDetails =
    useCallback(async (): Promise<void> => {
      if (!courseId || !moduleId || !lessonId) return;

      setLoading(true);
      try {
        const lessonResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
        );

        if (!lessonResponse.ok) {
          throw new Error('Erro ao buscar lição');
        }

        const lessonData: LessonViewData =
          await lessonResponse.json();
        setLesson(lessonData);
      } catch (error) {
        console.error(
          'Erro ao carregar detalhes da lição:',
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
    }, [courseId, moduleId, lessonId, t, toast]);

  // Buscar dados quando abrir o modal
  useEffect(() => {
    if (isOpen && courseId && moduleId && lessonId) {
      fetchLessonDetails();
    }
  }, [
    isOpen,
    courseId,
    moduleId,
    lessonId,
    fetchLessonDetails,
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
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-48 bg-gray-700 rounded-lg"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ) : lesson ? (
            <div className="space-y-6">
              {/* Imagem da lição */}
              <div className="relative h-48 w-full rounded-lg overflow-hidden">
                <Image
                  src={lesson.imageUrl}
                  alt={
                    getTranslationByLocale(
                      lesson.translations,
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
                      {lesson.id}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(lesson.id, 'ID')
                      }
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Module ID */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Hash
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.moduleId')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono">
                      {lesson.moduleId}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          lesson.moduleId,
                          'Module ID'
                        )
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
                    <ListOrdered
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.order')}
                    </span>
                  </div>
                  <span className="text-sm text-white font-medium">
                    {lesson.order}
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
                      {lesson.imageUrl}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          lesson.imageUrl,
                          'URL'
                        )
                      }
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Flashcards */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.flashcards')}
                    </span>
                  </div>
                  <span className="text-sm text-white font-medium">
                    {lesson.flashcardIds.length}{' '}
                    {t('fields.flashcardsCount')}
                  </span>
                </div>

                {/* Quizzes */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.quizzes')}
                    </span>
                  </div>
                  <span className="text-sm text-white font-medium">
                    {lesson.quizIds.length}{' '}
                    {t('fields.quizzesCount')}
                  </span>
                </div>

                {/* Comments */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.comments')}
                    </span>
                  </div>
                  <span className="text-sm text-white font-medium">
                    {lesson.commentIds.length}{' '}
                    {t('fields.commentsCount')}
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
                      lesson.createdAt
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
                      lesson.updatedAt
                    ).toLocaleString(locale)}
                  </span>
                </div>
              </div>

              {/* Informações do Vídeo */}
              {lesson.video && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Video size={20} />
                    {t('video.title')}
                  </h3>

                  <div className="border border-gray-700 rounded-lg p-4 space-y-3">
                    {/* Video ID */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {t('video.fields.id')}:
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-white font-mono">
                          {lesson.video.id}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              lesson.video.id,
                              'Video ID'
                            )
                          }
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Video Slug */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {t('video.fields.slug')}:
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-white font-mono">
                          {lesson.video.slug}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              lesson.video.slug,
                              'Video Slug'
                            )
                          }
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Provider Video ID */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">
                        {t('video.fields.providerVideoId')}:
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-white font-mono truncate max-w-[200px]">
                          {lesson.video.providerVideoId}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              lesson.video.providerVideoId,
                              'Provider ID'
                            )
                          }
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 flex items-center gap-2">
                        <Timer size={14} />
                        {t('video.fields.duration')}:
                      </span>
                      <span className="text-sm text-white">
                        {formatDuration(
                          lesson.video.durationInSeconds
                        )}
                      </span>
                    </div>

                    {/* Is Seen */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400 flex items-center gap-2">
                        {lesson.video.isSeen ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} />
                        )}
                        {t('video.fields.status')}:
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          lesson.video.isSeen
                            ? 'text-green-400'
                            : 'text-gray-400'
                        }`}
                      >
                        {lesson.video.isSeen
                          ? t('video.fields.seen')
                          : t('video.fields.notSeen')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Traduções da Lição */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe size={20} />
                  {t('translations.title')}
                </h3>

                <div className="grid gap-4">
                  {/* Português */}
                  {getTranslationForLocale(
                    lesson.translations,
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
                                lesson.translations,
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
                                lesson.translations,
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
                    lesson.translations,
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
                                lesson.translations,
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
                                lesson.translations,
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
                    lesson.translations,
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
                                lesson.translations,
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
                                lesson.translations,
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

              {/* Traduções do Vídeo */}
              {lesson.video &&
                lesson.video.translations && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Globe size={20} />
                      {t('video.translations.title')}
                    </h3>

                    <div className="grid gap-4">
                      {/* Português */}
                      {getTranslationForLocale(
                        lesson.video.translations,
                        'pt'
                      ) && (
                        <div className="border border-gray-700 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            🇧🇷{' '}
                            {t('translations.portuguese')}
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="text-gray-400">
                                {t('fields.title')}:
                              </span>{' '}
                              <span className="text-white">
                                {
                                  getTranslationForLocale(
                                    lesson.video
                                      .translations,
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
                                    lesson.video
                                      .translations,
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
                        lesson.video.translations,
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
                                    lesson.video
                                      .translations,
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
                                    lesson.video
                                      .translations,
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
                        lesson.video.translations,
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
                                    lesson.video
                                      .translations,
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
                                    lesson.video
                                      .translations,
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
                )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-gray-400">
                {t('lessonNotFound')}
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
