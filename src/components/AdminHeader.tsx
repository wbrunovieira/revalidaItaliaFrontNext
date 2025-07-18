// /src/components/AdminHeader.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Shield,
  User,
  Activity,
  ChevronDown,
} from 'lucide-react';

import LanguageButton from '@/components/LanguageButton';
import LogoutButton from '@/components/LogoutButton';
import Logo from '@/components/Logo';
import { GradientDivider } from '@/components/ui/gradient-divider';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
}

export default function AdminHeader() {
  const t = useTranslations('Admin');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(
    null
  );
  const [loadingUser, setLoadingUser] = useState(true);

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
      return parts.pop()?.split(';').shift() || null;
    return null;
  };

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
    <header className="relative z-10 bg-gradient-to-r from-primary-dark/80 via-primary/60 to-primary-dark/80 backdrop-blur-md shadow-2xl shadow-primary/20 rounded-2xl border border-primary/20 mb-8">
      <div className="p-4">
        {/* Grid Layout - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
          
          {/* Column 1 - Title & Activity */}
          <div className="flex justify-center lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-secondary/20 to-primary/20 border border-secondary/30 shadow-md">
                <Activity
                  size={20}
                  className="text-secondary"
                />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                  {t('title')}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-gray-300 text-sm">
                    {t('description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 - Logo (Center) */}
          <div className="flex justify-center order-first lg:order-none">
            <div className="bg-gradient-to-br from-secondary/10 to-primary/10 p-3 rounded-xl border border-secondary/20 shadow-lg">
              <Logo />
            </div>
          </div>

          {/* Column 3 - User Info & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 sm:gap-4">
            {/* User Profile */}
            {!loadingUser && userInfo && (
              <div className="group relative">
                <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50 backdrop-blur-sm hover:from-gray-700/60 hover:to-gray-800/60 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary ring-2 ring-secondary/20 shadow-md">
                      {userInfo.role === 'admin' ? (
                        <Shield
                          size={18}
                          className="text-white"
                        />
                      ) : (
                        <User
                          size={18}
                          className="text-white"
                        />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800 flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <p className="text-white text-sm font-medium leading-tight">
                      {userInfo.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                      <p className="text-gray-400 text-xs">
                        {userInfo.role === 'admin'
                          ? 'Administrador'
                          : 'Usuário'}
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    size={16}
                    className="text-gray-400 hidden sm:block"
                  />
                </div>
              </div>
            )}
            {/* Loading State */}
            {loadingUser && (
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-xl border border-gray-700/50 backdrop-blur-sm shadow-lg">
                <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="hidden sm:block text-right">
                  <div className="w-20 h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="w-16 h-3 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            )}
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <LanguageButton />
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <GradientDivider variant="subtle" />
    </header>
  );
}
