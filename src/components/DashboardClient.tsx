'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BookOpen, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';

import { useApi } from '@/hooks/use-api';
import TrackCard from '@/components/TrackCard';
import CourseCard from '@/components/CourseCard';
import ContinueLearning from '@/components/ContinueLearning';

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
  courses?: { id: string; title: string; }[];
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

export default function DashboardClient({ 
  locale, 
  initialTracks = [], 
  initialCourses = [] 
}: DashboardClientProps) {
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  // Check auth token
  useEffect(() => {
    const checkAuth = () => {
      const tokenFromCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      const tokenFromStorage = 
        localStorage.getItem('accessToken') || 
        sessionStorage.getItem('accessToken');

      if (!tokenFromCookie && !tokenFromStorage) {
        router.push(`/${locale}/login`);
      }
    };

    checkAuth();
  }, [locale, router]);

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial state
    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const {
    data: tracks,
    loading: tracksLoading,
    error: tracksError,
  } = useApi<Track[]>('/api/v1/tracks', {
    fallbackData: initialTracks.length > 0 ? initialTracks : fallbackTracks,
    showToastOnError: false
  });

  const {
    data: courses,
    loading: coursesLoading,
    error: coursesError,
  } = useApi<Course[]>('/api/v1/courses', {
    fallbackData: initialCourses.length > 0 ? initialCourses : fallbackCourses,
    showToastOnError: false
  });

  // Enrich tracks with course data
  const enrichedTracks: EnrichedTrack[] = tracks?.map(track => {
    const trackWithIds = track as Track & { courseIds?: string[] };
    const courseIds = trackWithIds.courseIds || [];
    const trackCourses = courses?.filter((course) => 
      courseIds.includes(course.id)
    ) || [];
    
    return {
      ...track,
      courses: trackCourses.map(course => ({
        id: course.id,
        title: course.translations?.[0]?.title || course.slug || ''
      })),
    };
  }) || [];


  const hasError = tracksError || coursesError;
  const isLoading = tracksLoading || coursesLoading;

  return (
    <div className="flex-1 flex flex-col items-left justify-top bg-primary min-h-screen pl-4 pt-8">
      <div className="w-full flex flex-col items-center">
        <h1 className="text-6xl font-bold text-white">
          {t('title')}
        </h1>
        <hr className="mt-4 border-t-2 border-secondary w-48 lg:w-96" />
      </div>

      {/* Loading indicator when retrying */}
      {isLoading && hasError && (
        <div className="w-full max-w-6xl mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <RefreshCw size={20} className="text-blue-300 animate-spin" />
            <p className="text-blue-200 font-medium">
              {t('reconnecting')}
            </p>
          </div>
        </div>
      )}

      {/* Connection Error Banner - Show when offline or network errors */}
      {(!isOnline || (hasError && !isLoading && (tracksError?.type === 'network' || coursesError?.type === 'network'))) && (
        <div className="w-full max-w-6xl mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">
                <WifiOff size={16} className="text-yellow-300" />
              </div>
              <div>
                <p className="text-yellow-200 font-medium">
                  {t('offlineMode')}
                </p>
                <p className="text-yellow-300 text-sm">
                  {t('offlineModeDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Other Errors Banner (auth, server errors) */}
      {hasError && !isLoading && !(tracksError?.type === 'network' || coursesError?.type === 'network') && (
        <div className="w-full max-w-6xl mt-6 p-4 bg-red-900/20 border border-red-700/50 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20">
              <AlertTriangle size={16} className="text-red-300" />
            </div>
            <div>
              <p className="text-red-200 font-medium">
                {t('errorLoadingData')}
              </p>
              <p className="text-red-300 text-sm">
                {tracksError?.message || coursesError?.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Continue Learning Section */}
      <div className="w-full max-w-6xl mt-8">
        <ContinueLearning />
      </div>

      {/* Tracks Section */}
      <div className="flex gap-8 items-center mt-8">
        <Image
          src="/icons/trail.svg"
          alt={t('trails')}
          width={48}
          height={48}
          className="self-end"
        />
        <h3 className="text-5xl font-bold text-white pt-4 mt-8 font-sans">
          {t('trails')}
        </h3>
        {isLoading && (
          <RefreshCw size={24} className="text-white animate-spin ml-4" />
        )}
      </div>
      <hr className="mt-4 border-t-2 border-secondary w-24 lg:w-60" />
      
      {isLoading && !tracks ? (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {[1, 2].map((i) => (
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
            <TrackCard
              key={track.id}
              track={track}
              locale={locale}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Courses Section */}
      <div className="flex gap-8 items-center mt-16">
        <BookOpen
          size={48}
          className="self-end text-white"
        />
        <h3 className="text-5xl font-bold text-white pt-4 mt-8 font-sans">
          {t('courses')}
        </h3>
        {isLoading && (
          <RefreshCw size={24} className="text-white animate-spin ml-4" />
        )}
      </div>
      <hr className="mt-4 border-t-2 border-secondary w-24 lg:w-60" />
      
      {isLoading && !courses ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-12">
          {[1, 2, 3, 4].map((i) => (
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
            <CourseCard
              key={course.id}
              course={course}
              locale={locale}
              index={index}
            />
          )) || []}
        </div>
      )}
    </div>
  );
}