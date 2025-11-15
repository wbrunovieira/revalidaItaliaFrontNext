'use client';

import { StudentAssessmentDetails } from '@/components/StudentAssessmentDetails';
import { StudentOralExamView } from '@/components/StudentOralExamView';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{
    locale: string;
    attemptId: string;
  }>;
}

export default function AssessmentDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { locale, attemptId } = use(params);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentType, setAssessmentType] = useState<'PROVA_ABERTA' | 'ORAL_EXAM' | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);

  useEffect(() => {
    // Check if user is authenticated and fetch assessment type
    const checkAuthAndFetchData = async () => {
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

        if (!decodedPayload.sub) {
          router.push(`/${locale}/login`);
          return;
        }

        setUserId(decodedPayload.sub);

        // Fetch attempt data to determine assessment type
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/attempts/${attemptId}/results`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Assessment data:', data);
          setAssessmentType(data.assessment?.type || 'PROVA_ABERTA');
          setAssessmentData(data);
        }
      } catch (error) {
        console.error('Auth/fetch error:', error);
        router.push(`/${locale}/login`);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [locale, router, attemptId]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto mb-4"></div>
            <p className="text-gray-300">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render based on assessment type
  if (assessmentType === 'ORAL_EXAM' && assessmentData) {
    return (
      <StudentOralExamView
        attemptId={attemptId}
        assessmentTitle={assessmentData.assessment?.title || 'Exame Oral'}
        answers={assessmentData.answers || []}
        locale={locale}
      />
    );
  }

  // Default to PROVA_ABERTA view
  return (
    <StudentAssessmentDetails
      attemptId={attemptId}
      userId={userId}
      locale={locale}
    />
  );
}