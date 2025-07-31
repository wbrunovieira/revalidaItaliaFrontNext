export const dynamic = 'force-dynamic';

// src/app/[locale]/courses/[slug]/modules/[moduleSlug]/lessons/[lessonId]/page.tsx

import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import NavSidebar from '@/components/NavSidebar';
import StableVideoPlayer from '@/components/StableVideoPlayer';
import DocumentsSection from '@/components/DocumentsSection';
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
  CreditCard,
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
  flashcardIds?: string[];
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

interface DocumentTranslation {
  locale: string;
  title: string;
  description: string;
  url: string;
}

interface Document {
  id: string;
  filename: string;
  translations: DocumentTranslation[];
  createdAt: string;
  updatedAt: string;
}

interface FlashcardTranslation {
  locale: string;
  title: string;
}

interface Flashcard {
  id: string;
  slug: string;
  questionText?: string;
  questionImageUrl?: string;
  questionType: 'TEXT' | 'IMAGE';
  answerText?: string;
  answerImageUrl?: string;
  answerType: 'TEXT' | 'IMAGE';
  translations?: FlashcardTranslation[];
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
    `${API_URL}/api/v1/courses`,
    { cache: 'no-store' }
  ).then(r => (r.ok ? r.json() : Promise.reject()));
  const course =
    courses.find(c => c.slug === slug) ?? notFound();

  const modules: ModuleData[] = await fetch(
    `${API_URL}/api/v1/courses/${course.id}/modules`,
    { cache: 'no-store' }
  ).then(r => (r.ok ? r.json() : Promise.reject()));
  const moduleFound =
    modules.find(m => m.slug === moduleSlug) ?? notFound();

  const lesson: Lesson = await fetch(
    `${API_URL}/api/v1/courses/${course.id}/modules/${moduleFound.id}/lessons/${lessonId}`,
    { cache: 'no-store' }
  ).then(r => (r.ok ? r.json() : notFound()));

  const pandaData = lesson.video?.providerVideoId
    ? await fetchPandaVideoData(
        lesson.video.providerVideoId
      )
    : null;

  const [allLessons, assessmentsData, documentsData]: [
    LessonsResponse,
    AssessmentsResponse,
    Document[]
  ] = await Promise.all([
    fetch(
      `${API_URL}/api/v1/courses/${course.id}/modules/${moduleFound.id}/lessons`,
      { cache: 'no-store' }
    ).then(r => (r.ok ? r.json() : Promise.reject())),
    fetch(
      `${API_URL}/api/v1/assessments?lessonId=${lessonId}`,
      { cache: 'no-store' }
    ).then(r =>
      r.ok ? r.json() : { assessments: [], pagination: {} }
    ),
    fetch(
      `${API_URL}/api/v1/lessons/${lessonId}/documents`,
      { cache: 'no-store' }
    ).then(r => (r.ok ? r.json() : [])),
  ]);

  // Buscar flashcards se a lesson tiver flashcardIds
  let flashcards: Flashcard[] = [];
  if (lesson.flashcardIds && lesson.flashcardIds.length > 0) {
    try {
      flashcards = await Promise.all(
        lesson.flashcardIds.map(id =>
          fetch(`${API_URL}/api/v1/flashcards/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
          }).then(r => r.ok ? r.json() : null)
        )
      );
      // Filtrar nulls caso algum flashcard não seja encontrado
      flashcards = flashcards.filter(f => f !== null);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    }
  }

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
  const documents = documentsData || [];

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

  // Calculate lesson image URL outside of JSX
  const lessonImageUrl = lesson.imageUrl || pandaData?.thumbnail || '';

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Breadcrumb header melhorado */}
        <div className="bg-primary-dark border-b border-secondary/20">
          <div className="p-6">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <Link
                href={`/${locale}`}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <div className="w-4 h-4 rounded bg-secondary/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                </div>
                {tLesson('breadcrumb.dashboard')}
              </Link>
              <ChevronRight
                size={12}
                className="text-secondary/40"
              />
              <Link
                href={`/${locale}/courses/${slug}`}
                className="hover:text-white transition-colors"
              >
                {ct.title}
              </Link>
              <ChevronRight
                size={12}
                className="text-secondary/40"
              />
              <Link
                href={`/${locale}/courses/${slug}/modules/${moduleSlug}`}
                className="hover:text-white transition-colors"
              >
                {mt.title}
              </Link>
              <ChevronRight
                size={12}
                className="text-secondary/40"
              />
              <span className="text-white font-medium">
                {lt.title}
              </span>
            </div>
            <Link
              href={`/${locale}/courses/${slug}/modules/${moduleSlug}`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span className="text-sm">
                {tLesson('back')}
              </span>
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:flex">
          {/* Video player - Only show if lesson has video */}
          {(lesson.video?.providerVideoId ||
            pandaData?.video_external_id) && (
            <div
              className="flex-1 bg-primary lg:ml-4"
              style={{ minHeight: '480px' }}
            >
              <StableVideoPlayer
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
                lessonId={lessonId}
                courseId={course.id}
                moduleId={moduleFound.id}
                // Additional context for Continue Learning
                lessonTitle={lt.title}
                courseTitle={ct.title}
                courseSlug={slug}
                moduleTitle={mt.title}
                moduleSlug={moduleSlug}
                lessonImageUrl={lessonImageUrl}
              />
            </div>
          )}

          {/* Sidebar */}
          <aside
            className={`bg-primary-dark p-6 overflow-y-auto ${
              lesson.video?.providerVideoId ||
              pandaData?.video_external_id
                ? 'lg:w-96'
                : 'flex-1'
            }`}
          >
            {/* Show no video message if there's no video and sidebar is full width */}
            {!(
              lesson.video?.providerVideoId ||
              pandaData?.video_external_id
            ) && (
              <div className="mb-8 p-6 bg-primary/50 rounded-lg border border-secondary/30 text-center">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="w-16 h-16 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-300 text-lg font-medium">
                  {tLesson('noVideo')}
                </p>
              </div>
            )}

            {/* Hierarquia do curso */}
            <div className="mb-6">
              <div className="bg-primary/30 rounded-lg p-3 space-y-2 border border-secondary/20">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User
                      size={14}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {tLesson('course')}
                    </p>
                    <p className="text-white font-medium">
                      {ct.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <BookOpen
                      size={14}
                      className="text-secondary"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {tLesson('module')}
                    </p>
                    <p className="text-white font-medium">
                      {mt.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações da Aula */}
            <div className="mb-6">
              {/* Cabeçalho com badge e título */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="inline-flex items-center bg-accent-light text-white px-3 py-1 rounded-full text-xs font-bold">
                    {tLesson('lessonNumber', {
                      number: idx + 1,
                    })}
                  </div>
                  {(lesson.video?.durationInSeconds ||
                    pandaData?.length) && (
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Clock size={14} />
                      <span>
                        {Math.ceil(
                          (lesson.video
                            ?.durationInSeconds ??
                            pandaData?.length ??
                            0) / 60
                        )}{' '}
                        {tLesson('minutes')}
                      </span>
                    </div>
                  )}
                </div>
                <h1 className="text-xl font-bold text-white mb-2">
                  {lt.title}
                </h1>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {lt.description}
                </p>
              </div>
            </div>

            {/* Navegação Anterior/Próxima */}
            <div className="border-t border-secondary/20 pt-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                {prev ? (
                  <Link
                    href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${prev.id}`}
                    className="group flex flex-col p-3 bg-primary/40 rounded-lg hover:bg-primary/60 transition-all duration-300 border border-secondary/30 hover:border-secondary/50"
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <ChevronLeft
                        size={14}
                        className="group-hover:-translate-x-1 transition-transform"
                      />
                      {tLesson('previousLesson')}
                    </div>
                    <p className="text-sm text-white font-medium truncate">
                      {
                        prev.translations.find(
                          t => t.locale === locale
                        )?.title
                      }
                    </p>
                  </Link>
                ) : (
                  <div></div>
                )}
                {next ? (
                  <Link
                    href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${next.id}`}
                    className="group flex flex-col p-3 bg-primary/40 rounded-lg hover:bg-primary/60 transition-all duration-300 border border-secondary/30 hover:border-secondary/50"
                  >
                    <div className="flex items-center justify-end gap-2 text-xs text-gray-500 mb-1">
                      {tLesson('nextLesson')}
                      <ChevronRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                    <p className="text-sm text-white font-medium truncate text-right">
                      {
                        next.translations.find(
                          t => t.locale === locale
                        )?.title
                      }
                    </p>
                  </Link>
                ) : (
                  <div></div>
                )}
              </div>
            </div>

            {/* Documents section */}
            <DocumentsSection
              documents={documents}
              locale={locale}
            />

            {/* Flashcards section */}
            {flashcards.length > 0 && (
              <div className="mt-8">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <CreditCard
                        size={20}
                        className="text-secondary"
                      />
                    </div>
                    {tLesson('flashcards')}
                  </h4>
                  <div className="h-0.5 w-16 bg-gradient-to-r from-secondary to-transparent rounded-full ml-11"></div>
                </div>
                
                {/* Simple button to study flashcards */}
                <Link
                  href={`/${locale}/flashcards/study?lessonId=${lessonId}`}
                  className="w-full text-center py-3 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30 transition-colors font-medium border border-secondary/30 flex items-center justify-center gap-2"
                >
                  <CreditCard size={18} />
                  {tLesson('studyFlashcards')}
                  <ExternalLink size={14} />
                </Link>
              </div>
            )}

            {/* Assessments section */}
            {assessments.length > 0 && (
              <div className="mt-8">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <ClipboardList
                        size={20}
                        className="text-secondary"
                      />
                    </div>
                    {tLesson('assessments')}
                  </h4>
                  <div className="h-0.5 w-16 bg-gradient-to-r from-secondary to-transparent rounded-full ml-11"></div>
                </div>
                <div className="space-y-3 overflow-visible">
                  {assessments.map(assessment => (
                    <div
                      key={assessment.id}
                      className="group relative bg-primary/40 rounded-lg border border-secondary/30 hover:border-secondary/50 transition-all duration-300 overflow-visible hover:shadow-lg hover:shadow-secondary/20"
                    >
                      {/* Assessment icon positioned in top-left corner - appears on hover */}
                      {assessment.type === 'QUIZ' && (
                        <Image
                          src="/icons/quiz.svg"
                          alt="Quiz"
                          width={40}
                          height={40}
                          className="absolute -top-2 -left-5 w-10 h-10 z-10 opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                        />
                      )}
                      {assessment.type === 'SIMULADO' && (
                        <Image
                          src="/icons/rating.svg"
                          alt="Simulado"
                          width={40}
                          height={40}
                          className="absolute -top-2 -left-5 w-10 h-10 z-10 opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                        />
                      )}
                      {assessment.type ===
                        'PROVA_ABERTA' && (
                        <Image
                          src="/icons/examination.svg"
                          alt="Prova Aberta"
                          width={28}
                          height={28}
                          className="absolute -top-1 -left-3 w-7 h-7 z-10 opacity-0 scale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                        />
                      )}

                      {/* Collapsed state - only title and type */}
                      <div className="p-4 transition-all duration-300 group-hover:pb-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-white group-hover:text-secondary transition-colors duration-300">
                            {assessment.title}
                          </h5>
                          <span
                            className={`px-2 py-1 text-xs rounded-full font-medium transition-all duration-300 ${
                              assessment.type === 'QUIZ'
                                ? 'bg-primary text-accent-light border border-blue-500/30'
                                : assessment.type ===
                                  'SIMULADO'
                                ? 'bg-secondary/20 text-accent-light border border-secondary/30'
                                : 'bg-accent text-primary border border-primary/40'
                            }`}
                          >
                            {tLesson(
                              `assessmentTypes.${assessment.type.toLowerCase()}`
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Expanded content on hover */}
                      <div className="max-h-0 opacity-0 group-hover:max-h-96 group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden">
                        <div className="px-4 pb-4">
                          {assessment.description && (
                            <p className="text-gray-400 text-sm mb-3 pt-2">
                              {assessment.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              {assessment.timeLimitInMinutes && (
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {
                                    assessment.timeLimitInMinutes
                                  }{' '}
                                  min
                                </span>
                              )}
                              {assessment.passingScore && (
                                <span>
                                  {tLesson('passingScore')}:{' '}
                                  {assessment.passingScore}%
                                </span>
                              )}
                            </div>

                            <Link
                              href={`/${locale}/lessons/${lessonId}/assessments/${assessment.id}`}
                              className="flex items-center gap-2 px-3 py-1 bg-secondary text-primary rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium transform scale-0 group-hover:scale-100 transition-transform duration-300"
                            >
                              {tLesson('startAssessment')}
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Aulas do Módulo */}
            <div className="mt-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <BookOpen
                        size={20}
                        className="text-secondary"
                      />
                    </div>
                    {tLesson('moduleLessons')}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {sorted.length} {tLesson('lessons')}
                  </span>
                </div>
                <div className="h-0.5 w-16 bg-gradient-to-r from-secondary to-transparent rounded-full ml-11"></div>
              </div>
              <div className="bg-primary/20 rounded-lg p-2 max-h-80 overflow-y-auto border border-secondary/20">
                <ul className="space-y-1">
                  {sorted.map((l, i) => {
                    const isCurrentLesson =
                      l.id === lessonId;
                    const lessonTranslation =
                      l.translations.find(
                        t => t.locale === locale
                      );
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${l.id}`}
                          className={`
                            group flex items-center gap-3 p-2 rounded-lg text-sm transition-all duration-200
                            ${
                              isCurrentLesson
                                ? 'bg-accent-light text-white shadow-sm'
                                : 'text-gray-400 hover:bg-primary/40 hover:text-white'
                            }
                          `}
                        >
                          <div
                            className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${
                              isCurrentLesson
                                ? 'bg-white/20'
                                : 'bg-primary/50 group-hover:bg-secondary/30'
                            }
                          `}
                          >
                            {i + 1}
                          </div>
                          <span className="flex-1 truncate">
                            {lessonTranslation?.title}
                          </span>
                          {isCurrentLesson && (
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </aside>
        </div>
        
        {/* Heartbeat Status Indicator (Development Only) */}
      </div>
    </NavSidebar>
  );
}
