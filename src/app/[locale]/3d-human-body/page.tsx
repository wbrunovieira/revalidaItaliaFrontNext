export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavSidebar from '@/components/NavSidebar';
import Lesson3DPageContent from './Lesson3DPageContent';

export default async function HumanBody3DPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  // Simulated lesson data for 3D environment
  const mockLesson = {
    id: 'mock-3d-lesson-001',
    slug: 'human-body-anatomy-3d',
    moduleId: 'mock-module-001',
    order: 1,
    type: 'ENVIRONMENT_3D' as const,
    environment3dSlug: 'human-body',
    translations: [
      { locale: 'pt', title: 'Anatomia do Corpo Humano 3D', description: 'Explore o corpo humano em 3D interativo' },
      { locale: 'it', title: 'Anatomia del Corpo Umano 3D', description: 'Esplora il corpo umano in 3D interattivo' },
      { locale: 'es', title: 'Anatomía del Cuerpo Humano 3D', description: 'Explora el cuerpo humano en 3D interactivo' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCourse = {
    id: 'mock-course-001',
    slug: 'anatomy-course',
    imageUrl: '',
    translations: [
      { locale: 'pt', title: 'Curso de Anatomia', description: 'Curso completo de anatomia humana' },
      { locale: 'it', title: 'Corso di Anatomia', description: 'Corso completo di anatomia umana' },
      { locale: 'es', title: 'Curso de Anatomía', description: 'Curso completo de anatomía humana' },
    ],
  };

  const mockModule = {
    id: 'mock-module-001',
    slug: 'body-systems',
    imageUrl: null,
    order: 1,
    translations: [
      { locale: 'pt', title: 'Sistemas do Corpo', description: 'Módulo sobre sistemas corporais' },
      { locale: 'it', title: 'Sistemi del Corpo', description: 'Modulo sui sistemi corporei' },
      { locale: 'es', title: 'Sistemas del Cuerpo', description: 'Módulo sobre sistemas corporales' },
    ],
  };

  return (
    <NavSidebar>
      <Lesson3DPageContent
        locale={locale}
        courseSlug={mockCourse.slug}
        moduleSlug={mockModule.slug}
        lesson={mockLesson}
        course={mockCourse}
        module={mockModule}
      />
    </NavSidebar>
  );
}
