'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

import {
  Users,
  BookOpen,
  FileText,
  UserPlus,
  List,
  BarChart3,
  Globe,
  Route,
  Package,
  Play,
  Video,
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
import AdminHeader from '@/components/AdminHeader';
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

export default function AdminPage() {
  const t = useTranslations('Admin');
  const [activeTab, setActiveTab] = useState('overview');

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
              <TabsContent value="create"></TabsContent>
            </Tabs>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
