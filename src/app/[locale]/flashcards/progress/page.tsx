// src/app/[locale]/flashcards/progress/page.tsx
'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavSidebar from '@/components/NavSidebar';
import FlashcardProgressTabs from '@/components/FlashcardProgressTabs';
import { useAuth } from '@/stores/auth.store';
import { Loader2 } from 'lucide-react';

export default function FlashcardProgressPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { token, isAuthenticated, isLoading } = useAuth();

  // Verificação de autenticação client-side
  useEffect(() => {
    if (!isLoading && (!token || !isAuthenticated)) {
      router.push(`/${locale}/login`);
    }
  }, [token, isAuthenticated, isLoading, locale, router]);

  // Loading state enquanto verifica autenticação
  if (isLoading) {
    return (
      <NavSidebar>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </NavSidebar>
    );
  }

  // Se não autenticado, não renderiza (vai redirecionar)
  if (!token || !isAuthenticated) {
    return null;
  }

  return (
    <NavSidebar>
      <FlashcardProgressTabs />
    </NavSidebar>
  );
}