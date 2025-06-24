// src/app/[locale]/tracks/[slug]/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import Card from '@/components/Card';
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
  translations: Translation[];
}

export default async function TrackPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const resAllTracks = await fetch(
    'http://localhost:3333/tracks',
    {
      cache: 'no-store',
    }
  );
  if (!resAllTracks.ok) {
    throw new Error('Failed to fetch tracks');
  }
  const allTracks: Track[] = await resAllTracks.json();

  const trackFound = allTracks.find(t => t.slug === slug);
  if (!trackFound) {
    notFound();
  }

  const resTrack = await fetch(
    `http://localhost:3333/tracks/${trackFound.id}`,
    {
      cache: 'no-store',
    }
  );
  if (!resTrack.ok) {
    throw new Error('Failed to fetch track details');
  }
  const track: Track = await resTrack.json();

  const resCourses = await fetch(
    'http://localhost:3333/courses',
    {
      cache: 'no-store',
    }
  );
  if (!resCourses.ok) {
    throw new Error('Failed to fetch courses');
  }
  const allCourses: Course[] = await resCourses.json();

  const trackCourses = allCourses.filter(course =>
    track.courseIds.includes(course.id)
  );

  const trackTranslation = track.translations.find(
    tr => tr.locale === locale
  ) ??
    track.translations[0] ?? { title: '', description: '' };

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        <div className="p-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </Link>
        </div>

        <div className="px-6 pb-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="relative w-full lg:w-96 h-64 rounded-lg overflow-hidden">
              <Image
                src={track.imageUrl}
                alt={trackTranslation.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                {trackTranslation.title}
              </h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                {trackTranslation.description}
              </p>

              <div className="flex gap-6 text-white">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} />
                  <span>{trackCourses.length} cursos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span>
                    Estimado: {trackCourses.length * 2}h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="flex items-center gap-4 mb-6">
            <BookOpen size={32} className="text-white" />
            <h2 className="text-3xl font-bold text-white">
              Cursos desta Trilha
            </h2>
          </div>
          <hr className="border-t-2 border-secondary w-32 mb-8" />

          {trackCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trackCourses.map((course, index) => {
                const courseTranslation =
                  course.translations.find(
                    tr => tr.locale === locale
                  ) ??
                    course.translations[0] ?? {
                      title: '',
                      description: '',
                    };

                return (
                  <div key={course.id} className="relative">
                    <div className="absolute -top-2 -left-2 bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10">
                      {index + 1}
                    </div>
                    <Card
                      name={courseTranslation.title}
                      imageUrl={course.imageUrl}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-xl text-gray-400">
                Nenhum curso encontrado para esta trilha.
              </p>
            </div>
          )}
        </div>
      </div>
    </NavSidebar>
  );
}
