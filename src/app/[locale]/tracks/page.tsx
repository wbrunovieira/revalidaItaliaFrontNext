// src/app/[locale]/tracks/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import Card from '@/components/Card';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Track {
  id: string;
  slug: string;
  imageUrl: string;
  courseIds?: string[];
  translations?: Translation[];
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

  // Buscar todas as trilhas
  const resTracks = await fetch(`${apiUrl}/api/v1/tracks`, {
    cache: 'no-store',
  });

  if (!resTracks.ok) {
    throw new Error('Failed to fetch tracks');
  }

  const tracks: Track[] = await resTracks.json();

  // Enriquecer trilhas com contagem de cursos
  const enrichedTracks = tracks.map(track => {
    const courseCount = track.courseIds?.length || 0;
    const estimatedHours = courseCount * 2; // Estimativa de 2 horas por curso

    return {
      ...track,
      courseCount,
      estimatedHours,
    };
  });

  // Estatísticas gerais
  const totalTracks = tracks.length;
  const totalCourses = enrichedTracks.reduce(
    (sum, track) => sum + track.courseCount,
    0
  );
  const totalHours = enrichedTracks.reduce(
    (sum, track) => sum + track.estimatedHours,
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

            <div className="bg-secondary/20 rounded-lg p-4 border border-secondary/30">
              <div className="flex items-center gap-3">
                <BookOpen
                  size={24}
                  className="text-secondary"
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

            <div className="bg-secondary/20 rounded-lg p-4 border border-secondary/30">
              <div className="flex items-center gap-3">
                <Clock
                  size={24}
                  className="text-secondary"
                />
                <div>
                  <p className="text-sm text-gray-400">
                    {t('totalHours')}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {totalHours}h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Trilhas */}
        <div className="px-6 pb-8">
          {enrichedTracks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrichedTracks.map(track => {
                const list = track.translations ?? [];
                const translation = list.find(
                  tr => tr.locale === locale
                ) ??
                  list[0] ?? { title: '', description: '' };

                return (
                  <div
                    key={track.id}
                    className="group relative transform hover:scale-105 transition-all duration-300"
                  >
                    <Card
                      name={translation.title}
                      imageUrl={track.imageUrl}
                      href={`/${locale}/tracks/${track.slug}`}
                    />

                    {/* Informações adicionais */}
                    <div className="mt-3 px-2 space-y-2">
                      {translation.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {translation.description}
                        </p>
                      )}

                      <div className="flex gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {track.courseCount} {t('courses')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {track.estimatedHours}h
                        </span>
                      </div>
                    </div>

                    {/* Badge de destaque */}
                    {track.courseCount > 5 && (
                      <div className="absolute top-2 right-2 bg-secondary text-white text-xs px-2 py-1 rounded-full">
                        {t('popular')}
                      </div>
                    )}
                  </div>
                );
              })}
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
