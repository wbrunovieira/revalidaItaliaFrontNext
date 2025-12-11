'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { environment3DRegistry, Environment3DProps } from './registry';
import { LoadingSpinner3D, ErrorBoundary3D } from './common';
import { AlertTriangle } from 'lucide-react';

interface Environment3DLoaderProps extends Environment3DProps {
  slug: string;
}

function Environment3DNotFound({ slug, message }: { slug: string; message: string }) {
  return (
    <div className="w-full h-[70vh] bg-black rounded-lg flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-yellow-500" />
      </div>
      <p className="text-gray-400 text-sm text-center">
        {message}
      </p>
      <p className="text-gray-600 text-xs font-mono">
        slug: {slug}
      </p>
    </div>
  );
}

export default function Environment3DLoader({ slug, ...props }: Environment3DLoaderProps) {
  const t = useTranslations('Environment3D');
  const loader = environment3DRegistry[slug];

  if (!loader) {
    return <Environment3DNotFound slug={slug} message={t('error.notFound')} />;
  }

  const Environment3D = dynamic(loader, {
    ssr: false,
    loading: () => <LoadingSpinner3D message={t('loading.message')} />,
  });

  return (
    <ErrorBoundary3D fallbackMessage={t('error.loadFailed')} retryText={t('error.retry')}>
      <Suspense fallback={<LoadingSpinner3D message={t('loading.message')} />}>
        <Environment3D {...props} />
      </Suspense>
    </ErrorBoundary3D>
  );
}
