'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  BookOpen,
  Link,
  Image as ImageIcon,
  Calendar,
  Clock,
  Copy,
  Check,
  Globe,
  Type,
  FileText,
} from 'lucide-react';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface CourseDetails {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface CourseViewModalProps {
  courseId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function CourseViewModal({
  courseId,
  isOpen,
  onClose,
}: CourseViewModalProps) {
  const t = useTranslations('Admin.courseView');
  const { toast } = useToast();

  const [course, setCourse] =
    useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<
    string | null
  >(null);

  const copyToClipboard = useCallback(
    async (text: string, field: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast({
          title: t('copySuccess'),
          description: `${field} copiado para a área de transferência`,
        });
      } catch (error) {
        console.error(
          'Falha ao copiar para a área de transferência:',
          error
        );
        toast({
          title: t('copyError'),
          description:
            'Não foi possível copiar para a área de transferência',
          variant: 'destructive',
        });
      }
    },
    [t, toast]
  );

  const fetchCourseDetails = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch course details');
        }

        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error(error);
        toast({
          title: t('error.fetchTitle'),
          description: t('error.fetchDescription'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [t, toast]
  );

  useEffect(() => {
    if (isOpen && courseId) {
      fetchCourseDetails(courseId);
    } else {
      setCourse(null);
    }
  }, [isOpen, courseId, fetchCourseDetails]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="h-48 bg-gray-700 rounded"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-16 bg-gray-700 rounded"
                  ></div>
                ))}
              </div>
            </div>
          ) : course ? (
            <div className="space-y-6">
              {/* Imagem do curso */}
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={course.imageUrl}
                  alt={course.slug}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Informações básicas */}
              <div className="grid gap-4">
                {/* ID */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <BookOpen
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t('fields.id')}
                        </p>
                        <p className="text-white font-mono text-sm">
                          {course.id}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(course.id, 'ID')
                      }
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {copiedField === 'ID' ? (
                        <Check
                          size={16}
                          className="text-green-400"
                        />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Slug */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Link
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t('fields.slug')}
                        </p>
                        <p className="text-white font-mono">
                          {course.slug}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(course.slug, 'Slug')
                      }
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {copiedField === 'Slug' ? (
                        <Check
                          size={16}
                          className="text-green-400"
                        />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* URL da Imagem */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <ImageIcon
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t('fields.imageUrl')}
                        </p>
                        <p className="text-white text-sm truncate max-w-md">
                          {course.imageUrl}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          course.imageUrl,
                          'URL da Imagem'
                        )
                      }
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {copiedField === 'URL da Imagem' ? (
                        <Check
                          size={16}
                          className="text-green-400"
                        />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Calendar
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t('fields.createdAt')}
                        </p>
                        <p className="text-white">
                          {formatDate(course.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Clock
                          size={20}
                          className="text-secondary"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">
                          {t('fields.updatedAt')}
                        </p>
                        <p className="text-white">
                          {formatDate(course.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traduções */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-700 pb-3">
                  <Globe
                    size={24}
                    className="text-secondary"
                  />
                  <h4 className="text-xl font-bold text-white">
                    {t('translations.title')}
                  </h4>
                </div>

                <div className="space-y-4">
                  {/* Português */}
                  {course.translations.find(
                    t => t.locale === 'pt'
                  ) && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        🇧🇷 {t('translations.portuguese')}
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <Type size={16} />
                            {t('fields.title')}
                          </p>
                          <p className="text-white">
                            {
                              course.translations.find(
                                t => t.locale === 'pt'
                              )?.title
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <FileText size={16} />
                            {t('fields.description')}
                          </p>
                          <p className="text-white">
                            {
                              course.translations.find(
                                t => t.locale === 'pt'
                              )?.description
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Espanhol */}
                  {course.translations.find(
                    t => t.locale === 'es'
                  ) && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        🇪🇸 {t('translations.spanish')}
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <Type size={16} />
                            {t('fields.title')}
                          </p>
                          <p className="text-white">
                            {
                              course.translations.find(
                                t => t.locale === 'es'
                              )?.title
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <FileText size={16} />
                            {t('fields.description')}
                          </p>
                          <p className="text-white">
                            {
                              course.translations.find(
                                t => t.locale === 'es'
                              )?.description
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Italiano */}
                  {course.translations.find(
                    t => t.locale === 'it'
                  ) && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h5 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        🇮🇹 {t('translations.italian')}
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <Type size={16} />
                            {t('fields.title')}
                          </p>
                          <p className="text-white">
                            {
                              course.translations.find(
                                t => t.locale === 'it'
                              )?.title
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 flex items-center gap-2">
                            <FileText size={16} />
                            {t('fields.description')}
                          </p>
                          <p className="text-white">
                            {
                              course.translations.find(
                                t => t.locale === 'it'
                              )?.description
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-gray-400">
                {t('courseNotFound')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
