import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminHeader from '@/components/AdminHeader';
import { getUserRole } from '@/lib/auth-server';

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({
  children,
  params
}: AdminLayoutProps) {
  const { locale } = await params;

  // Verificar autenticação
  const token = (await cookies()).get('token')?.value;
  if (!token) {
    redirect(`/${locale}/login`);
  }

  // Verificar se é admin ou tutor
  const role = await getUserRole();
  if (role !== 'admin' && role !== 'tutor') {
    // Estudantes não podem acessar a área admin
    redirect(`/${locale}/courses`);
  }

  return (
    <div className="bg-primary min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-secondary/5 pointer-events-none"></div>

      <div className="relative z-10 p-6">
        <AdminHeader />
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}