// /src/app/[locale]/admin/student-documents/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, FileText, MessageSquare, UserCheck } from 'lucide-react';
import { useAuth } from '@/stores/auth.store';
import StudentDocumentsList from '@/components/StudentDocumentsList';
import DocumentConversations from '@/components/DocumentConversations';
import CreatePersonalSessionModal from '@/components/CreatePersonalSessionModal';
import MyHostedSessionsList from '@/components/MyHostedSessionsList';
import MyCreatedRecordingsList from '@/components/MyCreatedRecordingsList';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentDocumentsPage() {
  const t = useTranslations('Admin.studentDocuments');
  const tAdmin = useTranslations('Admin');
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'pt';
  const { isAdmin, isDocumentAnalyst, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');
  const [showCreatePersonalSessionModal, setShowCreatePersonalSessionModal] = useState(false);

  // Redirect if not authorized
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin && !isDocumentAnalyst) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, isAdmin, isDocumentAnalyst, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  // Don't render if not authorized
  if (!isAdmin && !isDocumentAnalyst) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            {t('backToAdmin')}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('pageTitle')}</h1>
          <p className="text-gray-400 mt-2">{t('pageDescription')}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-xl bg-gray-800 p-1">
            <TabsTrigger
              value="documents"
              className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark flex items-center gap-2"
            >
              <FileText size={16} />
              {t('tabs.documents')}
            </TabsTrigger>
            <TabsTrigger
              value="conversations"
              className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark flex items-center gap-2"
            >
              <MessageSquare size={16} />
              {t('tabs.conversations')}
            </TabsTrigger>
            <TabsTrigger
              value="personalSessions"
              className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark flex items-center gap-2"
            >
              <UserCheck size={16} />
              {t('tabs.personalSessions')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-xl">
              <StudentDocumentsList />
            </div>
          </TabsContent>

          <TabsContent value="conversations" className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 shadow-xl">
              <DocumentConversations locale={locale} />
            </div>
          </TabsContent>

          <TabsContent value="personalSessions" className="space-y-6">
            <div className="bg-gradient-to-br from-secondary/20 to-gray-800/50 rounded-xl p-6 shadow-xl border border-secondary/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <UserCheck size={32} className="text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{tAdmin('personalSessions.title')}</h2>
                  <p className="text-gray-400">{tAdmin('personalSessions.description')}</p>
                </div>
              </div>

              {/* Sub-tabs for Personal Sessions */}
              <Tabs defaultValue="mySessions" className="w-full">
                <TabsList className="grid w-full max-w-xl grid-cols-3 bg-gray-800 p-1 mb-6">
                  <TabsTrigger
                    value="create"
                    className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark"
                  >
                    {tAdmin('personalSessions.tabs.create')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="mySessions"
                    className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark"
                  >
                    {tAdmin('personalSessions.tabs.mySessions')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="myRecordings"
                    className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark"
                  >
                    {tAdmin('personalSessions.tabs.myRecordings')}
                  </TabsTrigger>
                </TabsList>

                {/* Create Session Sub-tab */}
                <TabsContent value="create">
                  <div className="bg-gray-800/70 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-medium text-white mb-2">{tAdmin('personalSessions.createTitle')}</h3>
                    <p className="text-gray-400 mb-4">{tAdmin('personalSessions.createDescription')}</p>
                    <button
                      onClick={() => setShowCreatePersonalSessionModal(true)}
                      className="bg-secondary hover:bg-secondary/80 text-primary-dark px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <UserCheck size={20} />
                      {tAdmin('personalSessions.createButton')}
                    </button>
                  </div>
                </TabsContent>

                {/* My Sessions Sub-tab */}
                <TabsContent value="mySessions">
                  <MyHostedSessionsList />
                </TabsContent>

                {/* My Recordings Sub-tab */}
                <TabsContent value="myRecordings">
                  <MyCreatedRecordingsList />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Personal Session Modal */}
        <CreatePersonalSessionModal
          open={showCreatePersonalSessionModal}
          onClose={() => setShowCreatePersonalSessionModal(false)}
        />
      </div>
    </div>
  );
}
