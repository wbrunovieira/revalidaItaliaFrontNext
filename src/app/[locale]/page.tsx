// src/app/[locale]/page.tsx

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import NavSidebar from '@/components/NavSidebar';
import DashboardClient from '@/components/DashboardClient';
import { publicRoutes } from '@/i18n/routing';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface TrackProgress {
  completedCourses: number;
  totalCourses: number;
  courseCompletionRate: number;
  completedLessons: number;
  totalLessons: number;
  lessonCompletionRate: number;
  overallPercentage: number;
}

interface Track {
  id: string;
  slug: string;
  imageUrl: string;
  courseCount: number;
  courses?: Course[];
  translations?: Translation[];
  progress?: TrackProgress;
}

interface CourseProgress {
  completedModules: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  moduleCount: number;
  translations?: Translation[];
  progress?: CourseProgress;
}

export function generateStaticParams(): {
  locale: string;
}[] {
  return ['pt', 'it', 'es'].map(locale => ({ locale }));
}

async function fetchDataSafely<T>(url: string, token?: string): Promise<T | null> {
  try {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers
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

  // CRITICAL: Check if this is a public route request that ended up here due to routing issues
  // This happens when reset-password route is not found and falls back to home page
  const headersList = await headers();
  const referer = headersList.get('referer');
  const xOriginalUrl = headersList.get('x-original-url') || headersList.get('x-forwarded-uri');
  
  console.log('[HomePage] Referer:', referer);
  console.log('[HomePage] X-Original-URL:', xOriginalUrl);
  
  // Check if this request was meant for a public route
  const isPublicRouteRequest = referer && publicRoutes.some(route => referer.includes(route));
  
  if (!token) {
    // If this was a public route request that fell through to home page, don't redirect
    // Let it render and show error or handle appropriately
    if (isPublicRouteRequest) {
      console.log('[HomePage] Public route request detected, not redirecting to login');
      // Return a 404 or handle appropriately for public routes
      throw new Error('Route not found');
    }
    
    redirect(`/${locale}/login`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

  // Try to fetch data on server, but don't fail if API is down
  const [tracks, courses] = await Promise.all([
    fetchDataSafely<Track[]>(`${apiUrl}/api/v1/tracks-progress`, token),
    fetchDataSafely<Course[]>(`${apiUrl}/api/v1/courses-progress`, token)
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
