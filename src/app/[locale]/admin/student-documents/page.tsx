// /src/app/[locale]/admin/student-documents/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import StudentDocumentsList from '@/components/StudentDocumentsList';
import Link from 'next/link';

export default function StudentDocumentsPage() {
  const t = useTranslations('Admin.studentDocuments');
  const router = useRouter();
  const { isAdmin, isDocumentAnalyst, isAuthenticated, isLoading } = useAuth();

  // Redirect if not authorized
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin && !isDocumentAnalyst) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, isAdmin, isDocumentAnalyst, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAdmin && !isDocumentAnalyst) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            {t('backToAdmin')}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('pageTitle')}</h1>
          <p className="text-gray-400 mt-2">{t('pageDescription')}</p>
        </div>

        {/* Content */}
        <div className="bg-gray-800/50 rounded-xl p-6 shadow-xl">
          <StudentDocumentsList />
        </div>
      </div>
    </div>
  );
}
