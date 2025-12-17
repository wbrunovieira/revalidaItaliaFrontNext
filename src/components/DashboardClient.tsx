// src/components/DashboardClient.tsx
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BookOpen, Square, CheckSquare } from 'lucide-react';
import Link from 'next/link';

import { useApi } from '@/hooks/use-api';
import TrackCard from '@/components/TrackCard';
import CourseCard from '@/components/CourseCard';
import ContinueLearning from '@/components/ContinueLearning';
import UserProgressCard from '@/components/UserProgressCard';
import { SupportFloatingButton } from '@/components/SupportFloatingButton';
import { useAuth } from '@/stores/auth.store';

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
  order: number;
  imageUrl: string;
  courseCount: number;
  courses?: Course[];
  translations?: Translation[];
  progress?: TrackProgress;
}

interface EnrichedTrack {
  id: string;
  slug: string;
  order: number;
  imageUrl: string;
  courseCount: number;
  courses?: { id: string; title: string }[];
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
  order: number;
  imageUrl: string;
  moduleCount: number;
  translations?: Translation[];
  progress?: CourseProgress;
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
  const { user, hasAcceptedTerms, checkTermsStatus, migrateTermsFromLocalStorage } = useAuth();

  // Check auth token and terms acceptance
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

    const verifyTerms = async () => {
      // Primeiro tenta migrar do localStorage se necessário
      migrateTermsFromLocalStorage();

      // Depois verifica o status dos termos
      await checkTermsStatus();
    };

    checkAuth();
    verifyTerms();
  }, [locale, router, checkTermsStatus, migrateTermsFromLocalStorage]);

  const { data: tracks, loading: tracksLoading } = useApi<Track[]>('/api/v1/tracks-progress', {
    fallbackData: initialTracks.length > 0 ? initialTracks : fallbackTracks,
    showToastOnError: false,
  });

  const { data: courses, loading: coursesLoading } = useApi<Course[]>('/api/v1/courses-progress', {
    fallbackData: initialCourses.length > 0 ? initialCourses : fallbackCourses,
    showToastOnError: false,
  });

  // Enrich tracks with course data and sort by order
  const enrichedTracks: EnrichedTrack[] =
    tracks
      ?.map(track => {
        const trackWithIds = track as Track & { courseIds?: string[] };
        const courseIds = trackWithIds.courseIds || [];
        const trackCourses = courses?.filter(course => courseIds.includes(course.id)) || [];

        return {
          ...track,
          courseCount: track.courseCount || courseIds.length,
          courses: trackCourses.map(course => ({
            id: course.id,
            title: course.translations?.[0]?.title || course.slug || '',
          })),
          progress: track.progress,
        };
      })
      .sort((a, b) => a.order - b.order) || [];

  const isLoading = tracksLoading || coursesLoading;

  return (
    <div className="flex-1 flex flex-col items-center bg-primary min-h-screen px-4 sm:px-6 lg:px-8 pt-4">
      {/* Welcome Section with improved visual hierarchy */}
      <div className="w-full flex flex-col items-center mt-24 sm:mt-8 lg:mt-16">
        {/* Small badge for "Área do Aluno" with animation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4 sm:mb-6"
        >
          <span className="text-xs sm:text-sm text-white/80 font-medium uppercase tracking-wider">{t('title')}</span>
        </motion.div>

        {/* Main greeting with emphasis on user name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          {user?.name ? (
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mt-8 sm:mt-2">
              {t('greeting', { name: user.name }).split(user.name)[0]}
              <span className="inline-block text-[#8BCAD9] font-extrabold relative">
                {user.name}
                <span className="absolute inset-0 blur-md text-[#8BCAD9]/50 -z-10">{user.name}</span>
              </span>
              {t('greeting', { name: user.name }).split(user.name)[1]}
            </h1>
          ) : (
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mt-8 sm:mt-2">
              {t('greeting', { name: '' })}
            </h1>
          )}
        </motion.div>

        <motion.hr
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="mt-6 sm:mt-8 border-t-2 border-secondary w-32 sm:w-48 lg:w-96 origin-center"
        />
      </div>

      {/* Support Floating Button */}
      <SupportFloatingButton context={{ type: 'GENERAL' }} />

      {/* User Progress Card - increased spacing from welcome */}
      <div className="w-full flex justify-center mt-10 sm:mt-12 lg:mt-16">
        <div className="w-full max-w-6xl">
          <UserProgressCard />
        </div>
      </div>

      {/* Continue Learning Section - consistent spacing */}
      <div className="w-full flex justify-center mt-8 sm:mt-10 lg:mt-12">
        <div className="w-full max-w-6xl">
          <ContinueLearning />
        </div>
      </div>

      {/* Tracks Section - consistent spacing */}
      <div className="w-full flex flex-col items-center mt-10 sm:mt-12 lg:mt-16">
        <div className="w-full max-w-6xl">
          <div className="flex gap-3 sm:gap-4 md:gap-6 items-center">
            <Image
              src="/icons/trail.svg"
              alt={t('trails')}
              width={48}
              height={48}
              className="self-end w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
            />
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white font-sans">
              {t('trails')}
            </h3>
          </div>
          <hr className="mt-4 sm:mt-6 border-t-2 border-secondary w-24 sm:w-36 lg:w-60" />
        </div>
      </div>

      {isLoading && !tracks ? (
        <div className="mt-6 sm:mt-8 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
              <div className="h-48 bg-gray-700 rounded mb-4"></div>
              <div className="h-6 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {enrichedTracks.map((track, index) => (
            <TrackCard key={track.id} track={track} locale={locale} index={index} />
          ))}
        </div>
      )}

      {/* Courses Section - consistent spacing */}
      <div className="w-full flex flex-col items-center mt-12 sm:mt-14 lg:mt-20">
        <div className="w-full max-w-6xl">
          <div className="flex gap-3 sm:gap-4 md:gap-6 items-center">
            <BookOpen className="self-end text-white w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white font-sans">
              {t('courses')}
            </h3>
          </div>
          <hr className="mt-4 sm:mt-6 border-t-2 border-secondary w-24 sm:w-36 lg:w-60" />
        </div>
      </div>

      {isLoading && !courses ? (
        <div className="mt-6 sm:mt-8 w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
              <div className="h-32 bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 sm:mt-8 w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16">
          {[...(courses || [])].sort((a, b) => a.order - b.order).map((course, index) => (
            <CourseCard key={course.id} course={course} locale={locale} index={index} />
          ))}
        </div>
      )}

      {/* Terms of Use Link - Checkbox style */}
      <div className="w-full max-w-6xl mt-16 mb-8 pt-8 border-t border-white/10">
        <div className="flex justify-center">
          {hasAcceptedTerms ? (
            <div className="inline-flex items-center gap-2 text-green-400/80 text-sm">
              <CheckSquare size={20} className="text-green-400" />
              <span>{t('termsAccepted') || 'Termos de Uso Aceitos'}</span>
            </div>
          ) : (
            <Link
              href={`/${locale}/terms`}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white/80 text-sm transition-colors group"
            >
              <Square size={20} className="text-orange-400/80 group-hover:text-orange-400 transition-colors" />
              <span className="group-hover:text-white transition-colors">
                {t('termsPending') || 'Termos de Uso - Pendente de Assinatura'}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
