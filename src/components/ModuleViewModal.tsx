// /src/components/ModuleViewModal.tsx
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
  Lock,
  Unlock,
} from 'lucide-react';
import Image from 'next/image';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface ModuleViewData {
  id: string;
  slug: string;
  imageUrl: string;
  order: number;
  immediateAccess?: boolean;
  unlockAfterDays?: number;
  translations: Translation[];
  createdAt?: string;
  updatedAt?: string;
}

interface ModuleViewModalProps {
  courseId: string | null;
  moduleId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ModuleViewModal({
  courseId,
  moduleId,
  isOpen,
  onClose,
}: ModuleViewModalProps) {
  const t = useTranslations('Admin.moduleView');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [module, setModule] =
    useState<ModuleViewData | null>(null);
  const [loading, setLoading] = useState(false);

  // Função para obter token do cookie
  const getToken = useCallback(() => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
  }, []);

  // Buscar detalhes do módulo
  const fetchModuleDetails =
    useCallback(async (): Promise<void> => {
      if (!courseId || !moduleId) return;

      setLoading(true);
      try {
        const token = getToken();
        const moduleResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/modules/${moduleId}`,
          {
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          }
        );

        if (!moduleResponse.ok) {
          throw new Error('Erro ao buscar módulo');
        }

        const moduleData: ModuleViewData =
          await moduleResponse.json();
        setModule(moduleData);
      } catch (error) {
        console.error(
          'Erro ao carregar detalhes do módulo:',
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
    }, [courseId, moduleId, t, toast, getToken]);

  // Buscar dados quando abrir o modal
  useEffect(() => {
    if (isOpen && courseId && moduleId) {
      fetchModuleDetails();
    }
  }, [isOpen, courseId, moduleId, fetchModuleDetails]);

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
          ) : module ? (
            <div className="space-y-6">
              {/* Imagem do módulo */}
              <div className="relative h-48 w-full rounded-lg overflow-hidden">
                <Image
                  src={module.imageUrl}
                  alt={
                    getTranslationByLocale(
                      module.translations,
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
                      {module.id}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(module.id, 'ID')
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
                      {module.slug}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(module.slug, 'Slug')
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">
                      {module.order}
                    </span>
                  </div>
                </div>

                {/* Access Control */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {module.immediateAccess !== false ? (
                      <Unlock size={16} className="text-green-400" />
                    ) : (
                      <Lock size={16} className="text-yellow-400" />
                    )}
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.accessControl')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {module.immediateAccess !== false ? (
                      <span className="text-sm text-green-400 font-medium">
                        {t('accessControl.immediate')}
                      </span>
                    ) : (
                      <span className="text-sm text-yellow-400 font-medium">
                        {t('accessControl.delayed', { days: module.unlockAfterDays ?? 0 })}
                      </span>
                    )}
                  </div>
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
                      {module.imageUrl}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          module.imageUrl,
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
                {module.createdAt && (
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
                        module.createdAt
                      ).toLocaleString(locale)}
                    </span>
                  </div>
                )}

                {/* Última Atualização */}
                {module.updatedAt && (
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
                        module.updatedAt
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
                    module.translations,
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
                                module.translations,
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
                                module.translations,
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
                    module.translations,
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
                                module.translations,
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
                                module.translations,
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
                    module.translations,
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
                                module.translations,
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
                                module.translations,
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
              <BookOpen
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-gray-400">
                {t('moduleNotFound')}
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
