// src/app/[locale]/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavSidebar from '@/components/NavSidebar';
import DashboardClient from '@/components/DashboardClient';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Track {
  id: string;
  slug: string;
  imageUrl: string;
  courses?: any[];
  translations?: Translation[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations?: Translation[];
}

export function generateStaticParams(): {
  locale: string;
}[] {
  return ['pt', 'it', 'es'].map(locale => ({ locale }));
}

async function fetchDataSafely<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`Error fetching ${url}:`, error);
    return null;
  }
}

export default async function IndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  // Try to fetch data on server, but don't fail if API is down
  const [tracks, courses] = await Promise.all([
    fetchDataSafely<Track[]>(`${apiUrl}/api/v1/tracks`),
    fetchDataSafely<Course[]>(`${apiUrl}/api/v1/courses`)
  ]);

  return (
    <NavSidebar>
      <DashboardClient 
        locale={locale}
        initialTracks={tracks || []}
        initialCourses={courses || []}
      />
    </NavSidebar>
  );
}
