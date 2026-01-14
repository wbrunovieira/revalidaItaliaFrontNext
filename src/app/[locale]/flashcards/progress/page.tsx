// src/app/[locale]/flashcards/progress/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavSidebar from '@/components/NavSidebar';
import FlashcardProgressTabs from '@/components/FlashcardProgressTabs';

export function generateStaticParams(): { locale: string }[] {
  return ['pt', 'it', 'es'].map(locale => ({ locale }));
}

export default async function FlashcardProgressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  // DEBUG: Log all cookies
  const allCookies = cookieStore.getAll();
  console.log('[FlashcardProgress] All cookies:', allCookies.map(c => c.name));
  console.log('[FlashcardProgress] Token exists:', !!token);
  console.log('[FlashcardProgress] Token value (first 20 chars):', token?.substring(0, 20));

  if (!token) {
    console.log('[FlashcardProgress] No token found, redirecting to login');
    redirect(`/${locale}/login`);
  }

  console.log('[FlashcardProgress] Token found, rendering page');

  return (
    <NavSidebar>
      <FlashcardProgressTabs />
    </NavSidebar>
  );
}