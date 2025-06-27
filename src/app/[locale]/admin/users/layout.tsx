// src/app/[locale]/admin/layout.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NavSidebar from '@/components/NavSidebar';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  // Verificar autenticação
  if (!token) {
    redirect(`/${locale}/login`);
  }

  // TODO: Verificar se o usuário é admin
  // const userRole = await getUserRole(token);
  // if (userRole !== 'admin') {
  //   redirect(`/${locale}`);
  // }

  return (
    <NavSidebar>
      <div className="flex-1 bg-primary min-h-screen">
        {children}
      </div>
    </NavSidebar>
  );
}
