export const dynamic = 'force-dynamic';

// src/app/[locale]/courses/[slug]/modules/[moduleSlug]/lessons/[lessonId]/page.tsx

import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import NavSidebar from '@/components/NavSidebar';
import { SupportFloatingButton } from '@/components/SupportFloatingButton';
import LessonPageContent from '@/components/LessonPageContent';

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

interface LiveSessionRecording {
  sessionTitle: string;
  sessionDate: string;
  recordingLesson: {
    id: string;
    slug: string;
    title: string;
    hasVideo: boolean;
    moduleId: string;
    courseId: string;
  };
}

interface AudioTranslation {
  locale: string;
  title: string;
  description?: string;
}

interface Audio {
  id: string;
  lessonId?: string;
  filename: string;
  url: string;
  durationInSeconds: number;
  formattedDuration?: string;
  fileSize: number;
  mimeType: string;
  order: number;
  transcription?: string;
  translations: AudioTranslation[];
}

interface Animation {
  id: string;
  lessonId?: string;
  type: 'CompleteSentence' | 'MultipleChoice';
  order: number;
  totalQuestions?: number;
  enabled: boolean;
}

interface Environment3DTranslation {
  locale: string;
  name?: string;
  description?: string;
}

interface Environment3D {
  id: string;
  slug: string;
  translations: Environment3DTranslation[];
}

interface Lesson {
  id: string;
  moduleId: string;
  imageUrl?: string;
  video?: Video;
  translations: Translation[];
  flashcardIds?: string[];
  liveSessionRecordings?: LiveSessionRecording[];
  createdAt: string;
  updatedAt: string;
  // Interactive Lessons fields
  type?: 'STANDARD' | 'ENVIRONMENT_3D';
  audios?: Audio[];
  animations?: Animation[];
  environment3dId?: string;
  environment3d?: Environment3D;
}

interface LessonsResponse {
  lessons: Lesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
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
  protectionLevel?: 'NONE' | 'WATERMARK' | 'FULL';
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

  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  const courses: Course[] = await fetch(
    `${API_URL}/api/v1/courses`,
    {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  ).then(r => (r.ok ? r.json() : Promise.reject()));
  const course =
    courses.find(c => c.slug === slug) ?? notFound();

  const modules: ModuleData[] = await fetch(
    `${API_URL}/api/v1/courses/${course.id}/modules`,
    {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
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
      `${API_URL}/api/v1/courses/${course.id}/modules/${moduleFound.id}/lessons?page=1&limit=10`,
      { cache: 'no-store' }
    ).then(r => (r.ok ? r.json() : Promise.reject())),
    fetch(
      `${API_URL}/api/v1/assessments?lessonId=${lessonId}`,
      { cache: 'no-store' }
    ).then(r =>
      r.ok ? r.json() : { assessments: [], pagination: {} }
    ),
    fetch(
      `${API_URL}/api/v1/lessons/${lessonId}/documents?page=1&limit=100`,
      { cache: 'no-store' }
    ).then(r => {
      if (!r.ok) return [];
      const data = r.json();
      // API agora retorna { documents: [], pagination: {} }
      // Extrair apenas o array de documentos
      return data.then(d => (d.documents && Array.isArray(d.documents) ? d.documents : (Array.isArray(d) ? d : [])));
    }),
  ]);

  // Buscar flashcards se a lesson tiver flashcardIds
  let flashcards: Flashcard[] = [];

  if (lesson.flashcardIds && lesson.flashcardIds.length > 0) {
    try {
      flashcards = await Promise.all(
        lesson.flashcardIds.map(async (id) => {
          const response = await fetch(`${API_URL}/api/v1/flashcards/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
          });
          if (response.ok) {
            const data = await response.json();
            // API retorna { success: true, flashcard: {...} }
            return data.flashcard || data;
          }
          return null;
        })
      );
      // Filtrar nulls caso algum flashcard não seja encontrado
      flashcards = flashcards.filter(f => f !== null);
    } catch (error) {
      console.error('[Flashcards] Error fetching flashcards:', error);
    }
  }

  return (
    <NavSidebar>
      <LessonPageContent
        locale={locale}
        courseSlug={slug}
        moduleSlug={moduleSlug}
        lessonId={lessonId}
        initialCourse={course}
        initialModule={moduleFound}
        initialLesson={lesson}
        initialLessons={allLessons}
        initialAssessments={assessmentsData}
        initialDocuments={documentsData}
        initialFlashcards={flashcards}
        pandaData={pandaData}
      />

      {/* Support Floating Button with Lesson Context */}
      <SupportFloatingButton
        context={{
          type: "LESSON",
          id: lesson.id,
          title: lesson.translations.find(t => t.locale === locale)?.title || lesson.translations[0].title
        }}
      />
    </NavSidebar>
  );
}
