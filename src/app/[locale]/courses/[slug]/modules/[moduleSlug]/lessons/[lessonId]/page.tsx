export const dynamic = 'force-dynamic';

// src/app/[locale]/courses/[slug]/modules/[moduleSlug]/lessons/[lessonId]/page.tsx

import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import PandaVideoPlayer from '@/components/PandaVideoPlayer';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Clock,
  BookOpen,
  User,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Video {
  id: string;
  slug: string;
  imageUrl?: string;
  providerVideoId: string;
  durationInSeconds: number;
  isSeen: boolean;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: string;
  slug: string;
  imageUrl: string;
  translations: Translation[];
}

interface ModuleData {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

interface Lesson {
  id: string;
  moduleId: string;
  imageUrl?: string;
  video?: Video;
  translations: Translation[];
  createdAt: string;
  updatedAt: string;
}

interface LessonsResponse {
  lessons: Lesson[];
}

interface Assessment {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
  passingScore?: number;
  timeLimitInMinutes?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  lessonId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssessmentsResponse {
  assessments: Assessment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface PandaVideoResponse {
  video_external_id: string;
  video_player: string;
  thumbnail: string;
  length: number;
}

async function fetchPandaVideoData(
  videoId: string
): Promise<PandaVideoResponse | null> {
  const apiKey = process.env.PANDA_VIDEO_API_KEY;
  const apiUrl =
    process.env.PANDA_VIDEO_API_BASE_URL?.replace(
      /\.$/,
      ''
    );
  if (!apiKey || !apiUrl) return null;

  const res = await fetch(`${apiUrl}/videos/${videoId}`, {
    headers: { Authorization: apiKey },
    cache: 'no-store',
  });
  if (res.status === 401 || !res.ok) return null;
  const data = await res.json();
  return {
    video_external_id: data.video_external_id,
    video_player: data.video_player,
    thumbnail: data.thumbnail,
    length: data.length,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{
    locale: string;
    slug: string;
    moduleSlug: string;
    lessonId: string;
  }>;
}) {
  const { locale, slug, moduleSlug, lessonId } =
    await params;
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  const [, , tLesson] = await Promise.all([
    getTranslations({ locale, namespace: 'Course' }),
    getTranslations({ locale, namespace: 'Module' }),
    getTranslations({ locale, namespace: 'Lesson' }),
  ]);

  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  const courses: Course[] = await fetch(
    `${API_URL}/courses`,
    { cache: 'no-store' }
  ).then(r => (r.ok ? r.json() : Promise.reject()));
  const course =
    courses.find(c => c.slug === slug) ?? notFound();

  const modules: ModuleData[] = await fetch(
    `${API_URL}/courses/${course.id}/modules`,
    { cache: 'no-store' }
  ).then(r => (r.ok ? r.json() : Promise.reject()));
  const moduleFound =
    modules.find(m => m.slug === moduleSlug) ?? notFound();

  const lesson: Lesson = await fetch(
    `${API_URL}/courses/${course.id}/modules/${moduleFound.id}/lessons/${lessonId}`,
    { cache: 'no-store' }
  ).then(r => (r.ok ? r.json() : notFound()));

  const pandaData = lesson.video?.providerVideoId
    ? await fetchPandaVideoData(
        lesson.video.providerVideoId
      )
    : null;

  const [allLessons, assessmentsData]: [LessonsResponse, AssessmentsResponse] = await Promise.all([
    fetch(
      `${API_URL}/courses/${course.id}/modules/${moduleFound.id}/lessons`,
      { cache: 'no-store' }
    ).then(r => (r.ok ? r.json() : Promise.reject())),
    fetch(
      `${API_URL}/assessments?lessonId=${lessonId}`,
      { cache: 'no-store' }
    ).then(r => (r.ok ? r.json() : { assessments: [], pagination: {} }))
  ]);

  const sorted = allLessons.lessons.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );
  const idx = sorted.findIndex(l => l.id === lessonId);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next =
    idx < sorted.length - 1 ? sorted[idx + 1] : null;

  const assessments = assessmentsData.assessments || [];

  const ct =
    course.translations.find(t => t.locale === locale) ||
    course.translations[0];
  const mt =
    moduleFound.translations.find(
      t => t.locale === locale
    ) || moduleFound.translations[0];
  const lt =
    lesson.translations.find(t => t.locale === locale) ||
    lesson.translations[0];
  const vt =
    lesson.video?.translations.find(
      t => t.locale === locale
    ) || lesson.video?.translations[0];

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Breadcrumb header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
            <Link
              href={`/${locale}`}
              className="hover:text-secondary"
            >
              {tLesson('breadcrumb.dashboard')}
            </Link>
            <ChevronRight size={16} />
            <Link
              href={`/${locale}/courses/${slug}`}
              className="hover:text-secondary"
            >
              {ct.title}
            </Link>
            <ChevronRight size={16} />
            <Link
              href={`/${locale}/courses/${slug}/modules/${moduleSlug}`}
              className="hover:text-secondary"
            >
              {mt.title}
            </Link>
            <ChevronRight size={16} />
            <span className="text-secondary">
              {lt.title}
            </span>
          </div>
          <Link
            href={`/${locale}/courses/${slug}/modules/${moduleSlug}`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary"
          >
            <ArrowLeft size={20} /> {tLesson('back')}
          </Link>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:flex">
          {/* Video player */}
          <div className="flex-1 bg-black">
            <PandaVideoPlayer
              videoId={
                pandaData?.video_external_id ??
                lesson.video?.providerVideoId ??
                ''
              }
              playerUrl={pandaData?.video_player}
              title={
                vt?.title ||
                lt.title ||
                pandaData?.video_external_id
              }
              thumbnailUrl={
                lesson.video?.imageUrl ??
                pandaData?.thumbnail
              }
            />
          </div>

          {/* Sidebar */}
          <aside className="lg:w-96 bg-gray-900 p-6 overflow-y-auto">
            <div className="mb-8">
              <div className="inline-flex items-center bg-secondary text-primary px-3 py-1 rounded-full text-sm font-semibold mb-4">
                {tLesson('lessonNumber', {
                  number: idx + 1,
                })}
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">
                {lt.title}
              </h1>
              <p className="text-gray-300 mb-6 leading-relaxed">
                {lt.description}
              </p>

              <div className="space-y-3 text-sm text-gray-400">
                {(lesson.video?.durationInSeconds ||
                  pandaData?.length) && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    {Math.ceil(
                      (lesson.video?.durationInSeconds ??
                        pandaData?.length ??
                        0) / 60
                    )}{' '}
                    {tLesson('minutes')}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen size={16} /> {mt.title}
                </div>
                <div className="flex items-center gap-2">
                  <User size={16} /> {ct.title}
                </div>
              </div>
            </div>

            {/* Prev / Next */}
            <div className="border-t border-gray-800 pt-6 space-y-3">
              {prev && (
                <Link
                  href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${prev.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft size={20} />
                  {tLesson('previousLesson')}:{' '}
                  {
                    prev.translations.find(
                      t => t.locale === locale
                    )?.title
                  }
                </Link>
              )}
              {next && (
                <Link
                  href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${next.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {tLesson('nextLesson')}:{' '}
                  {
                    next.translations.find(
                      t => t.locale === locale
                    )?.title
                  }
                  <ChevronRight size={20} />
                </Link>
              )}
            </div>

            {/* Assessments section */}
            {assessments.length > 0 && (
              <div className="mt-8">
                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                  <ClipboardList size={18} />
                  {tLesson('assessments')}
                </h4>
                <div className="space-y-3">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-white">
                          {assessment.title}
                        </h5>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          assessment.type === 'QUIZ'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : assessment.type === 'SIMULADO'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {tLesson(`assessmentTypes.${assessment.type.toLowerCase()}`)}
                        </span>
                      </div>
                      
                      {assessment.description && (
                        <p className="text-gray-400 text-sm mb-3">
                          {assessment.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {assessment.timeLimitInMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {assessment.timeLimitInMinutes} min
                            </span>
                          )}
                          {assessment.passingScore && (
                            <span>
                              {tLesson('passingScore')}: {assessment.passingScore}%
                            </span>
                          )}
                        </div>
                        
                        <button className="flex items-center gap-2 px-3 py-1 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium">
                          {tLesson('startAssessment')}
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All lessons list */}
            <div className="mt-8">
              <h4 className="text-md font-semibold text-white mb-3">
                {tLesson('allLessons')}
              </h4>
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {sorted.map((l, i) => (
                  <li key={l.id}>
                    <Link
                      href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${l.id}`}
                      className={`block p-2 rounded text-sm transition-colors ${
                        l.id === lessonId
                          ? 'bg-secondary text-primary font-semibold'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {i + 1}.{' '}
                      {
                        l.translations.find(
                          t => t.locale === locale
                        )?.title
                      }
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </NavSidebar>
  );
}
