// src/app/[locale]/tracks/[slug]/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import CourseCard from '@/components/CourseCard';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
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
  courseIds: string[];
  translations: Translation[];
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  modules?: any[];
  translations: Translation[];
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // Carrega traduções do namespace 'Track'
  const tTrack = await getTranslations({
    locale,
    namespace: 'Track',
  });

  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  // Buscar todas as trilhas
  const resTracks = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks`,
    { cache: 'no-store' }
  );
  if (!resTracks.ok)
    throw new Error('Failed to fetch tracks');
  const allTracks: Track[] = await resTracks.json();

  const track =
    allTracks.find(t => t.slug === slug) ?? notFound();

  // Buscar detalhes da trilha (inclui courseIds)
  const resTrack = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/tracks/${track.id}`,
    { cache: 'no-store' }
  );
  if (!resTrack.ok)
    throw new Error('Failed to fetch track details');
  const trackDetail: Track = await resTrack.json();

  // Buscar todos os cursos e filtrar pelos IDs da trilha
  const resCourses = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses`,
    { cache: 'no-store' }
  );
  if (!resCourses.ok)
    throw new Error('Failed to fetch courses');
  const allCourses: Course[] = await resCourses.json();
  const trackCourses = allCourses.filter(course =>
    trackDetail.courseIds.includes(course.id)
  );

  // Tradução da trilha
  const tr = track.translations.find(
    tr => tr.locale === locale
  ) ||
    track.translations[0] || { title: '', description: '' };

  // Estatísticas
  const courseCount = trackCourses.length;
  const estimatedHours = courseCount * 2;

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
            {tTrack('back')}
          </Link>
        </div>

        {/* Cabeçalho da Trilhas */}
        <div className="px-6 pb-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="relative w-full lg:w-96 h-64 rounded-lg overflow-hidden border-l-[10px] border-accent shadow-xl">
              <Image
                src={track.imageUrl}
                alt={tr.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                {tr.title}
              </h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                {tr.description}
              </p>
              <div className="flex gap-6 text-white">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} />
                  <span>
                    {courseCount} {tTrack('courses')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span>
                    {tTrack('estimated', {
                      hours: estimatedHours,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cursos na trilha */}
        <div className="px-6 pb-8">
          <div className="flex items-center gap-4 mb-6">
            <BookOpen size={32} className="text-white" />
            <h2 className="text-3xl font-bold text-white">
              {tTrack('coursesInTrack')}
            </h2>
          </div>
          <hr className="border-t-2 border-secondary w-32 mb-8" />

          {trackCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {trackCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  locale={locale}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-xl text-gray-400">
                {tTrack('noCourses')}
              </p>
            </div>
          )}
        </div>
      </div>
    </NavSidebar>
  );
}
