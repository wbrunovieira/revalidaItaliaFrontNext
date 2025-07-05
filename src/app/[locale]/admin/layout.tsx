import { ReactNode } from 'react';
import AdminHeader from '@/components/AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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