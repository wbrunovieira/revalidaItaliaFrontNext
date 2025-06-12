// src/app/[locale]/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';

export function generateStaticParams(): {
  locale: string;
}[] {
  return ['pt', 'it', 'es'].map(locale => ({ locale }));
}

export default async function IndexPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;

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
    <NavSidebar>
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-secondary min-h-screen">
        <h1 className="text-3xl font-bold text-white">
          {t('title')}
        </h1>
        <hr className="mt-4 border-t-2 border-[var(--color-secondary)] w-48 lg:w-96 mx-auto" />
      </div>
    </NavSidebar>
  );
}
