// src/components/Avatar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

interface UserData {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  role: string;
}

// Função para decodificar JWT (sem validação de assinatura - apenas para extrair dados)
function decodeJWT(token: string) {
  try {
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
            ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        )
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export default function Avatar() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split('/')[1];
  const [userData, setUserData] = useState<UserData | null>(
    null
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) return;

        // Decodificar o JWT para extrair o ID do usuário
        const decodedToken = decodeJWT(token);
        const userId = decodedToken?.sub; // 'sub' é normalmente onde fica o ID do usuário

        if (!userId) {
          console.error('User ID not found in token');
          return;
        }

        console.log('Fetching user data for ID:', userId);

        // Usar a rota GET /students/:id que existe no controller
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL ||
            'http://localhost:3333'
          }/students/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        } else {
          console.error(
            'Failed to fetch user data:',
            response.status
          );
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleClick = () => {
    router.push(`/${locale}/profile`);
  };

  return (
    <button
      onClick={handleClick}
      className="group relative p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary"
      aria-label={t('profile')}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-secondary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Avatar container */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden">
        <Image
          src={
            userData?.profileImageUrl || '/icons/avatar.svg'
          }
          alt={userData?.name || t('profile')}
          width={40}
          height={40}
          className="object-cover w-full h-full"
        />
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/0 via-secondary/20 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 -translate-x-full group-hover:translate-x-full" />
      </div>

      {/* Pulse animation on hover */}
      <div className="absolute inset-0 rounded-full border-2 border-secondary/50 opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
    </button>
  );
}
