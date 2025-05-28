// src/app/[locale]/page.tsx

import Nav from '@/components/Nav';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// 1) Diga ao Next.js quais locales gerar em build time
export function generateStaticParams(): {
  locale: string;
}[] {
  return ['pt', 'it', 'es'].map(locale => ({ locale }));
}

// 2) Mantenha como Server Component,
//    `params` aqui É um Promise<{locale:string}> no seu setup,
//    e `cookies()` também retorna um Promise<ReadonlyRequestCookies>.
export default async function IndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // ⏳ aguarde o params chegar
  const { locale } = await params;

  // ⏳ aguarde a leitura dos cookies do request
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    // 🔒 redireciona NO SERVIDOR se não houver JWT
    redirect(`/${locale}/login`);
  }

  return (
    <div className="container mx-auto w-full min-h-screen">
      <Nav />
      {/* …o resto da home protegida */}
    </div>
  );
}
