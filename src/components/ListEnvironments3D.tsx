// /src/components/ListEnvironments3D.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Box,
  Loader2,
  AlertCircle,
  Eye,
  X,
  Calendar,
  Globe,
} from 'lucide-react';

interface Translation {
  locale: 'pt' | 'it' | 'es';
  title: string;
  description: string | null;
}

interface Environment3D {
  id: string;
  slug: string;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

export default function ListEnvironments3D() {
  const t = useTranslations('Admin.listEnvironments3D');
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const [environments, setEnvironments] = useState<Environment3D[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnv, setSelectedEnv] = useState<Environment3D | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEnvironments = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/environments-3d`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch environments: ${response.status}`);
      }

      const data = await response.json();
      setEnvironments(data);
    } catch (error) {
      console.error('Error fetching environments:', error);
      toast({
        title: t('error.fetchTitle'),
        description: t('error.fetchDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const getTranslationByLocale = useCallback(
    (translations: Translation[], targetLocale: string): Translation | undefined => {
      return translations.find(tr => tr.locale === targetLocale) || translations[0];
    },
    []
  );

  const fetchEnvironmentDetails = useCallback(async (id: string) => {
    setLoadingDetails(true);
    setIsModalOpen(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
      const response = await fetch(`${apiUrl}/api/v1/environments-3d/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        throw new Error(t('error.notFound'));
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch environment: ${response.status}`);
      }

      const data = await response.json();
      setSelectedEnv(data);
    } catch (error) {
      console.error('Error fetching environment details:', error);
      toast({
        title: t('error.fetchDetailsTitle'),
        description: t('error.fetchDetailsDescription'),
        variant: 'destructive',
      });
      setIsModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  }, [t, toast]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEnv(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Box size={24} className="text-secondary" />
            {t('title')}
          </h3>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-secondary animate-spin" />
            <span className="ml-2 text-gray-400 text-sm">{t('loading')}</span>
          </div>
        ) : environments.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto mb-3 text-gray-500" size={32} />
            <p className="text-gray-400 text-sm">{t('noEnvironments')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {environments.map(env => {
              const translation = getTranslationByLocale(env.translations, locale);
              return (
                <div
                  key={env.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <span className="text-white font-medium">
                    {translation?.title || 'Sem título'}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">slug:</span>
                      <span className="text-sm text-secondary font-mono bg-gray-800 px-2 py-1 rounded">
                        {env.slug}
                      </span>
                    </div>
                    <button
                      onClick={() => fetchEnvironmentDetails(env.id)}
                      className="p-2 text-gray-400 hover:text-secondary hover:bg-gray-700 rounded-lg transition-colors"
                      title={t('view')}
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-2xl mx-4 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Box size={20} className="text-secondary" />
                {t('modal.title')}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-secondary animate-spin" />
                  <span className="ml-3 text-gray-400">{t('modal.loading')}</span>
                </div>
              ) : selectedEnv ? (
                <div className="space-y-6">
                  {/* Slug */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Slug</label>
                    <p className="text-secondary font-mono text-lg mt-1">{selectedEnv.slug}</p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={12} />
                        {t('modal.createdAt')}
                      </label>
                      <p className="text-gray-300 text-sm mt-1">{formatDate(selectedEnv.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Calendar size={12} />
                        {t('modal.updatedAt')}
                      </label>
                      <p className="text-gray-300 text-sm mt-1">{formatDate(selectedEnv.updatedAt)}</p>
                    </div>
                  </div>

                  {/* Translations */}
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-3">
                      <Globe size={12} />
                      {t('modal.translations')}
                    </label>
                    <div className="space-y-3">
                      {selectedEnv.translations.map(tr => (
                        <div
                          key={tr.locale}
                          className="p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {tr.locale === 'pt' ? '🇧🇷' : tr.locale === 'it' ? '🇮🇹' : '🇪🇸'}
                            </span>
                            <span className="text-xs text-gray-400 uppercase font-semibold">
                              {tr.locale === 'pt' ? 'Português' : tr.locale === 'it' ? 'Italiano' : 'Español'}
                            </span>
                          </div>
                          <p className="text-white font-medium">{tr.title}</p>
                          {tr.description && (
                            <p className="text-gray-400 text-sm mt-1">{tr.description}</p>
                          )}
                          {!tr.description && (
                            <p className="text-gray-600 text-sm mt-1 italic">{t('modal.noDescription')}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {t('modal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
