//src/app/[locale]/couses/[slug]/modules/[modulesSlug]/lessons/[lessonId]/assessments/[assessmentId]/page
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import QuizPage from '@/components/QuizPage';
import SimuladoPage from '@/components/SimuladoPage';
import ProvaAbertaPage from '@/components/ProvaAbertaPage';
import OralExamPage from '@/components/OralExamPage';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  ClipboardList,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface Assessment {
  id: string;
  slug: string;

  title: string;
  description?: string;
  type: 'QUIZ' | 'SIMULADO' | 'PROVA_ABERTA' | 'ORAL_EXAM';
  quizPosition?: 'BEFORE_LESSON' | 'AFTER_LESSON';
  passingScore?: number;
  timeLimitInMinutes?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  lessonId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN_QUESTION' | 'OPEN';
  options: Option[];
  argumentId?: string;
  argumentName?: string;
  createdAt: string;
  updatedAt: string;
}

interface QuestionsResponse {
  questions: Question[];
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{
    locale: string;
    slug: string;
    moduleSlug: string;
    lessonId: string;
    assessmentId: string;
  }>;
}) {
  const {
    locale,
    slug,
    moduleSlug,
    lessonId,
    assessmentId,
  } = await params;
  const API_URL = process.env.NEXT_PUBLIC_API_URL!;

  const tAssessment = await getTranslations({
    locale,
    namespace: 'Assessment',
  });
  const tLesson = await getTranslations({
    locale,
    namespace: 'Lesson',
  });

  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  // Fetch assessment details
  console.log('Fetching assessment:', assessmentId);
  const assessmentResponse = await fetch(
    `${API_URL}/api/v1/assessments/${assessmentId}`,
    {
      cache: 'no-store',
      headers: {
        Cookie: `token=${token}`,
      },
    }
  );

  console.log(
    'Assessment response status:',
    assessmentResponse.status
  );

  if (!assessmentResponse.ok) {
    console.error('Failed to fetch assessment');
    return notFound();
  }

  const assessmentData = await assessmentResponse.json();
  const assessment: Assessment =
    assessmentData.assessment || assessmentData;

  // Fetch questions for this assessment
  console.log(
    'Fetching questions for assessment:',
    assessmentId
  );
  const questionsResponse = await fetch(
    `${API_URL}/api/v1/assessments/${assessmentId}/questions`,
    {
      cache: 'no-store',
      headers: {
        Cookie: `token=${token}`,
      },
    }
  );

  console.log(
    'Questions response status:',
    questionsResponse.status
  );

  const questionsData: QuestionsResponse =
    questionsResponse.ok
      ? await questionsResponse.json()
      : { questions: [] };

  const questions = questionsData.questions || [];

  // Debug logging
  console.log('Assessment type:', assessment.type);
  console.log('Assessment data:', assessment);

  // Render different components based on assessment type
  if (assessment.type === 'QUIZ') {
    return (
      <NavSidebar>
        <div className="flex-1 flex flex-col bg-primary min-h-screen">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lessonId}`}
                className="inline-flex items-center gap-2 text-white hover:text-secondary"
              >
                <ArrowLeft size={20} /> {tLesson('back')}
              </Link>

              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  <span>
                    {questions.length}{' '}
                    {tAssessment('questions')}
                  </span>
                </div>
                {assessment.timeLimitInMinutes && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>
                      {assessment.timeLimitInMinutes} min
                    </span>
                  </div>
                )}
                {assessment.passingScore && (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>
                      {assessment.passingScore}%{' '}
                      {tAssessment('passingScore')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">
                {assessment.title}
              </h1>
              {assessment.description && (
                <p className="text-gray-300">
                  {assessment.description}
                </p>
              )}
            </div>
          </div>

          {/* Quiz Component */}
          <QuizPage
            assessment={assessment}
            questions={questions}
            locale={locale}
            backUrl={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lessonId}`}
          />
        </div>
      </NavSidebar>
    );
  }

  if (assessment.type === 'SIMULADO') {
    return (
      <NavSidebar>
        <div className="flex-1 flex flex-col bg-primary min-h-screen">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lessonId}`}
                className="inline-flex items-center gap-2 text-white hover:text-secondary"
              >
                <ArrowLeft size={20} /> {tLesson('back')}
              </Link>

              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  <span>
                    {questions.length}{' '}
                    {tAssessment('questions')}
                  </span>
                </div>
                {assessment.timeLimitInMinutes && (
                  <div className="flex items-center gap-2 text-orange-400">
                    <Clock size={16} />
                    <span>
                      {assessment.timeLimitInMinutes} min
                    </span>
                  </div>
                )}
                {assessment.passingScore && (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>
                      {assessment.passingScore}%{' '}
                      {tAssessment('passingScore')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">
                {assessment.title}
              </h1>
              {assessment.description && (
                <p className="text-gray-300">
                  {assessment.description}
                </p>
              )}
            </div>
          </div>

          {/* Simulado Component */}
          <SimuladoPage
            assessment={assessment}
            questions={questions}
            locale={locale}
            backUrl={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lessonId}`}
          />
        </div>
      </NavSidebar>
    );
  }

  if (assessment.type === 'PROVA_ABERTA') {
    return (
      <NavSidebar>
        <div className="flex-1 flex flex-col bg-primary min-h-screen">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lessonId}`}
                className="inline-flex items-center gap-2 text-white hover:text-secondary"
              >
                <ArrowLeft size={20} /> {tLesson('back')}
              </Link>

              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  <span>
                    {questions.length}{' '}
                    {tAssessment('questions')}
                  </span>
                </div>
                {assessment.passingScore && (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>
                      {assessment.passingScore}%{' '}
                      {tAssessment('passingScore')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">
                {assessment.title}
              </h1>
              {assessment.description && (
                <p className="text-gray-300">
                  {assessment.description}
                </p>
              )}
            </div>
          </div>

          {/* Prova Aberta Component */}
          <ProvaAbertaPage
            assessment={assessment}
            questions={questions}
            locale={locale}
            backUrl={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lessonId}`}
          />
        </div>
      </NavSidebar>
    );
  }

  if (assessment.type === 'ORAL_EXAM') {
    return (
      <NavSidebar>
        <OralExamPage
          assessment={assessment}
          questions={questions}
          backUrl={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lessonId}`}
        />
      </NavSidebar>
    );
  }

  // Fallback for unknown assessment types
  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        <div className="p-6 border-b border-gray-800">
          <Link
            href={`/${locale}/courses/${slug}/modules/${moduleSlug}/lessons/${lessonId}`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary"
          >
            <ArrowLeft size={20} /> {tLesson('back')}
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <AlertCircle
              size={48}
              className="text-yellow-400 mx-auto"
            />
            <h1 className="text-2xl font-bold text-white">
              {assessment.title}
            </h1>
            <p className="text-gray-400 max-w-md">
              Assessment type not supported
            </p>
          </div>
        </div>
      </div>
    </NavSidebar>
  );
}
