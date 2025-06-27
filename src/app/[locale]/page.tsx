// src/app/[locale]/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import Card from '@/components/Card';
import { BookOpen } from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Track {
  id: string;
  slug: string;
  imageUrl: string;
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

export default async function IndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333';

  // Fetch tracks
  const resTracks = await fetch(`${apiUrl}/tracks`, {
    cache: 'no-store',
  });
  if (!resTracks.ok) {
    throw new Error('Failed to fetch tracks');
  }
  const tracks: Track[] = await resTracks.json();

  // CORREÇÃO: Removida a dupla barra
  const resCourses = await fetch(`${apiUrl}/courses`, {
    cache: 'no-store',
  });
  if (!resCourses.ok) {
    throw new Error('Failed to fetch courses');
  }
  const courses: Course[] = await resCourses.json();

  if (!token) {
    redirect(`/${locale}/login`);
  }

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col items-left justify-top bg-primary min-h-screen pl-4 pt-8">
        <div className="w-full flex flex-col items-center">
          <h1 className="text-6xl font-bold text-white">
            {t('title')}
          </h1>
          <hr className="mt-4 border-t-2 border-secondary w-48 lg:w-96" />
        </div>

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
        </div>
        <hr className="mt-4 border-t-2 border-secondary w-24 lg:w-60" />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 w-full max-w-6xl cursor-pointer">
          {tracks.map(track => {
            const list = track.translations ?? [];
            const translation = list.find(
              tr => tr.locale === locale
            ) ??
              list[0] ?? { title: '', description: '' };
            return (
              <Card
                key={track.id}
                name={translation.title}
                imageUrl={track.imageUrl}
                href={`/${locale}/tracks/${track.slug}`}
              />
            );
          })}
        </div>

        <div className="flex gap-8 items-center mt-12">
          <BookOpen
            size={48}
            className="self-end text-white"
          />
          <h3 className="text-5xl font-bold text-white pt-4 mt-8 font-sans">
            {t('courses')}
          </h3>
        </div>
        <hr className="mt-4 border-t-2 border-secondary w-24 lg:w-60" />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 w-full max-w-6xl cursor-pointer">
          {courses.map(course => {
            const list = course.translations ?? [];
            const translation = list.find(
              tr => tr.locale === locale
            ) ??
              list[0] ?? { title: '', description: '' };
            return (
              <Card
                key={course.id}
                name={translation.title}
                imageUrl={course.imageUrl}
                href={`/${locale}/courses/${course.slug}`}
              />
            );
          })}
        </div>
      </div>
    </NavSidebar>
  );
}
