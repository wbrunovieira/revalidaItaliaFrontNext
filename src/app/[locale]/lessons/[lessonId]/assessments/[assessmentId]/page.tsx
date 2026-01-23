export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import QuizPage from '@/components/QuizPage';
import SimuladoPage from '@/components/SimuladoPage';
import ProvaAbertaPage from '@/components/ProvaAbertaPage';
import OralExamPage from '@/components/OralExamPage';
import { SupportFloatingButton } from '@/components/SupportFloatingButton';
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
    lessonId: string;
    assessmentId: string;
  }>;
}) {
  const { locale, lessonId, assessmentId } = await params;
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
  const assessmentResponse = await fetch(
    `${API_URL}/api/v1/assessments/${assessmentId}`,
    {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!assessmentResponse.ok) {
    return notFound();
  }

  const assessmentData = await assessmentResponse.json();
  const assessment: Assessment = assessmentData.assessment || assessmentData;

  // Verify that the assessment belongs to the specified lesson
  if (assessment.lessonId !== lessonId) {
    return notFound();
  }

  // Fetch questions for this assessment (usando /detailed para aplicar randomização do backend)
  const questionsResponse = await fetch(
    `${API_URL}/api/v1/assessments/${assessmentId}/questions/detailed`,
    {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const questionsData: QuestionsResponse = questionsResponse.ok
    ? await questionsResponse.json()
    : { questions: [] };

  const questions = questionsData.questions || [];

  // For the back URL, we'll use the assessments list page for now
  // In the future, we could fetch lesson details to build the proper back URL
  const backUrl = `/${locale}/assessments`;

  // Render different components based on assessment type
  if (assessment.type === 'QUIZ') {
    return (
      <NavSidebar>
        <div className="flex-1 flex flex-col bg-primary min-h-screen">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={backUrl}
                className="inline-flex items-center gap-2 text-white hover:text-secondary"
              >
                <ArrowLeft size={20} /> {tLesson('back')}
              </Link>

              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  <span>
                    {questions.length} {tAssessment('questions')}
                  </span>
                </div>
                {assessment.timeLimitInMinutes && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{assessment.timeLimitInMinutes} min</span>
                  </div>
                )}
                {assessment.passingScore && (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>
                      {assessment.passingScore}% {tAssessment('passingScore')}
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
                <p className="text-gray-300">{assessment.description}</p>
              )}
            </div>
          </div>

          {/* Quiz Component */}
          <QuizPage
            assessment={assessment}
            questions={questions}
            locale={locale}
            backUrl={backUrl}
          />
        </div>
        
        {/* Support Floating Button with Assessment Context */}
        <SupportFloatingButton 
          context={{
            type: "ASSESSMENT",
            id: assessment.id,
            title: `${assessment.title} (QUIZ)`
          }}
        />
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
                href={backUrl}
                className="inline-flex items-center gap-2 text-white hover:text-secondary"
              >
                <ArrowLeft size={20} /> {tLesson('back')}
              </Link>

              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  <span>
                    {questions.length} {tAssessment('questions')}
                  </span>
                </div>
                {assessment.timeLimitInMinutes && (
                  <div className="flex items-center gap-2 text-orange-400">
                    <Clock size={16} />
                    <span>{assessment.timeLimitInMinutes} min</span>
                  </div>
                )}
                {assessment.passingScore && (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>
                      {assessment.passingScore}% {tAssessment('passingScore')}
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
                <p className="text-gray-300">{assessment.description}</p>
              )}
            </div>
          </div>

          {/* Simulado Component */}
          <SimuladoPage
            assessment={assessment}
            questions={questions}
            locale={locale}
            backUrl={backUrl}
          />
        </div>
        
        {/* Support Floating Button with Assessment Context */}
        <SupportFloatingButton 
          context={{
            type: "ASSESSMENT",
            id: assessment.id,
            title: `${assessment.title} (SIMULADO)`
          }}
        />
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
                href={backUrl}
                className="inline-flex items-center gap-2 text-white hover:text-secondary"
              >
                <ArrowLeft size={20} /> {tLesson('back')}
              </Link>

              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} />
                  <span>
                    {questions.length} {tAssessment('questions')}
                  </span>
                </div>
                {assessment.passingScore && (
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    <span>
                      {assessment.passingScore}% {tAssessment('passingScore')}
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
                <p className="text-gray-300">{assessment.description}</p>
              )}
            </div>
          </div>

          {/* Prova Aberta Component */}
          <ProvaAbertaPage
            assessment={assessment}
            questions={questions}
            locale={locale}
            backUrl={backUrl}
          />
        </div>

        {/* Support Floating Button with Assessment Context */}
        <SupportFloatingButton
          context={{
            type: "ASSESSMENT",
            id: assessment.id,
            title: `${assessment.title} (PROVA ABERTA)`
          }}
        />
      </NavSidebar>
    );
  }

  if (assessment.type === 'ORAL_EXAM') {
    return (
      <NavSidebar>
        <OralExamPage
          assessment={assessment}
          questions={questions}
          backUrl={backUrl}
        />

        {/* Support Floating Button with Assessment Context */}
        <SupportFloatingButton
          context={{
            type: "ASSESSMENT",
            id: assessment.id,
            title: `${assessment.title} (ORAL EXAM)`
          }}
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
            href={backUrl}
            className="inline-flex items-center gap-2 text-white hover:text-secondary"
          >
            <ArrowLeft size={20} /> {tLesson('back')}
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <AlertCircle size={48} className="text-yellow-400 mx-auto" />
            <h1 className="text-2xl font-bold text-white">
              {assessment.title}
            </h1>
            <p className="text-gray-400 max-w-md">
              Assessment type not supported
            </p>
          </div>
        </div>
      </div>
      
      {/* Support Floating Button with Assessment Context (Fallback) */}
      <SupportFloatingButton 
        context={{
          type: "ASSESSMENT",
          id: assessment.id,
          title: assessment.title
        }}
      />
    </NavSidebar>
  );
}