//src/app/[locale]/admin/page.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

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

export default function AdminPage() {
  const t = useTranslations('Admin');
  const [activeTab, setActiveTab] = useState('overview');
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

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <ScrollArea className="w-full">
          <TabsList className="relative mb-6 h-auto w-full gap-1 bg-transparent p-0">
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
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="mt-6 rounded-lg bg-gray-800/50 p-6 shadow-xl">
          <TabsContent value="overview">
            <DashboardStats />
          </TabsContent>

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
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-700">
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

                  <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
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

                    {/* Create Argument Button */}
                    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-secondary/50 transition-all duration-200">
                      <div className="text-center space-y-4">
                        <div className="p-3 bg-green-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                          <List
                            size={24}
                            className="text-green-400"
                          />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {t('createArgument.cardTitle')}
                          </h4>
                          <p className="text-gray-400 text-sm mb-4">
                            {t(
                              'createArgument.cardDescription'
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setShowCreateArgumentModal(true)
                          }
                          className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          {t('createArgument.startButton')}
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
                <div className="p-4">
                  <p>{t('comingSoon')}</p>
                </div>
              </TabsContent>
              <TabsContent value="list">
                <div className="p-4">
                  <p>{t('comingSoon')}</p>
                </div>
              </TabsContent>
            </Tabs>
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
    </div>
  );
}
