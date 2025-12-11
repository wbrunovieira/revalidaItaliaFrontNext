'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  User,
} from 'lucide-react';
import Environment3DLoader from '@/components/3d-environments/Environment3DLoader';
import LessonComments from '@/components/LessonComments';

interface Translation {
  locale: string;
  title: string;
  description: string;
}

interface Lesson3D {
  id: string;
  slug: string;
  moduleId: string;
  order: number;
  type: 'ENVIRONMENT_3D';
  environment3dSlug: string;
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

interface Module {
  id: string;
  slug: string;
  imageUrl: string | null;
  order: number;
  translations: Translation[];
}

interface Lesson3DPageContentProps {
  locale: string;
  courseSlug: string;
  moduleSlug: string;
  lesson: Lesson3D;
  course: Course;
  module: Module;
}

export default function Lesson3DPageContent({
  locale,
  courseSlug,
  moduleSlug,
  lesson,
  course,
  module,
}: Lesson3DPageContentProps) {
  const tLesson = useTranslations('Lesson');

  // Get translations
  const ct = course.translations.find(t => t.locale === locale) || course.translations[0];
  const mt = module.translations.find(t => t.locale === locale) || module.translations[0];
  const lt = lesson.translations.find(t => t.locale === locale) || lesson.translations[0];

  return (
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

      {/* Main content - 3D Environment Layout */}
      <div className="flex-1 flex flex-col">
        {/* 3D Environment - Full width */}
        <div className="w-full px-4 py-4">
          <Environment3DLoader
            slug={lesson.environment3dSlug}
            lessonId={lesson.id}
            locale={locale}
          />
        </div>

        {/* Compact info bar below 3D */}
        <div className="bg-primary-dark border-t border-b border-secondary/20 px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Course/Module info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <User size={12} className="text-primary" />
                  </div>
                  <span className="text-gray-400 text-xs">{ct.title}</span>
                </div>
                <div className="text-gray-600">•</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                    <BookOpen size={12} className="text-secondary" />
                  </div>
                  <span className="text-gray-400 text-xs">{mt.title}</span>
                </div>
              </div>

              {/* Lesson info */}
              <div className="flex items-center gap-3">
                <span className="bg-accent-light text-white px-3 py-1 rounded-full text-xs font-bold">
                  {tLesson('lessonNumber', { number: lesson.order })}
                </span>
                <h1 className="text-white font-semibold">{lt.title}</h1>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="flex items-center gap-1 text-gray-600 text-sm cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">{tLesson('previousLesson')}</span>
                </button>
                <div className="w-px h-4 bg-gray-700" />
                <button
                  disabled
                  className="flex items-center gap-1 text-gray-600 text-sm cursor-not-allowed"
                >
                  <span className="hidden sm:inline">{tLesson('nextLesson')}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Description */}
            {lt.description && (
              <p className="text-gray-500 text-sm mt-2">{lt.description}</p>
            )}
          </div>
        </div>

        {/* Comments section */}
        <div className="px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <LessonComments
              lessonId={lesson.id}
              courseId={course.id}
              moduleId={module.id}
              locale={locale}
              lessonTitle={lt.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
