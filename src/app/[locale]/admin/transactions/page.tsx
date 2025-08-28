'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Users, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TransactionsList from '@/components/TransactionsList';
import ManageUserAccesses from '@/components/ManageUserAccesses';

export default function TransactionsPage() {
  const t = useTranslations('Admin.transactions');
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'pt';
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');

  // Check if user is admin
  useEffect(() => {
    // Wait for auth to be loaded
    if (!isAuthenticated) {
      setIsCheckingAuth(true);
      return;
    }

    setIsCheckingAuth(false);

    if (!user || user.role !== 'admin') {
      console.log('User role check failed:', { user, role: user?.role });
      toast({
        title: t('errors.unauthorized'),
        description: t('errors.adminOnly'),
        variant: 'destructive',
      });
      router.push(`/${locale}`);
    }
  }, [user, router, t, toast, isAuthenticated, locale]);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-secondary mx-auto mb-4" size={48} />
          <p className="text-gray-400">Verificando autorização...</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-darker p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark/50 to-secondary/10 p-6 rounded-xl border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <DollarSign className="text-secondary" size={32} />
                {t('title')}
              </h1>
              <p className="text-gray-400 mt-2">{t('description')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md bg-gray-800 p-1">
            <TabsTrigger 
              value="transactions" 
              className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark flex items-center gap-2"
            >
              <DollarSign size={16} />
              {t('tabs.transactions')}
            </TabsTrigger>
            <TabsTrigger 
              value="manage-accesses" 
              className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark flex items-center gap-2"
            >
              <Users size={16} />
              {t('tabs.manageAccesses')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionsList />
          </TabsContent>

          <TabsContent value="manage-accesses" className="space-y-6">
            <ManageUserAccesses />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}