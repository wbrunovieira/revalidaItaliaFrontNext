// src/components/LessonPageContent.tsx
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLesson, useModuleLessons } from '@/hooks/queries/useLesson';
import { useLessonAssessments } from '@/hooks/queries/useLessonAssessments';
import { useLessonDocuments } from '@/hooks/queries/useLessonDocuments';
import { useLessonFlashcards } from '@/hooks/queries/useLessonFlashcards';
import { useCourses, useCourseModules } from '@/hooks/queries/useCourse';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import StableVideoPlayer from '@/components/StableVideoPlayer';
import DocumentsSection from '@/components/DocumentsSection';
import LiveSessionsSection from '@/components/LiveSessionsSection';
import LessonComments from '@/components/LessonComments';
import LessonAccessTracker from '@/components/LessonAccessTracker';
import CollapsibleAssessments from '@/components/CollapsibleAssessments';
import LessonCompletionButton from '@/components/LessonCompletionButton';
import ModuleLessonsList from '@/components/ModuleLessonsList';
import AudioPlayerSection from '@/components/AudioPlayerSection';
import AudioLessonPlayer from '@/components/AudioLessonPlayer';
import AnimationsSection from '@/components/AnimationsSection';
import ExercisesExpandable from '@/components/exercises/ExercisesExpandable';
import Environment3DLoader from '@/components/3d-environments/Environment3DLoader';
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
  Loader2,
} from 'lucide-react';

import type { Course, Module } from '@/hooks/queries/useCourse';
import type { Lesson, LessonsResponse } from '@/hooks/queries/useLesson';
import type { Document } from '@/hooks/queries/useLessonDocuments';
import type { Flashcard } from '@/hooks/queries/useLessonFlashcards';

interface AssessmentsData {
  assessments: Array<{
    id: string;
    slug: string;
    title: string;
    description?: string;
    type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA';
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface PandaData {
  video_external_id: string;
  video_player: string;
  thumbnail: string;
  length: number;
}

interface LessonPageContentProps {
  locale: string;
  courseSlug: string;
  moduleSlug: string;
  lessonId: string;
  // Initial data from server for hydration
  initialCourse?: Course;
  initialModule?: Module;
  initialLesson?: Lesson;
  initialLessons?: LessonsResponse;
  initialAssessments?: AssessmentsData;
  initialDocuments?: Document[];
  initialFlashcards?: Flashcard[];
  pandaData?: PandaData | null;
}

export default function LessonPageContent({
  locale,
  courseSlug,
  moduleSlug,
  lessonId,
  initialCourse,
  initialModule,
  initialLesson,
  initialLessons,
  initialAssessments,
  initialDocuments,
  initialFlashcards,
  pandaData,
}: LessonPageContentProps) {
  const queryClient = useQueryClient();
  const tLesson = useTranslations('Lesson');

  // Fetch courses (with initial data for hydration)
  const { data: courses = [] } = useCourses();
  const course = courses.find(c => c.slug === courseSlug) || initialCourse;

  // Fetch modules (with initial data)
  const { data: modules = [] } = useCourseModules({
    courseId: course?.id || '',
    enabled: !!course?.id,
  });
  const moduleFound = modules.find(m => m.slug === moduleSlug) || initialModule;

  // Fetch lesson data
  const { data: lesson, isLoading: lessonLoading } = useLesson({
    courseId: course?.id || '',
    moduleId: moduleFound?.id || '',
    lessonId,
    enabled: !!course?.id && !!moduleFound?.id,
  });

  // Fetch module lessons for navigation
  const { data: lessonsResponse } = useModuleLessons({
    courseId: course?.id || '',
    moduleId: moduleFound?.id || '',
    page: 1,
    limit: 10,
    enabled: !!course?.id && !!moduleFound?.id,
  });

  // Fetch assessments
  const { data: assessmentsData } = useLessonAssessments({
    lessonId,
  });

  // Fetch documents
  const { data: documents = [] } = useLessonDocuments({
    lessonId,
  });

  // Fetch flashcards if lesson has them
  // Use initialLesson.flashcardIds as fallback while lesson is loading
  const flashcardIds = lesson?.flashcardIds || initialLesson?.flashcardIds || [];

  const { data: flashcards = [] } = useLessonFlashcards({
    flashcardIds,
    enabled: flashcardIds.length > 0,
  });

  // DEBUG: Log lesson data including animations
  useEffect(() => {
    if (lesson) {
      console.log('📚 LessonPageContent - lesson data:', lesson);
      console.log('📚 LessonPageContent - lesson.animations:', lesson.animations);
      console.log('📚 LessonPageContent - animations count:', lesson.animations?.length);
    }
  }, [lesson]);

  // Hydrate cache with initial data on mount
  useEffect(() => {
    if (initialCourse) {
      queryClient.setQueryData(['courses'], [initialCourse]);
    }
    if (initialModule && course?.id) {
      queryClient.setQueryData(['course-modules', course.id], [initialModule]);
    }
    if (initialLesson && course?.id && moduleFound?.id) {
      queryClient.setQueryData(
        ['lesson', course.id, moduleFound.id, lessonId],
        initialLesson
      );
    }
    if (initialLessons && course?.id && moduleFound?.id) {
      queryClient.setQueryData(
        ['module-lessons', course.id, moduleFound.id, 1, 10],
        initialLessons
      );
    }
    if (initialAssessments) {
      queryClient.setQueryData(['lesson-assessments', lessonId], initialAssessments);
    }
    if (initialDocuments) {
      queryClient.setQueryData(['lesson-documents', lessonId], initialDocuments);
    }
    const hydrateFlashcardIds = initialLesson?.flashcardIds || lesson?.flashcardIds;
    if (initialFlashcards && hydrateFlashcardIds && hydrateFlashcardIds.length > 0) {
      queryClient.setQueryData(
        ['flashcards', [...hydrateFlashcardIds].sort().join(',')],
        initialFlashcards
      );
    }
  }, [
    queryClient,
    initialCourse,
    initialModule,
    initialLesson,
    initialLessons,
    initialAssessments,
    initialDocuments,
    initialFlashcards,
    course?.id,
    moduleFound?.id,
    lessonId,
    lesson?.flashcardIds,
  ]);

  // Show loading state
  if (lessonLoading || !lesson || !course || !moduleFound) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-primary">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-secondary mx-auto mb-4" />
          <p className="text-gray-400">Carregando aula...</p>
        </div>
      </div>
    );
  }

