// /src/components/DocumentViewModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  X,
  FileText,
  Calendar,
  Clock,
  Globe,
  Hash,
  Copy,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
  url: string;
}

type ProtectionLevel = 'NONE' | 'WATERMARK' | 'FULL';

interface DocumentViewData {
  id: string;
  filename: string;
  protectionLevel?: ProtectionLevel;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentViewModalProps {
  lessonId: string | null;
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewModal({
  lessonId,
  documentId,
  isOpen,
  onClose,
}: DocumentViewModalProps) {
  const t = useTranslations('Admin.documentView');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [documentData, setDocumentData] =
    useState<DocumentViewData | null>(null);
  const [loading, setLoading] = useState(false);

  // Debug log
  console.log('DocumentViewModal props:', {
    lessonId,
    documentId,
    isOpen,
  });

  // Buscar detalhes do documento
  const fetchDocumentDetails =
    useCallback(async (): Promise<void> => {
      if (!lessonId || !documentId) return;

      setLoading(true);
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lessons/${lessonId}/documents/${documentId}`;
        console.log('🔍 [DocumentViewModal] Fetching document from:', apiUrl);

        const documentResponse = await fetch(apiUrl);

        console.log('📡 [DocumentViewModal] Response status:', documentResponse.status, documentResponse.statusText);

        if (!documentResponse.ok) {
          throw new Error('Erro ao buscar documento');
        }

        const documentData: DocumentViewData =
          await documentResponse.json();

        console.log('📦 [DocumentViewModal] RAW RESPONSE FROM BACKEND:', JSON.stringify(documentData, null, 2));
        console.log('🔐 [DocumentViewModal] protectionLevel field:', documentData.protectionLevel);

        setDocumentData(documentData);
      } catch (error) {
        console.error(
          'Erro ao carregar detalhes do documento:',
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
    }, [lessonId, documentId, t, toast]);

  // Buscar dados quando abrir o modal
  useEffect(() => {
    if (isOpen && lessonId && documentId) {
      fetchDocumentDetails();
    }
  }, [isOpen, lessonId, documentId, fetchDocumentDetails]);

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


  // Obter extensão do arquivo
  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  // Obter propriedades de estilo do nível de proteção
  const getProtectionLevelStyle = (level?: ProtectionLevel) => {
    switch (level) {
      case 'NONE':
        return {
          icon: ShieldAlert,
          color: 'text-gray-400',
          bgColor: 'bg-gray-700/50',
          borderColor: 'border-gray-600',
          label: t('protectionLevel.none'),
        };
      case 'WATERMARK':
        return {
          icon: Shield,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/50',
          label: t('protectionLevel.watermark'),
        };
      case 'FULL':
        return {
          icon: ShieldCheck,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/50',
          label: t('protectionLevel.full'),
        };
      default:
        return {
          icon: Shield,
          color: 'text-gray-400',
          bgColor: 'bg-gray-700/50',
          borderColor: 'border-gray-600',
          label: t('protectionLevel.unknown') || 'Desconhecido',
        };
    }
  };

  if (!isOpen) {
    console.log(
      'DocumentViewModal: isOpen is false, returning null'
    );
    return null;
  }

  console.log('DocumentViewModal: rendering modal');

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
            <FileText
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
          ) : documentData ? (
            <div className="space-y-6">
              {/* Preview do Documento */}
              <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative">
                    <FileText
                      size={48}
                      className="text-blue-500 mx-auto mb-2"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                      {getFileExtension(
                        documentData.filename
                      )}
                    </div>
                  </div>
                  <p className="text-white font-medium">
                    {getTranslationByLocale(
                      documentData.translations,
                      locale
                    )?.title || t('noTitle')}
                  </p>
                </div>
              </div>

              {/* Informações básicas */}
              <div className="space-y-4">
                {/* ID do Documento */}
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
                      {documentData.id}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          documentData.id,
                          'ID'
                        )
                      }
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Nome do Arquivo */}
                <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText
                      size={16}
                      className="text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {t('fields.filename')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-white font-mono">
                      {documentData.filename}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          documentData.filename,
                          'Filename'
                        )
                      }
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {/* Nível de Proteção */}
                {documentData.protectionLevel && (
                  <div className={`p-4 rounded-lg border ${getProtectionLevelStyle(documentData.protectionLevel).bgColor} ${getProtectionLevelStyle(documentData.protectionLevel).borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const ProtectionIcon = getProtectionLevelStyle(documentData.protectionLevel).icon;
                          return (
                            <ProtectionIcon
                              size={20}
                              className={getProtectionLevelStyle(documentData.protectionLevel).color}
                            />
                          );
                        })()}
                        <div>
                          <p className="text-sm font-medium text-gray-300">
                            {t('fields.protectionLevel')}
                          </p>
                          <p className={`text-base font-semibold ${getProtectionLevelStyle(documentData.protectionLevel).color}`}>
                            {documentData.protectionLevel}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 max-w-xs">
                          {getProtectionLevelStyle(documentData.protectionLevel).label}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                      documentData.createdAt
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
                      documentData.updatedAt
                    ).toLocaleString(locale)}
                  </span>
                </div>
              </div>

              {/* Traduções do Documento */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe size={20} />
                  {t('translations.title')}
                </h3>

                <div className="grid gap-4">
                  {/* Português */}
                  {getTranslationForLocale(
                    documentData.translations,
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
                                documentData.translations,
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
                                documentData.translations,
                                'pt'
                              )?.description
                            }
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">
                            {t('fields.url')}:
                          </span>{' '}
                          <code className="text-blue-400 text-xs">
                            {
                              getTranslationForLocale(
                                documentData.translations,
                                'pt'
                              )?.url
                            }
                          </code>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Espanhol */}
                  {getTranslationForLocale(
                    documentData.translations,
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
                                documentData.translations,
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
                                documentData.translations,
                                'es'
                              )?.description
                            }
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">
                            {t('fields.url')}:
                          </span>{' '}
                          <code className="text-blue-400 text-xs">
                            {
                              getTranslationForLocale(
                                documentData.translations,
                                'es'
                              )?.url
                            }
                          </code>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Italiano */}
                  {getTranslationForLocale(
                    documentData.translations,
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
                                documentData.translations,
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
                                documentData.translations,
                                'it'
                              )?.description
                            }
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">
                            {t('fields.url')}:
                          </span>{' '}
                          <code className="text-blue-400 text-xs">
                            {
                              getTranslationForLocale(
                                documentData.translations,
                                'it'
                              )?.url
                            }
                          </code>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-gray-400">
                {t('documentNotFound')}
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
