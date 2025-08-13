// src/components/DashboardClient.tsx
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

import { useApi } from '@/hooks/use-api';
import TrackCard from '@/components/TrackCard';
import CourseCard from '@/components/CourseCard';
import ContinueLearning from '@/components/ContinueLearning';
import { SupportFloatingButton } from '@/components/SupportFloatingButton';
import { useAuthStore } from '@/stores/auth.store';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Track {
  id: string;
  slug: string;
  imageUrl: string;
  courses?: Course[];
  translations?: Translation[];
}

interface EnrichedTrack {
  id: string;
  slug: string;
  imageUrl: string;
  courses?: { id: string; title: string }[];
  translations?: Translation[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations?: Translation[];
}

// Fallback data for offline mode
const fallbackTracks: Track[] = [];

const fallbackCourses: Course[] = [];

interface DashboardClientProps {
  locale: string;
  initialTracks?: Track[];
  initialCourses?: Course[];
}

export default function DashboardClient({ locale, initialTracks = [], initialCourses = [] }: DashboardClientProps) {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const { user } = useAuthStore();

  // Check auth token
  useEffect(() => {
    const checkAuth = () => {
      const tokenFromCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      const tokenFromStorage = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

      if (!tokenFromCookie && !tokenFromStorage) {
        router.push(`/${locale}/login`);
      }
    };

    checkAuth();
  }, [locale, router]);

  const {
    data: tracks,
    loading: tracksLoading,
  } = useApi<Track[]>('/api/v1/tracks', {
    fallbackData: initialTracks.length > 0 ? initialTracks : fallbackTracks,
    showToastOnError: false,
  });

  const {
    data: courses,
    loading: coursesLoading,
  } = useApi<Course[]>('/api/v1/courses', {
    fallbackData: initialCourses.length > 0 ? initialCourses : fallbackCourses,
    showToastOnError: false,
  });

  // Enrich tracks with course data
  const enrichedTracks: EnrichedTrack[] =
    tracks?.map(track => {
      const trackWithIds = track as Track & { courseIds?: string[] };
      const courseIds = trackWithIds.courseIds || [];
      const trackCourses = courses?.filter(course => courseIds.includes(course.id)) || [];

      return {
        ...track,
        courses: trackCourses.map(course => ({
          id: course.id,
          title: course.translations?.[0]?.title || course.slug || '',
        })),
      };
    }) || [];

  const isLoading = tracksLoading || coursesLoading;

  return (
    <div className="flex-1 flex flex-col items-left justify-top bg-primary min-h-screen pl-4 pt-8">
      <div className="w-full flex flex-col items-center">
        <h1 className="text-6xl font-bold text-white">{t('title')}</h1>
        {user?.name && (
          <p className="text-xl text-secondary mt-2 font-medium">
            {t('greeting', { name: user.name })}
          </p>
        )}
        <hr className="mt-4 border-t-2 border-secondary w-48 lg:w-96" />
      </div>
      
      {/* Support Floating Button */}
      <SupportFloatingButton context={{ type: "GENERAL" }} />




      {/* Continue Learning Section */}
      <div className="w-full max-w-6xl mt-8">
        <ContinueLearning />
      </div>

      {/* Tracks Section */}
      <div className="flex gap-8 items-center mt-8">
        <Image src="/icons/trail.svg" alt={t('trails')} width={48} height={48} className="self-end" />
        <h3 className="text-5xl font-bold text-white pt-4 mt-8 font-sans">{t('trails')}</h3>
      </div>
      <hr className="mt-4 border-t-2 border-secondary w-24 lg:w-60" />

      {isLoading && !tracks ? (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
              <div className="h-48 bg-gray-700 rounded mb-4"></div>
              <div className="h-6 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {enrichedTracks.map((track, index) => (
            <TrackCard key={track.id} track={track} locale={locale} index={index} />
          ))}
        </div>
      )}

      {/* Courses Section */}
      <div className="flex gap-8 items-center mt-16">
        <BookOpen size={48} className="self-end text-white" />
        <h3 className="text-5xl font-bold text-white pt-4 mt-8 font-sans">{t('courses')}</h3>
      </div>
      <hr className="mt-4 border-t-2 border-secondary w-24 lg:w-60" />

      {isLoading && !courses ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-12">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
              <div className="h-32 bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-12">
          {courses?.map((course, index) => (
            <CourseCard key={course.id} course={course} locale={locale} index={index} />
          )) || []}
        </div>
      )}
    </div>
  );
}
