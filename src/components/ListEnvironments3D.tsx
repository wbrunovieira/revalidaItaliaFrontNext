// /src/components/ListEnvironments3D.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Box,
  Search,
  RefreshCw,
  Calendar,
  Globe,
  Loader2,
  AlertCircle,
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredEnvironments = environments.filter(env => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const translation = getTranslationByLocale(env.translations, locale);
    return (
      env.slug.toLowerCase().includes(query) ||
      translation?.title.toLowerCase().includes(query) ||
      translation?.description?.toLowerCase().includes(query)
    );
  });

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Box size={24} className="text-secondary" />
              {t('title')}
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {t('description')}
            </p>
          </div>
          <button
            onClick={fetchEnvironments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {t('refresh')}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary"
          />
        </div>

        {/* Stats */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <p className="text-gray-300">
            {t('showing', { count: filteredEnvironments.length, total: environments.length })}
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-secondary animate-spin" />
            <span className="ml-3 text-gray-400">{t('loading')}</span>
          </div>
        ) : filteredEnvironments.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto mb-4 text-gray-500" size={48} />
            <p className="text-gray-400">
              {environments.length === 0 ? t('noEnvironments') : t('noResults')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnvironments.map(env => {
              const translation = getTranslationByLocale(env.translations, locale);
              return (
                <div
                  key={env.id}
                  className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:border-secondary/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white">
                        {translation?.title || 'Sem título'}
                      </h4>
                      {translation?.description && (
                        <p className="text-gray-400 text-sm mt-1">
                          {translation.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                          {env.slug}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} />
                          {formatDate(env.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Translation badges */}
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-gray-500" />
                      {env.translations.map(tr => (
                        <span
                          key={tr.locale}
                          className={`text-xs px-2 py-1 rounded ${
                            tr.locale === locale
                              ? 'bg-secondary/20 text-secondary'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {tr.locale.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* All translations preview */}
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <p className="text-xs text-gray-500 mb-2">{t('allTranslations')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {env.translations.map(tr => (
                        <div
                          key={tr.locale}
                          className="p-2 bg-gray-800 rounded text-sm"
                        >
                          <span className="text-gray-500 text-xs uppercase">
                            {tr.locale === 'pt' ? '🇧🇷' : tr.locale === 'it' ? '🇮🇹' : '🇪🇸'} {tr.locale}
                          </span>
                          <p className="text-white text-sm mt-1">{tr.title}</p>
                          {tr.description && (
                            <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">
                              {tr.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