  const assessments = assessmentsData?.assessments || [];
  const allLessons = lessonsResponse?.lessons || [];

  // Sort lessons and find prev/next
  const sorted = [...allLessons].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const idx = sorted.findIndex(l => l.id === lessonId);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  // Get translations
  const ct =
    course.translations.find(t => t.locale === locale) ||
    course.translations[0] || {
      locale: locale,
      title: course.slug,
      description: ''
    };
  const mt =
    moduleFound.translations.find(t => t.locale === locale) ||
    moduleFound.translations[0] || {
      locale: locale,
      title: moduleFound.slug,
      description: ''
    };
  const lt =
    lesson.translations.find(t => t.locale === locale) ||
    lesson.translations[0] || {
      locale: locale,
      title: lessonId,
      description: ''
    };
  const vt =
    lesson.video?.translations.find(t => t.locale === locale) ||
    lesson.video?.translations[0] || {
      locale: locale,
      title: lesson.video?.slug || '',
      description: ''
    };

  const lessonImageUrl = lesson.imageUrl || pandaData?.thumbnail || '';

  return (
    <>
      {/* Track lesson access */}
      <LessonAccessTracker
        lessonId={lesson.id}
        lessonTitle={lt.title}
        courseId={course.id}
        courseTitle={ct.title}
        courseSlug={course.slug}
        moduleId={moduleFound.id}
        moduleTitle={mt.title}
        moduleSlug={moduleFound.slug}
        lessonImageUrl={lessonImageUrl}
        hasVideo={!!(lesson.video?.providerVideoId || pandaData?.video_external_id)}
        locale={locale}
      />

      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Breadcrumb header */}
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
              <ChevronRight size={12} className="text-secondary/40" />
              <Link
                href={`/${locale}/courses/${courseSlug}`}
                className="hover:text-white transition-colors"
              >
                {ct.title}
              </Link>
              <ChevronRight size={12} className="text-secondary/40" />
              <Link
                href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}`}
                className="hover:text-white transition-colors"
              >
                {mt.title}
              </Link>
              <ChevronRight size={12} className="text-secondary/40" />
              <span className="text-white font-medium">{lt.title}</span>
            </div>
            <Link
              href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              <span className="text-sm">{tLesson('back')}</span>
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {lesson.type === 'ENVIRONMENT_3D' && lesson.environment3d?.slug ? (
            // Layout for 3D Environment
            <div className="lg:flex">
              {/* Left column - 3D Environment */}
              <div className="flex-1 bg-primary">
                <div className="bg-primary lg:ml-4">
                  <Environment3DLoader
                    slug={lesson.environment3d.slug}
                    lessonId={lessonId}
                    locale={locale}
                  />
                </div>

                <div className="lg:ml-4 mt-8">
                  <LessonComments
                    lessonId={lessonId}
                    courseId={course.id}
                    moduleId={moduleFound.id}
                    locale={locale}
                    lessonTitle={lt.title}
                  />
                </div>
              </div>

              {/* Sidebar */}
              <aside className="bg-primary-dark p-6 overflow-y-auto lg:w-96">
                {/* Course hierarchy */}
                <div className="mb-6">
                  <div className="bg-primary/30 rounded-lg p-3 space-y-2 border border-secondary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{tLesson('course')}</p>
                        <p className="text-white font-medium">{ct.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                        <BookOpen size={14} className="text-secondary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{tLesson('module')}</p>
                        <p className="text-white font-medium">{mt.title}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson info */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="inline-flex items-center bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-bold">
                      3D
                    </div>
                    <div className="inline-flex items-center bg-accent-light text-white px-3 py-1 rounded-full text-xs font-bold">
                      {tLesson('lessonNumber', { number: idx + 1 })}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{lt.title}</h2>
                  <p className="text-gray-400 text-sm mb-4">{lt.description}</p>

                  <LessonCompletionButton
                    lessonId={lesson.id}
                    courseId={course.id}
                    moduleId={moduleFound.id}
                    hasVideo={false}
                  />
                </div>

                {/* Documents */}
                <DocumentsSection
                  documents={documents}
                  locale={locale}
                  lessonId={lessonId}
                />

                {/* Flashcards */}
                {(flashcards.length > 0 || (initialFlashcards && initialFlashcards.length > 0)) && (
                  <div className="mt-6">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                        <div className="p-2 bg-secondary/20 rounded-lg">
                          <CreditCard size={20} className="text-secondary" />
                        </div>
                        {tLesson('flashcards')}
                      </h4>
                      <div className="h-0.5 w-16 bg-gradient-to-r from-secondary to-transparent rounded-full ml-11"></div>
                    </div>

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

                {/* Assessments */}
                {assessments.length > 0 && (
                  <CollapsibleAssessments
                    assessments={assessments}
                    locale={locale}
                    lessonId={lessonId}
                  />
                )}

                {/* Module lessons list */}
                <ModuleLessonsList
                  lessons={sorted}
                  currentLessonId={lessonId}
                  moduleId={moduleFound.id}
                  courseSlug={courseSlug}
                  moduleSlug={moduleSlug}
                  locale={locale}
                  courseId={course.id}
                  initialPage={lessonsResponse?.pagination.page || 1}
                  initialTotalPages={lessonsResponse?.pagination.totalPages || 1}
                  initialTotal={lessonsResponse?.pagination.total || 0}
                />
              </aside>
            </div>
          ) : (lesson.video?.providerVideoId || pandaData?.video_external_id) ? (
            // Layout WITH video
            <div className="lg:flex">
              {/* Left column - Video and Comments */}
              <div className="flex-1 bg-primary">
                <div className="bg-primary lg:ml-4" style={{ minHeight: '480px' }}>
                  <StableVideoPlayer
                    videoId={
                      pandaData?.video_external_id ??
                      lesson.video?.providerVideoId ??
                      ''
                    }
                    playerUrl={pandaData?.video_player}
                    title={vt?.title || lt.title || pandaData?.video_external_id}
                    thumbnailUrl={lesson.video?.imageUrl ?? pandaData?.thumbnail}
                    lessonId={lessonId}
                    courseId={course.id}
                    moduleId={moduleFound.id}
                    lessonTitle={lt.title}
                    courseTitle={ct.title}
                    courseSlug={courseSlug}
                    moduleTitle={mt.title}
                    moduleSlug={moduleSlug}
                    lessonImageUrl={lessonImageUrl}
                  />
                </div>

                {/* Interactive Exercises - Expandable section below video */}
                {lesson.animations && lesson.animations.length > 0 && (
                  <div className="lg:ml-4 mt-6">
                    <ExercisesExpandable
                      lessonId={lessonId}
                      animations={lesson.animations}
                    />
                  </div>
                )}

                <div className="lg:ml-4 mt-8">
                  <LessonComments
                    lessonId={lessonId}
                    courseId={course.id}
                    moduleId={moduleFound.id}
                    locale={locale}
                    lessonTitle={lt.title}
                  />
                </div>
              </div>

              {/* Sidebar */}
              <aside className="bg-primary-dark p-6 overflow-y-auto lg:w-96">
                {/* Course hierarchy */}
                <div className="mb-6">
                  <div className="bg-primary/30 rounded-lg p-3 space-y-2 border border-secondary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{tLesson('course')}</p>
                        <p className="text-white font-medium">{ct.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                        <BookOpen size={14} className="text-secondary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{tLesson('module')}</p>
                        <p className="text-white font-medium">{mt.title}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson info */}
                <div className="mb-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="inline-flex items-center bg-accent-light text-white px-3 py-1 rounded-full text-xs font-bold">
                        {tLesson('lessonNumber', { number: idx + 1 })}
                      </div>
                      {(lesson.video?.durationInSeconds || pandaData?.length) && (
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Clock size={14} />
                          <span>
                            {Math.ceil(
                              (lesson.video?.durationInSeconds ??
                                pandaData?.length ??
                                0) / 60
                            )}{' '}
                            {tLesson('minutes')}
                          </span>
                        </div>
                      )}
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">{lt.title}</h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {lt.description}
                    </p>
                  </div>

                  <div className="mt-4">
                    <LessonCompletionButton
                      lessonId={lesson.id}
                      courseId={course.id}
                      moduleId={moduleFound.id}
                      hasVideo={!!(lesson.video?.providerVideoId || pandaData?.video_external_id)}
                    />
                  </div>
                </div>

                {/* Navigation */}
                <div className="border-t border-secondary/20 pt-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    {prev ? (
                      <Link
                        href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${prev.id}`}
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
                          {prev.translations.find(t => t.locale === locale)?.title}
                        </p>
                      </Link>
                    ) : (
                      <div></div>
                    )}
                    {next ? (
                      <Link
                        href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${next.id}`}
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
                          {next.translations.find(t => t.locale === locale)?.title}
                        </p>
                      </Link>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <DocumentsSection
                  documents={documents}
                  locale={locale}
                  lessonId={lessonId}
                />

                {/* Audio Player - Interactive Lessons */}
                {lesson.audios && lesson.audios.length > 0 && (
                  <AudioPlayerSection
                    audios={lesson.audios}
                    locale={locale}
                  />
                )}

                {/* Animations - Interactive Lessons */}
                {lesson.animations && lesson.animations.length > 0 && (
                  <AnimationsSection animations={lesson.animations} />
                )}

                {/* Live Sessions */}
                {lesson.liveSessionRecordings && lesson.liveSessionRecordings.length > 0 && (
                  <div className="mt-12">
                    <LiveSessionsSection
                      liveSessionRecordings={lesson.liveSessionRecordings}
                      locale={locale}
                      courses={courses}
                      modules={modules}
                    />
                  </div>
                )}

                {/* Flashcards */}
                {(flashcards.length > 0 || (initialFlashcards && initialFlashcards.length > 0)) && (
                  <div className="mt-12">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                        <div className="p-2 bg-secondary/20 rounded-lg">
                          <CreditCard size={20} className="text-secondary" />
                        </div>
                        {tLesson('flashcards')}
                      </h4>
                      <div className="h-0.5 w-16 bg-gradient-to-r from-secondary to-transparent rounded-full ml-11"></div>
                    </div>

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

                {/* Assessments */}
                {assessments.length > 0 && (
                  <CollapsibleAssessments
                    assessments={assessments}
                    locale={locale}
                    lessonId={lessonId}
                  />
                )}

                {/* Module lessons list */}
                <ModuleLessonsList
                  lessons={sorted}
                  currentLessonId={lessonId}
                  moduleId={moduleFound.id}
                  courseSlug={courseSlug}
                  moduleSlug={moduleSlug}
                  locale={locale}
                  courseId={course.id}
                  initialPage={lessonsResponse?.pagination.page || 1}
                  initialTotalPages={lessonsResponse?.pagination.totalPages || 1}
                  initialTotal={lessonsResponse?.pagination.total || 0}
                />
              </aside>
            </div>
          ) : lesson.audios && lesson.audios.length > 0 ? (
            // Layout for AUDIO-ONLY lessons
            <div className="lg:flex">
              {/* Left column - Audio Player and Comments */}
              <div className="flex-1 bg-primary">
                <div className="bg-primary lg:ml-4 lg:mr-4 py-6">
                  <AudioLessonPlayer
                    audios={lesson.audios}
                    locale={locale}
                    lessonTitle={lt.title}
                  />
                </div>

                {/* Interactive Exercises - Expandable section below audio player */}
                {lesson.animations && lesson.animations.length > 0 && (
                  <div className="lg:ml-4 mt-6">
                    <ExercisesExpandable
                      lessonId={lessonId}
                      animations={lesson.animations}
                    />
                  </div>
                )}

                <div className="lg:ml-4 mt-8">
                  <LessonComments
                    lessonId={lessonId}
                    courseId={course.id}
                    moduleId={moduleFound.id}
                    locale={locale}
                    lessonTitle={lt.title}
                  />
                </div>
              </div>

              {/* Sidebar */}
              <aside className="bg-primary-dark p-6 overflow-y-auto lg:w-96">
                {/* Course hierarchy */}
                <div className="mb-6">
                  <div className="bg-primary/30 rounded-lg p-3 space-y-2 border border-secondary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{tLesson('course')}</p>
                        <p className="text-white font-medium">{ct.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                        <BookOpen size={14} className="text-secondary" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{tLesson('module')}</p>
                        <p className="text-white font-medium">{mt.title}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson info */}
                <div className="mb-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="inline-flex items-center bg-secondary/20 text-secondary px-3 py-1 rounded-full text-xs font-bold">
                        {tLesson('lessonNumber', { number: idx + 1 })}
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <Clock size={14} />
                        <span>
                          {Math.ceil(
                            lesson.audios.reduce((sum, a) => sum + a.durationInSeconds, 0) / 60
                          )}{' '}
                          {tLesson('minutes')}
                        </span>
                      </div>
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">{lt.title}</h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {lt.description}
                    </p>
                  </div>

                  <LessonCompletionButton
                    lessonId={lesson.id}
                    courseId={course.id}
                    moduleId={moduleFound.id}
                    hasVideo={false}
                  />
                </div>

                {/* Previous/Next navigation */}
                <div className="border-t border-secondary/20 pt-4 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    {prev ? (
                      <Link
                        href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${prev.id}`}
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
                          {prev.translations.find(t => t.locale === locale)?.title}
                        </p>
                      </Link>
                    ) : (
                      <div></div>
                    )}
                    {next ? (
                      <Link
                        href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${next.id}`}
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
                          {next.translations.find(t => t.locale === locale)?.title}
                        </p>
                      </Link>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <DocumentsSection
                  documents={documents}
                  locale={locale}
                  lessonId={lessonId}
                />

                {/* Animations section (summary) */}
                {lesson.animations && lesson.animations.length > 0 && (
                  <AnimationsSection animations={lesson.animations} />
                )}

                {/* Live Sessions */}
                {lesson.liveSessionRecordings && lesson.liveSessionRecordings.length > 0 && (
                  <div className="mt-6">
                    <LiveSessionsSection
                      liveSessionRecordings={lesson.liveSessionRecordings}
                      locale={locale}
                      courses={courses}
                      modules={modules}
                    />
                  </div>
                )}

                {/* Flashcards */}
                {flashcards.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <CreditCard size={20} className="text-accent" />
                      {tLesson('flashcards')}
                    </h4>
                    <Link
                      href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lessonId}/flashcards`}
                      className="flex items-center justify-between p-4 bg-primary/30 hover:bg-primary/50 rounded-lg border border-secondary/20 transition-colors group"
                    >
                      <div>
                        <p className="text-white font-medium group-hover:text-secondary transition-colors">
                          {tLesson('studyFlashcards')}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {flashcards.length} {tLesson('flashcard')}
                          {flashcards.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ExternalLink
                        size={18}
                        className="text-gray-400 group-hover:text-secondary transition-colors"
                      />
                    </Link>
                  </div>
                )}

                {/* Assessments */}
                {assessments.length > 0 && (
                  <CollapsibleAssessments
                    assessments={assessments}
                    locale={locale}
                    lessonId={lessonId}
                  />
                )}

                {/* Module lessons list */}
                <ModuleLessonsList
                  lessons={sorted}
                  currentLessonId={lessonId}
                  moduleId={moduleFound.id}
                  courseSlug={courseSlug}
                  moduleSlug={moduleSlug}
                  locale={locale}
                  courseId={course.id}
                  initialPage={lessonsResponse?.pagination.page || 1}
                  initialTotalPages={lessonsResponse?.pagination.totalPages || 1}
                  initialTotal={lessonsResponse?.pagination.total || 0}
                />
              </aside>
            </div>
          ) : (
            // Layout WITHOUT video
            <>
              <div className="bg-primary-dark p-6">
                {/* No video message */}
                <div className="mb-8 max-w-md mx-auto">
                  <div className="p-4 bg-primary/50 rounded-lg border border-secondary/30 text-center">
                    <div className="text-gray-400 mb-2">
                      <svg
                        className="w-12 h-12 mx-auto mb-2"
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
                    <p className="text-gray-300 text-sm">{tLesson('noVideo')}</p>
                  </div>
                </div>

                {/* Lesson info */}
                <div className="max-w-4xl mx-auto mb-8">
                  <div className="bg-primary/30 rounded-lg p-6 border border-secondary/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="inline-flex items-center bg-accent-light text-white px-3 py-1 rounded-full text-xs font-bold">
                        {tLesson('lessonNumber', { number: idx + 1 })}
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">{lt.title}</h1>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      {lt.description}
                    </p>

                    <LessonCompletionButton
                      lessonId={lesson.id}
                      courseId={course.id}
                      moduleId={moduleFound.id}
                      hasVideo={false}
                    />
                  </div>
                </div>

                {/* Content sections */}
                <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Course hierarchy */}
                    <div>
                      <div className="bg-primary/30 rounded-lg p-3 space-y-2 border border-secondary/20">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <User size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{tLesson('course')}</p>
                            <p className="text-white font-medium">{ct.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                            <BookOpen size={14} className="text-secondary" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{tLesson('module')}</p>
                            <p className="text-white font-medium">{mt.title}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    {documents.length > 0 && (
                      <div>
                        <DocumentsSection
                          documents={documents}
                          locale={locale}
                          lessonId={lessonId}
                        />
                      </div>
                    )}

                    {/* Audio Player - Interactive Lessons */}
                    {lesson.audios && lesson.audios.length > 0 && (
                      <div>
                        <AudioPlayerSection
                          audios={lesson.audios}
                          locale={locale}
                        />
                      </div>
                    )}

                    {/* Animations - Interactive Lessons */}
                    {lesson.animations && lesson.animations.length > 0 && (
                      <div>
                        <AnimationsSection animations={lesson.animations} />
                      </div>
                    )}

                    {/* Live Sessions */}
                    {lesson.liveSessionRecordings && lesson.liveSessionRecordings.length > 0 && (
                      <div>
                        <LiveSessionsSection
                          liveSessionRecordings={lesson.liveSessionRecordings}
                          locale={locale}
                          courses={courses}
                          modules={modules}
                        />
                      </div>
                    )}

                    {/* Flashcards */}
                    {(flashcards.length > 0 || (initialFlashcards && initialFlashcards.length > 0)) && (
                      <div className="bg-primary/30 rounded-lg p-4 border border-secondary/20">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <CreditCard size={18} className="text-secondary" />
                          {tLesson('flashcards')}
                        </h3>
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

                    {/* Assessments */}
                    {assessments.length > 0 && (
                      <div className="bg-primary/30 rounded-lg p-4 border border-secondary/20">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <ClipboardList size={18} className="text-secondary" />
                          {tLesson('assessments')}
                        </h3>
                        <div className="space-y-2">
                          {assessments.map(assessment => (
                            <Link
                              key={assessment.id}
                              href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${lessonId}/assessments/${assessment.id}`}
                              className="block p-2 bg-primary/20 rounded hover:bg-primary/40 transition-colors"
                            >
                              <p className="text-white text-sm font-medium">
                                {assessment.title}
                              </p>
                              {assessment.description && (
                                <p className="text-gray-400 text-xs mt-1">
                                  {assessment.description}
                                </p>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="mt-8 flex justify-between">
                    {prev && (
                      <Link
                        href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${prev.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/30 rounded-lg hover:bg-primary/50 transition-colors text-white"
                      >
                        <ChevronLeft size={20} />
                        <span className="text-sm">{tLesson('previous')}</span>
                      </Link>
                    )}
                    {next && (
                      <Link
                        href={`/${locale}/courses/${courseSlug}/modules/${moduleSlug}/lessons/${next.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-primary ml-auto"
                      >
                        <span className="text-sm font-medium">{tLesson('next')}</span>
                        <ChevronRight size={20} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="bg-primary p-6 mt-8">
                <LessonComments
                  lessonId={lessonId}
                  courseId={course.id}
                  moduleId={moduleFound.id}
                  locale={locale}
                  lessonTitle={lt.title}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
