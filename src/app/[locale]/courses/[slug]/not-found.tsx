// src/app/[locale]/courses/[slug]/not-found.tsx

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('Course');

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="text-center">
        <Search
          size={64}
          className="text-gray-500 mx-auto mb-6"
        />
        <h1 className="text-4xl font-bold text-white mb-4">
          {t('notFound.title')}
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-md">
          {t('notFound.description')}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-secondary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
        >
          <ArrowLeft size={20} />
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
