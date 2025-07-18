'use client';

import StudentAssessmentsPage from '@/components/StudentAssessmentsPage';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function AssessmentsPage({ params }: PageProps) {
  const router = useRouter();
  const { locale } = use(params);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const token = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          router.push(`/${locale}/login`);
          return;
        }

        // Decode JWT to get user ID (simple base64 decode for the payload)
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        
        if (decodedPayload.sub) {
          setUserId(decodedPayload.sub);
        } else {
          // If no user ID in token, redirect to login
          router.push(`/${locale}/login`);
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push(`/${locale}/login`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [locale, router]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-gray-300">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return <StudentAssessmentsPage userId={userId} locale={locale} />;
}