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
  PlayCircle,
  Upload,
  FolderSearch,
  UserCheck,
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
import FlashcardBulkImportModal from '@/components/FlashcardBulkImportModal';
import CreateLiveSessionModal from '@/components/CreateLiveSessionModal';
import CreatePersonalSessionModal from '@/components/CreatePersonalSessionModal';
import UploadPersonalRecordingModal from '@/components/UploadPersonalRecordingModal';
import PersonalSessionsList from '@/components/PersonalSessionsList';
import PersonalRecordingsAdminList from '@/components/PersonalRecordingsAdminList';
import MyHostedSessionsList from '@/components/MyHostedSessionsList';
import LiveSessionsList from '@/components/LiveSessionsList';
import RecordingsList from '@/components/RecordingsList';

export default function AdminPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const locale = params?.locale || 'pt';
  const { isAdmin, isTutor, isDocumentAnalyst } = useAuth();

  // Define a aba inicial baseada no role
  // Admin: overview, Tutor: courses, Outros: courses
  const getInitialTab = () => {
    if (isAdmin) return 'overview';
    if (isTutor) return 'courses';
    return 'courses';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
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
  const [
    showCreatePersonalSessionModal,
    setShowCreatePersonalSessionModal,
  ] = useState(false);
  const [
    showFlashcardBulkImportModal,
    setShowFlashcardBulkImportModal,
  ] = useState(false);
  const [
    showUploadRecordingModal,
    setShowUploadRecordingModal,
  ] = useState(false);

  // Garante que não-admins não fiquem nas abas restritas
  useEffect(() => {
    if (!isAdmin && (activeTab === 'overview' || activeTab === 'transactions' || activeTab === 'users')) {
      setActiveTab('courses');
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

            {/* Apenas mostra a aba users para admins */}
            {isAdmin && (
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
            )}

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

            <TabsTrigger
              value="personalSessions"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <UserCheck
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.personalSessions')}
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

            {/* Apenas mostra a aba studentDocuments para admins e document analysts */}
            {(isAdmin || isDocumentAnalyst) && (
              <TabsTrigger
                value="studentDocuments"
                className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                <FolderSearch
                  className="-ms-0.5 me-2 opacity-60"
                  size={18}
                  aria-hidden="true"
                />
                {t('tabs.studentDocuments')}
              </TabsTrigger>
            )}
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

          {/* Apenas renderiza o conteúdo de users para admins */}
          {isAdmin && (
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
          )}

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
                {/* Bulk Import Button */}
                <div className="flex justify-center mb-8 mt-6">
                  <div className="text-center border border-gray-700/50 rounded-xl p-6 bg-gray-800/30 backdrop-blur-sm hover:border-secondary/30 transition-colors">
                    <button
                      onClick={() => setShowFlashcardBulkImportModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-secondary/80 text-primary font-medium rounded-lg hover:from-secondary/90 hover:to-secondary/70 transition-all shadow-lg hover:shadow-xl"
                    >
                      <Upload size={20} />
                      {t('flashcards.bulkImport.buttonTitle')}
                    </button>
                    <p className="text-gray-400 text-sm mt-3">
                      {t('flashcards.bulkImport.buttonDescription')}
                    </p>
                  </div>
                </div>

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
              <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-gray-700">
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
                <TabsTrigger
                  value="recordings"
                  className="data-[state=active]:bg-secondary data-[state=active]:text-primary"
                >
                  <PlayCircle className="mr-2" size={16} />
                  {t('liveSessions.recordings')}
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
              <TabsContent value="recordings">
                <RecordingsList locale={locale as string} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Personal Sessions Tab */}
          <TabsContent value="personalSessions">
            <div className="p-6 space-y-6">
              <div className="text-center space-y-3 mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {t('personalSessions.title')}
                </h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  {t('personalSessions.description')}
                </p>
              </div>

              {/* Sub-tabs for Personal Sessions */}
              <Tabs defaultValue="mySessions" className="w-full">
                <TabsList className={`grid w-full max-w-2xl mx-auto ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'} bg-gray-800 p-1`}>
                  <TabsTrigger
                    value="create"
                    className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark"
                  >
                    {t('personalSessions.tabs.create')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="mySessions"
                    className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark"
                  >
                    {t('personalSessions.tabs.mySessions')}
                  </TabsTrigger>
                  {isAdmin && (
                    <TabsTrigger
                      value="list"
                      className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark"
                    >
                      {t('personalSessions.tabs.list')}
                    </TabsTrigger>
                  )}
                  {isAdmin && (
                    <TabsTrigger
                      value="recordings"
                      className="data-[state=active]:bg-secondary data-[state=active]:text-primary-dark"
                    >
                      {t('personalSessions.tabs.recordings')}
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Create Session Sub-tab */}
                <TabsContent value="create" className="mt-6">
                  <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Zoom Session Card */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-200">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-blue-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Video size={24} className="text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-white">
                              {t('personalSessions.zoomSession.title')}
                            </h4>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">
                              Zoom
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-4">
                            {t('personalSessions.zoomSession.description')}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowCreatePersonalSessionModal(true)}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <Video size={18} />
                          {t('personalSessions.zoomSession.button')}
                        </button>
                      </div>
                    </div>

                    {/* Manual Upload Card */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-200">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-purple-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <Upload size={24} className="text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-white">
                              {t('personalSessions.manualUpload.title')}
                            </h4>
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">
                              Upload
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-4">
                            {t('personalSessions.manualUpload.description')}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowUploadRecordingModal(true)}
                          className="w-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <Upload size={18} />
                          {t('personalSessions.manualUpload.button')}
                        </button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* My Sessions Sub-tab */}
                <TabsContent value="mySessions" className="mt-6">
                  <MyHostedSessionsList />
                </TabsContent>

                {/* List All Sessions Sub-tab (Admin only) */}
                {isAdmin && (
                  <TabsContent value="list" className="mt-6">
                    <PersonalSessionsList />
                  </TabsContent>
                )}

                {/* All Recordings Sub-tab (Admin only) */}
                {isAdmin && (
                  <TabsContent value="recordings" className="mt-6">
                    <PersonalRecordingsAdminList />
                  </TabsContent>
                )}
              </Tabs>
            </div>
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

          {/* Apenas renderiza o conteúdo de studentDocuments para admins e document analysts */}
          {(isAdmin || isDocumentAnalyst) && (
            <TabsContent value="studentDocuments">
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <FolderSearch className="mx-auto mb-4 text-secondary" size={48} />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {t('studentDocuments.pageTitle')}
                  </h2>
                  <p className="text-gray-400 mb-6">
                    {t('studentDocuments.pageDescription')}
                  </p>
                  <a
                    href={`/${locale}/admin/student-documents`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-primary-dark font-semibold rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    <FolderSearch size={20} />
                    {t('studentDocuments.accessButton')}
                  </a>
                </div>
              </div>
            </TabsContent>
          )}
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

      {/* Personal Session Creation Modal */}
      <CreatePersonalSessionModal
        open={showCreatePersonalSessionModal}
        onClose={() => setShowCreatePersonalSessionModal(false)}
        onSuccess={() => {
          console.log('Personal session created successfully');
        }}
      />

      {/* Upload Personal Recording Modal */}
      <UploadPersonalRecordingModal
        open={showUploadRecordingModal}
        onClose={() => setShowUploadRecordingModal(false)}
        onSuccess={() => {
          console.log('Recording uploaded successfully');
        }}
      />

      {/* Flashcard Bulk Import Modal */}
      <FlashcardBulkImportModal
        open={showFlashcardBulkImportModal}
        onOpenChange={setShowFlashcardBulkImportModal}
        onSuccess={() => {
          console.log('Flashcards imported successfully');
          // Could refresh flashcards list here if needed
        }}
      />
    </div>
  );
}
