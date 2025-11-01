import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

interface PageProps {
  params: Promise<{
    locale: string;
    lessonId: string;
  }>;
}

async function getLessonInfo(lessonId: string, token: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${apiUrl}/api/v1/lessons/${lessonId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch lesson info');
    }

    const lesson = await response.json();

    return {
      courseSlug: lesson.module?.course?.slug,
      moduleSlug: lesson.module?.slug,
      lessonId: lesson.id,
    };
  } catch (error) {
    console.error('Error fetching lesson info:', error);
    return null;
  }
}

export default async function LessonRedirectPage({ params }: PageProps) {
  const { locale, lessonId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const lessonInfo = await getLessonInfo(lessonId, token);

  if (!lessonInfo || !lessonInfo.courseSlug || !lessonInfo.moduleSlug) {
    redirect(`/${locale}/courses`);
  }

  // Redirect to the correct URL with slugs
  redirect(`/${locale}/courses/${lessonInfo.courseSlug}/modules/${lessonInfo.moduleSlug}/lessons/${lessonInfo.lessonId}`);
}
