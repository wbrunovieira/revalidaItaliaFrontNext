// src/app/[locale]/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import LanguageButton from '@/components/LanguageButton';
import LogoutButton from '@/components/LogoutButton';
import Nav from '@/components/Nav';

export function generateStaticParams(): {
  locale: string;
}[] {
  return ['pt', 'it', 'es'].map(locale => ({ locale }));
}

export default async function IndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  return (
    <div
      className="
        h-screen flex-1 bg-primary flex flex-col justify-between
        border-t-16 border-[var(--color-secondary)] lg:border-t-0
        rounded-t-3xl lg:rounded-none
        lg:border-l-4 lg:border-secondary px-8 py-4
      "
    >
      <Nav />
      <div className="absolute top-0 right-0 p-6 z-20">
        <LanguageButton />
        <LogoutButton />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            {t('title')}
          </h1>
          <hr className="mt-4 border-t-2 border-[var(--color-secondary)] w-48 lg:w-96 mx-auto" />
          {/* Conteúdo da área do aluno virá aqui */}
        </div>
      </div>
      <footer className="p-6 lg:pb-32 flex justify-center">
        <p className="text-white text-sm">
          © {new Date().getFullYear()} WB Digital Solutions
        </p>
      </footer>
    </div>
  );
}
