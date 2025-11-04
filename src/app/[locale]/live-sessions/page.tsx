import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import { ModernDivider } from '@/components/ui/modern-divider';
import { isTokenExpired } from '@/lib/auth-utils';
import LiveSessions from '@/components/LiveSessions';
import { ArrowLeft, Video, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  slug: string;
}

export const metadata = {
  title: 'Sessões ao Vivo | Revalida Italia',
  description: 'Participe de aulas ao vivo com nossos tutores especializados',
};

async function getCourses() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const response = await fetch(`${apiUrl}/api/v1/courses`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

async function getAllModules(courses: Course[]) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    // Fetch modules for each course
    const modulesPromises = courses.map(async (course) => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/courses/${course.id}/modules`, {
          cache: 'no-store',
        });
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    });

    const modulesArrays = await Promise.all(modulesPromises);
    // Flatten the array of arrays into a single array
    return modulesArrays.flat();
  } catch (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
}

export default async function LiveSessionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'LiveSessions',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token || isTokenExpired(token)) {
    redirect(`/${locale}/login`);
  }

  // Fetch courses and modules for URL mapping
  const courses = await getCourses();
  const modules = await getAllModules(courses);

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-gradient-to-br from-primary via-primary to-primary/95 min-h-screen relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
        </div>

        {/* Conteúdo */}
        <div className="relative z-10">
          {/* Header com navegação */}
          <div className="bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm border-b border-white/10">
            <div className="px-6 py-4">
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Voltar</span>
              </Link>
            </div>
          </div>

          {/* Hero Section */}
          <div className="px-6 py-12 relative">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-6 mb-8">
                {/* Ícone */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 p-0.5">
                    <div className="w-full h-full rounded-2xl bg-primary flex items-center justify-center">
                      <Video size={40} className="text-secondary" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary/60 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                    </span>
                  </div>
                </div>

                {/* Título e descrição */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-secondary text-sm font-medium flex items-center gap-1">
                      <Sparkles size={14} />
                      Zoom Integration
                    </span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white">
                    {t('title')}
                  </h1>
                  <p className="text-white/60 mt-1">{t('description')}</p>
                </div>
              </div>

              {/* Linha divisória decorativa */}
              <ModernDivider variant="start" glowColor="secondary" />
            </div>
          </div>

          {/* Conteúdo Principal com padding e max-width */}
          <div className="px-6 pb-12">
            <div className="max-w-7xl mx-auto">
              <LiveSessions locale={locale} courses={courses} modules={modules} />
            </div>
          </div>
        </div>

        {/* Pattern de fundo sutil */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyMHYySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
      </div>
    </NavSidebar>
  );
}