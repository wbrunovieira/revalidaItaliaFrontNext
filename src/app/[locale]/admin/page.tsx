//src/app/[locale]/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth.store';

import {
  Users,
  BookOpen,
  FileText,
  UserPlus,
  List,
  BarChart3,
  Route,
  Package,
  Play,
  Video,
  ClipboardList,
  Layers,
  HelpCircle,
  Radio,
  DollarSign,
  GraduationCap,
} from 'lucide-react';

import {
  ScrollArea,
  ScrollBar,
} from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import DashboardStats from '@/components/DashboardStats';
import CreateUserForm from '@/components/CreateUserForm';
import UsersList from '@/components/UsersList';
import CreateCourseForm from '@/components/CreateCourseForm';
import CoursesList from '@/components/CoursesList';
import CreateTrackForm from '@/components/CreateTrackForm';
import TracksList from '@/components/TracksList';
import CreateModuleForm from '@/components/CreateModuleForm';
import ModulesList from '@/components/ModulesList';
import CreateLessonForm from '@/components/CreateLessonForm';
import LessonsList from '@/components/LessonsList';
import CreateVideoForm from '@/components/CreateVideoForm';
import VideosList from '@/components/VideosList';
import CreateDocumentForm from '@/components/CreateDocumentForm';
import DocumentsList from '@/components/DocumentsList';
import CreateAssessmentForm from '@/components/CreateAssessmentForm';
import CreateArgumentForm from '@/components/CreateArgumentForm';
import CreateQuestionForm from '@/components/CreateQuestionForm';
import AssessmentsList from '@/components/AssessmentsList';
import ArgumentsList from '@/components/ArgumentsList';
import CreateArgumentPage from '@/components/CreateArgumentPage';
import QuestionsList from '@/components/QuestionsList';
import CreateFlashcardForm from '@/components/CreateFlashcardForm';
import CreateFlashcardTagForm from '@/components/CreateFlashcardTagForm';
import FlashcardsList from '@/components/FlashcardsList';
import FlashcardTagsList from '@/components/FlashcardTagsList';
import CreateLiveSessionModal from '@/components/CreateLiveSessionModal';
import LiveSessionsList from '@/components/LiveSessionsList';

