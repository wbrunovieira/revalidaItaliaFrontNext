// src/app/[locale]/flashcards/progress/page.tsx

export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavSidebar from '@/components/NavSidebar';
import FlashcardProgressTabs from '@/components/FlashcardProgressTabs';
import { isTokenExpired } from '@/lib/auth-utils';

export default async function FlashcardProgressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Verificação de autenticação server-side
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token || isTokenExpired(token)) {
    redirect(`/${locale}/login`);
  }

  return (
    <NavSidebar>
      <FlashcardProgressTabs />
    </NavSidebar>
  );
}