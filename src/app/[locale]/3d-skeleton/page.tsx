export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavSidebar from '@/components/NavSidebar';
import Lesson3DPageContent from './Lesson3DPageContent';

export default async function Skeleton3DPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const token = (await cookies()).get('token')?.value;
  if (!token) redirect(`/${locale}/login`);

  // Simulated lesson data for 3D skeleton environment
  const mockLesson = {
    id: 'mock-3d-skeleton-001',
    slug: 'skeleton-anatomy-3d',
    moduleId: 'mock-module-skeleton-001',
    order: 1,
    type: 'ENVIRONMENT_3D' as const,
    environment3dSlug: 'skeleton',
    translations: [
      { locale: 'pt', title: 'Sistema Esquelético 3D', description: 'Explore o sistema esquelético humano em 3D interativo' },
      { locale: 'it', title: 'Sistema Scheletrico 3D', description: 'Esplora il sistema scheletrico umano in 3D interattivo' },
      { locale: 'es', title: 'Sistema Esquelético 3D', description: 'Explora el sistema esquelético humano en 3D interactivo' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCourse = {
    id: 'mock-course-skeleton-001',
    slug: 'anatomy-skeleton-course',
    imageUrl: '',
    translations: [
      { locale: 'pt', title: 'Curso de Osteologia', description: 'Curso completo sobre o sistema esquelético' },
      { locale: 'it', title: 'Corso di Osteologia', description: 'Corso completo sul sistema scheletrico' },
      { locale: 'es', title: 'Curso de Osteología', description: 'Curso completo sobre el sistema esquelético' },
    ],
  };

  const mockModule = {
    id: 'mock-module-skeleton-001',
    slug: 'bone-structure',
    imageUrl: null,
    order: 1,
    translations: [
      { locale: 'pt', title: 'Estrutura Óssea', description: 'Módulo sobre estrutura óssea' },
      { locale: 'it', title: 'Struttura Ossea', description: 'Modulo sulla struttura ossea' },
      { locale: 'es', title: 'Estructura Ósea', description: 'Módulo sobre estructura ósea' },
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