export default function AdminPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const locale = params?.locale || 'pt';
  const { isAdmin } = useAuth();

  // Se não for admin, inicia com a aba 'users' ao invés de 'overview'
  const [activeTab, setActiveTab] = useState(isAdmin ? 'overview' : 'users');
  const [
    showCreateAssessmentModal,
    setShowCreateAssessmentModal,
  ] = useState(false);
  const [
    showCreateArgumentModal,
    setShowCreateArgumentModal,
  ] = useState(false);
  const [
    showCreateQuestionModal,
    setShowCreateQuestionModal,
  ] = useState(false);
  const [
    showCreateLiveSessionModal,
    setShowCreateLiveSessionModal,
  ] = useState(false);

  // Garante que não-admins não fiquem nas abas restritas
  useEffect(() => {
    if (!isAdmin && (activeTab === 'overview' || activeTab === 'transactions')) {
      setActiveTab('users');
    }
  }, [isAdmin, activeTab]);

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <ScrollArea className="w-full">
          <TabsList className="relative mb-6 h-auto w-full gap-1 bg-transparent p-0">
            {/* Apenas mostra a aba overview para admins */}
            {isAdmin && (
              <TabsTrigger
                value="overview"
                className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <BarChart3
                  className="-ms-0.5 me-2 opacity-60"
                  size={18}
                  aria-hidden="true"
                />
                {t('tabs.overview')}
              </TabsTrigger>
            )}

            <TabsTrigger
              value="users"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Users
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.users')}
            </TabsTrigger>

            <TabsTrigger
              value="courses"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <BookOpen
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.courses')}
            </TabsTrigger>

            <TabsTrigger
              value="tracks"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Route
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.tracks')}
            </TabsTrigger>

            <TabsTrigger
              value="modules"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Package
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.modules')}
            </TabsTrigger>

            <TabsTrigger
              value="lessons"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Play
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.lessons')}
            </TabsTrigger>

            <TabsTrigger
              value="videos"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Video
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.videos')}
            </TabsTrigger>

            <TabsTrigger
              value="documents"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <FileText
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.documents')}
            </TabsTrigger>

            <TabsTrigger
              value="assessments"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <ClipboardList
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.assessments')}
            </TabsTrigger>

            <TabsTrigger
              value="arguments"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <List
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.arguments')}
            </TabsTrigger>

            <TabsTrigger
              value="flashcards"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Layers
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.flashcards')}
            </TabsTrigger>

            <TabsTrigger
              value="liveSessions"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Radio
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.liveSessions')}
            </TabsTrigger>

            {/* Apenas mostra a aba transactions para admins */}
            {isAdmin && (
              <TabsTrigger
                value="transactions"
                className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <DollarSign
                  className="-ms-0.5 me-2 opacity-60"
                  size={18}
                  aria-hidden="true"
                />
                {t('tabs.transactions')}
              </TabsTrigger>
            )}

            <TabsTrigger
              value="tutor"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <GraduationCap
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.tutor')}
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="mt-6 rounded-lg bg-gray-800/50 p-6 shadow-xl">
          {/* Apenas renderiza o conteúdo do overview para admins */}
          {isAdmin && (
            <TabsContent value="overview">
              <DashboardStats />
            </TabsContent>
          )}

          <TabsContent value="users">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <UserPlus className="mr-2" size={16} />
                  {t('users.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('users.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <CreateUserForm />
              </TabsContent>
              <TabsContent value="list">
                <UsersList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="courses">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <BookOpen className="mr-2" size={16} />
                  {t('courses.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('courses.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <CreateCourseForm />
              </TabsContent>
              <TabsContent value="list">
                <CoursesList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="tracks">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <Route className="mr-2" size={16} />
                  {t('tracks.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('tracks.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <CreateTrackForm />
              </TabsContent>
              <TabsContent value="list">
                <TracksList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="modules">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <Package className="mr-2" size={16} />
                  {t('modules.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('modules.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <CreateModuleForm />
              </TabsContent>
              <TabsContent value="list">
                <ModulesList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="lessons">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <Play className="mr-2" size={16} />
                  {t('lessons.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('lessons.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <CreateLessonForm />
              </TabsContent>
              <TabsContent value="list">
                <LessonsList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="videos">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <Video className="mr-2" size={16} />
                  {t('videos.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('videos.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <CreateVideoForm />
              </TabsContent>
              <TabsContent value="list">
                <VideosList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="documents">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <FileText className="mr-2" size={16} />
                  {t('documents.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('documents.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <CreateDocumentForm />
              </TabsContent>
              <TabsContent value="list">
                <DocumentsList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="assessments">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <ClipboardList
                    className="mr-2"
                    size={16}
                  />
                  {t('assessments.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('assessments.list')}
                </TabsTrigger>
                <TabsTrigger
                  value="questions"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <HelpCircle className="mr-2" size={16} />
                  {t('assessments.questions')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <div className="p-6 space-y-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-xl font-semibold text-white">
                      {t('assessments.create')}
                    </h3>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      {t(
                        'createAssessment.startDescription'
                      )}
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                    {/* Create Assessment Button */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-secondary/50 transition-all duration-200">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-blue-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <ClipboardList
                            size={24}
                            className="text-blue-400"
                          />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {t(
                              'createAssessment.cardTitle'
                            )}
                          </h4>
                          <p className="text-gray-400 text-sm mb-4">
                            {t(
                              'createAssessment.cardDescription'
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setShowCreateAssessmentModal(
                              true
                            )
                          }
                          className="w-full bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-primary px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          {t(
                            'createAssessment.startButton'
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Create Question Button */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-secondary/50 transition-all duration-200">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-purple-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <HelpCircle
                            size={24}
                            className="text-purple-400"
                          />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {t('createQuestion.cardTitle')}
                          </h4>
                          <p className="text-gray-400 text-sm mb-4">
                            {t(
                              'createQuestion.cardDescription'
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setShowCreateQuestionModal(true)
                          }
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          {t('createQuestion.startButton')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="list">
                <AssessmentsList />
              </TabsContent>
              <TabsContent value="questions">
                <QuestionsList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="arguments">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List
                    className="mr-2"
                    size={16}
                  />
                  {t('arguments.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List
                    className="mr-2"
                    size={16}
                  />
                  {t('arguments.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <CreateArgumentPage />
              </TabsContent>
              <TabsContent value="list">
                <ArgumentsList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="flashcards">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <Layers className="mr-2" size={16} />
                  {t('flashcards.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('flashcards.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CreateFlashcardForm />
                  <CreateFlashcardTagForm />
                </div>
              </TabsContent>
              <TabsContent value="list">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Flashcards List - 2/3 */}
                  <div className="lg:col-span-2">
                    <FlashcardsList />
                  </div>
                  
                  {/* Tags List - 1/3 */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <FlashcardTagsList />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="liveSessions">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <Radio className="mr-2" size={16} />
                  {t('liveSessions.create')}
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <List className="mr-2" size={16} />
                  {t('liveSessions.list')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="create">
                <div className="p-6 space-y-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-xl font-semibold text-white">
                      {t('liveSessions.title')}
                    </h3>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      {t('liveSessions.description')}
                    </p>
                  </div>

                  <div className="max-w-md mx-auto">
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-secondary/50 transition-all duration-200">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-purple-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Radio size={24} className="text-purple-400" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {t('liveSessions.createTitle')}
                          </h4>
                          <p className="text-gray-400 text-sm mb-4">
                            {t('liveSessions.createDescription')}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowCreateLiveSessionModal(true)}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          {t('liveSessions.createButton')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="list">
                <LiveSessionsList />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Apenas renderiza o conteúdo de transactions para admins */}
          {isAdmin && (
            <TabsContent value="transactions">
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <DollarSign className="mx-auto mb-4 text-secondary" size={48} />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {t('transactions.title')}
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {t('transactions.description')}
                  </p>
                  <a
                    href={`/${locale}/admin/transactions`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-primary-dark font-semibold rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    <DollarSign size={20} />
                    {t('transactions.viewTransactions')}
                  </a>
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="tutor">
            <div className="p-6 space-y-6">
              <div className="text-center">
                <GraduationCap className="mx-auto mb-4 text-secondary" size={48} />
                <h2 className="text-2xl font-bold text-white mb-2">
                  {t('tutor.title')}
                </h2>
                <p className="text-gray-400 mb-6">
                  {t('tutor.description')}
                </p>
                <a
                  href={`/${locale}/tutor`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-primary-dark font-semibold rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <GraduationCap size={20} />
                  {t('tutor.accessTutor')}
                </a>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Assessment Creation Modal */}
      <CreateAssessmentForm
        isOpen={showCreateAssessmentModal}
        onClose={() => setShowCreateAssessmentModal(false)}
        onAssessmentCreated={() => {
          // Refresh assessment list if needed
          console.log('Assessment created');
        }}
      />

      {/* Argument Creation Modal */}
      <CreateArgumentForm
        isOpen={showCreateArgumentModal}
        onClose={() => setShowCreateArgumentModal(false)}
        onArgumentCreated={() => {
          // Refresh argument list if needed
          console.log('Argument created');
        }}
      />

      {/* Question Creation Modal */}
      <CreateQuestionForm
        isOpen={showCreateQuestionModal}
        onClose={() => setShowCreateQuestionModal(false)}
        onQuestionCreated={() => {
          // Refresh question list if needed
          console.log('Question created');
        }}
      />

      {/* Live Session Creation Modal */}
      <CreateLiveSessionModal
        open={showCreateLiveSessionModal}
        onOpenChange={setShowCreateLiveSessionModal}
        onSuccess={() => {
          console.log('Live session created successfully');
          // Could refresh a list of live sessions here if needed
        }}
      />
    </div>
  );
}
