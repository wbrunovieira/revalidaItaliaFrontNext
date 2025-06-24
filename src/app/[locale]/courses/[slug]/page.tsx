// src/app/[locale]/courses/[slug]/page.tsx

import { cookies } from 'next/headers';
import Image from 'next/image';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import Card from '@/components/Card';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Play,
} from 'lucide-react';
import Link from 'next/link';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}

interface Module {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

export default async function CoursePage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug } = params;

  const [tDashboard, tCourse] = await Promise.all([
    getTranslations({ locale, namespace: 'Dashboard' }),
    getTranslations({ locale, namespace: 'Course' }),
  ]);

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const resAllCourses = await fetch(
    'http://localhost:3333/courses',
    {
      cache: 'no-store',
    }
  );
  if (!resAllCourses.ok) {
    throw new Error('Failed to fetch courses');
  }
  const allCourses: Course[] = await resAllCourses.json();

  const courseFound = allCourses.find(c => c.slug === slug);
  if (!courseFound) {
    notFound();
  }

  const resModules = await fetch(
    `http://localhost:3333/courses/${courseFound.id}/modules`,
    {
      cache: 'no-store',
    }
  );
  if (!resModules.ok) {
    throw new Error('Failed to fetch course modules');
  }
  const courseModules: Module[] = await resModules.json();

  const courseTranslation = courseFound.translations.find(
    tr => tr.locale === locale
  ) ??
    courseFound.translations[0] ?? {
      title: '',
      description: '',
    };

  const estimatedHours = courseModules.length * 1.5;
  const totalModules = courseModules.length;

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        <div className="p-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors"
          >
            <ArrowLeft size={20} />
            {tCourse('back')}
          </Link>
        </div>

        <div className="px-6 pb-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="relative w-full lg:w-96 h-64 rounded-lg overflow-hidden">
              <Image
                src={courseFound.imageUrl}
                alt={courseTranslation.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                {courseTranslation.title}
              </h1>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                {courseTranslation.description}
              </p>

              <div className="flex gap-6 text-white">
                <div className="flex items-center gap-2">
                  <BookOpen size={20} />
                  <span>
                    {totalModules} {tCourse('modules')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  <span>
                    {tCourse('estimated', {
                      hours: estimatedHours.toFixed(1),
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Play size={20} />
                  <span>{tCourse('level.beginner')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8">
          <div className="flex items-center gap-4 mb-6">
            <BookOpen size={32} className="text-white" />
            <h2 className="text-3xl font-bold text-white">
              {tCourse('modulesInCourse')}
            </h2>
          </div>
          <hr className="border-t-2 border-secondary w-32 mb-8" />

          {courseModules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseModules
                .sort((a, b) => a.order - b.order)
                .map((module, index) => {
                  const moduleTranslation =
                    module.translations.find(
                      tr => tr.locale === locale
                    ) ??
                      module.translations[0] ?? {
                        title: '',
                        description: '',
                      };

                  return (
                    <div
                      key={module.id}
                      className="relative"
                    >
                      <div className="absolute -top-2 -left-2 bg-secondary text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10">
                        {module.order}
                      </div>
                      <Card
                        name={moduleTranslation.title}
                        imageUrl={
                          module.imageUrl ||
                          courseFound.imageUrl
                        }
                        href={`/${locale}/courses/${slug}/modules/${module.slug}`}
                      />

                      <div className="mt-2 text-center">
                        <span className="text-xs text-gray-400">
                          {tCourse('moduleOrder', {
                            order: module.order,
                            total: totalModules,
                          })}
                        </span>
                      </div>
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
                {tCourse('noModules')}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 pb-8">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {tCourse('startCourse')}
            </h3>
            <p className="text-gray-300 mb-4">
              {tCourse('startCourseDescription')}
            </p>
            {courseModules.length > 0 && (
              <Link
                href={`/${locale}/courses/${slug}/modules/${
                  courseModules.sort(
                    (a, b) => a.order - b.order
                  )[0].slug
                }`}
                className="bg-secondary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors inline-flex items-center gap-2"
              >
                <Play size={20} />
                {tCourse('startFirstModule')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </NavSidebar>
  );
}
