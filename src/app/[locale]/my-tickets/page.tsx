import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import { ModernDivider } from '@/components/ui/modern-divider';
import { isTokenExpired } from '@/lib/auth-utils';
import StudentTickets from '@/components/StudentTickets';
import { ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Meus Tickets | Revalida Italia',
  description: 'Acompanhe suas dúvidas e tickets de suporte',
};

export default async function MyTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'MyTickets',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token || isTokenExpired(token)) {
    redirect(`/${locale}/login`);
  }

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
                <span className="text-sm font-medium">{t('back') || 'Voltar'}</span>
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
                      <MessageSquare size={40} className="text-secondary" />
                    </div>
                  </div>
                </div>

                {/* Título e descrição */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-secondary text-sm font-medium flex items-center gap-1">
                      <Sparkles size={14} />
                      {t('support') || 'Suporte'}
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
              <StudentTickets locale={locale} />
            </div>
          </div>
        </div>

        {/* Pattern de fundo sutil */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyMHYySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
      </div>
    </NavSidebar>
  );
}