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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">slug:</span>
                    <span className="text-sm text-secondary font-mono bg-gray-800 px-2 py-1 rounded">
                      {env.slug}
                    </span>
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
