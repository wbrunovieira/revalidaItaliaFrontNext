import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { isTokenExpired } from '@/lib/auth-utils';
import TermsOfUse from '@/components/TermsOfUse';

export const metadata = {
  title: 'Termos de Uso | Revalida Italia',
  description: 'Termos de Uso e Condições da Plataforma Programa Revalida Itália',
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Terms',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token || isTokenExpired(token)) {
    redirect(`/${locale}/login`);
  }

  return <TermsOfUse locale={locale} />;
}