// src/app/[locale]/tracks/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import TrackCard from '@/components/TrackCard';
import {
  ArrowLeft,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

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
  translations?: Translation[];
  progress?: TrackProgress;
}

export default async function TracksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations({
    locale,
    namespace: 'Trails',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333';

  // Buscar todas as trilhas com progresso
  const resTracks = await fetch(`${apiUrl}/api/v1/tracks-progress`, {
    cache: 'no-store',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!resTracks.ok) {
    throw new Error('Failed to fetch tracks with progress');
  }

  const tracks: Track[] = await resTracks.json();

  // Estatísticas gerais
  const totalTracks = tracks.length;
  const totalCourses = tracks.reduce(
    (sum, track) => sum + (track.courseCount || 0),
    0
  );
  const completedTracks = tracks.filter(
    track => track.progress?.overallPercentage === 100
  ).length;
  const inProgressTracks = tracks.filter(
    track => track.progress && track.progress.overallPercentage > 0 && track.progress.overallPercentage < 100
  ).length;
  const totalLessons = tracks.reduce(
    (sum, track) => sum + (track.progress?.totalLessons || 0),
    0
  );
  const completedLessons = tracks.reduce(
    (sum, track) => sum + (track.progress?.completedLessons || 0),
    0
  );

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Botão Voltar */}
        <div className="p-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors"
          >
            <ArrowLeft size={20} />
            {t('back')}
          </Link>
        </div>

        {/* Cabeçalho com Estatísticas */}
        <div className="px-6 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/icons/trail.svg"
              alt={t('title')}
              width={48}
              height={48}
              className="text-white"
            />
            <h1 className="text-4xl lg:text-6xl font-bold text-white">
              {t('title')}
            </h1>
          </div>
          <hr className="border-t-2 border-secondary w-48 lg:w-96 mb-6" />

          <p className="text-xl text-gray-300 max-w-3xl mb-8">
            {t('description')}
          </p>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-secondary/20 rounded-lg p-4 border border-secondary/30">
              <div className="flex items-center gap-3">
                <TrendingUp
                  size={24}
                  className="text-secondary"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('totalTracks')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {totalTracks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/30 rounded-lg p-4 border border-primary/40">
              <div className="flex items-center gap-3">
                <BookOpen
                  size={24}
                  className="text-blue-400"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('totalCourses')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {totalCourses}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-600/30">
              <div className="flex items-center gap-3">
                <Layers
                  size={24}
                  className="text-blue-400"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('totalLessons')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {totalLessons}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-600/20 rounded-lg p-4 border border-green-600/30">
              <div className="flex items-center gap-3">
                <CheckCircle
                  size={24}
                  className="text-green-400"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('completedTracks')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {completedTracks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-600/20 rounded-lg p-4 border border-yellow-600/30">
              <div className="flex items-center gap-3">
                <Clock
                  size={24}
                  className="text-yellow-400"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('inProgress')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {inProgressTracks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-600/30">
              <div className="flex items-center gap-3">
                <CheckCircle
                  size={24}
                  className="text-purple-400"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('lessonsCompleted')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {completedLessons}/{totalLessons}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Trilhas */}
        <div className="px-6 pb-8">
          {tracks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {tracks.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  locale={locale}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Image
                src="/icons/trail.svg"
                alt={t('noTracks')}
                width={64}
                height={64}
                className="mx-auto mb-4 opacity-50"
              />
              <p className="text-xl text-gray-400">
                {t('noTracks')}
              </p>
            </div>
          )}
        </div>
      </div>
    </NavSidebar>
  );
}
