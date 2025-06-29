'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  Users,
  BookOpen,
  Settings,
  UserPlus,
  List,
  BarChart3,
  Globe,
  Route,
  Package,
  Play,
  Video,
  User,
  Shield,
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
import LanguageButton from '@/components/LanguageButton';
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
import LogoutButton from '@/components/LogoutButton';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
}

export default function AdminPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const locale = params.locale as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(
    null
  );
  const [loadingUser, setLoadingUser] = useState(true);

  // Função para ler cookies no client-side
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
      return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Buscar informações do usuário logado
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const tokenFromCookie = getCookie('token');
        const tokenFromStorage =
          localStorage.getItem('accessToken') ||
          sessionStorage.getItem('accessToken');
        const token = tokenFromCookie || tokenFromStorage;

        if (!token) {
          setLoadingUser(false);
          return;
        }

        // Decodificar JWT para pegar o ID do usuário
        const base64Url = token.split('.')[1];
        const base64 = base64Url
          .replace(/-/g, '+')
          .replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(
              c =>
                '%' +
                ('00' + c.charCodeAt(0).toString(16)).slice(
                  -2
                )
            )
            .join('')
        );
        const payload = JSON.parse(jsonPayload);

        // Buscar dados completos do usuário na API
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/students/${payload.sub}`,
          { headers }
        );

        if (response.ok) {
          const userData = await response.json();
          setUserInfo(userData.user);
        }
      } catch (error) {
        console.error(
          'Erro ao buscar informações do usuário:',
          error
        );
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <div className="p-6 bg-primary min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-white">
            {t('title')}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Globe size={16} />
            </div>

            {/* Informações do usuário logado */}
            {!loadingUser && userInfo && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-primary">
                  {userInfo.role === 'admin' ? (
                    <Shield
                      size={16}
                      className="text-white"
                    />
                  ) : (
                    <User
                      size={16}
                      className="text-white"
                    />
                  )}
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">
                    {userInfo.name}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {userInfo.role === 'admin'
                      ? 'Administrador'
                      : 'Usuário'}
                  </p>
                </div>
              </div>
            )}

            {loadingUser && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="text-right">
                  <div className="w-20 h-4 bg-gray-700 rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            )}

            <div className="flex flex-col items-end gap-2">
              <LanguageButton />
              <LogoutButton />
            </div>
          </div>
        </div>
        <p className="text-gray-300">{t('description')}</p>
      </div>

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
              value="settings"
              className="relative overflow-hidden rounded-t-lg border border-gray-700 bg-gray-800 px-6 py-3 text-gray-300 hover:bg-gray-700 data-[state=active]:border-secondary data-[state=active]:bg-secondary/20 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Settings
                className="-ms-0.5 me-2 opacity-60"
                size={18}
                aria-hidden="true"
              />
              {t('tabs.settings')}
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

          {/* Conteúdo da tab de vídeos */}
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

          <TabsContent value="settings">
            <div className="text-center py-12">
              <Settings
                size={64}
                className="text-gray-500 mx-auto mb-4"
              />
              <p className="text-gray-400">
                {t('comingSoon')}
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
