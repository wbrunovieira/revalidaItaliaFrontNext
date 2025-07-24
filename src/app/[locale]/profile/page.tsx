// src/app/[locale]/profile/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import { ModernDivider } from '@/components/ui/modern-divider';

import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ProfileContent from '@/components/ProfileContent';

interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  district?: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  birthDate?: string;
  lastLogin?: string;
  profileImageUrl?: string;
  role: string;
}

// Função para decodificar JWT no servidor
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const jsonPayload = Buffer.from(
      base64,
      'base64'
    ).toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'Profile',
  });

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect(`/${locale}/login`);
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3333';

  // Decodificar o JWT para extrair o ID do usuário
  const decodedToken = decodeJWT(token);
  const userId = decodedToken?.sub; // 'sub' é normalmente onde fica o ID do usuário

  if (!userId) {
    console.error('User ID not found in token');
    redirect(`/${locale}/login`);
  }

  console.log('Fetching user data for ID:', userId);

  // Buscar dados do usuário atual usando GET /users/:id
  const resUser = await fetch(
    `${apiUrl}/api/v1/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }
  );

  if (!resUser.ok) {
    console.error(
      'Failed to fetch user data:',
      resUser.status
    );
    redirect(`/${locale}/login`);
  }

  const { user: userData }: { user: UserData } =
    await resUser.json();

  // Buscar endereços do usuário
  const resAddresses = await fetch(
    `${apiUrl}/addresses?userId=${userData.id}`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  let addresses: Address[] = [];
  if (resAddresses.ok) {
    addresses = await resAddresses.json();
  }

  return (
    <NavSidebar>
      <div className="flex-1 flex flex-col bg-gradient-to-br from-primary via-primary to-primary/95 min-h-screen relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
        </div>

        {/* Conteúdo */}
        <div className="relative z-10">
          {/* Header com navegação */}
          <div className="bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm border-b border-white/10">
            <div className="px-6 py-4">
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-all group"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">{t('back')}</span>
              </Link>
            </div>
          </div>

          {/* Hero Section */}
          <div className="px-6 py-12 relative">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-6 mb-8">
                {/* Avatar do usuário ou ícone */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 p-0.5">
                    <div className="w-full h-full rounded-2xl bg-primary flex items-center justify-center">
                      {userData.profileImageUrl ? (
                        <Image
                          src={userData.profileImageUrl}
                          alt={userData.name}
                          width={76}
                          height={76}
                          className="rounded-2xl object-cover"
                        />
                      ) : (
                        <Image
                          src="/icons/avatar.svg"
                          alt="Default Avatar"
                          width={76}
                          height={76}
                          className="rounded-2xl"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Título e saudação */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-secondary text-sm font-medium flex items-center gap-1">
                      <Sparkles size={14} />
                      {t('welcomeBack')}
                    </span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white">
                    {userData.name.split(' ')[0]}
                  </h1>
                  <p className="text-white/60 mt-1">{t('manageYourProfile')}</p>
                </div>
              </div>

              {/* Linha divisória decorativa */}
              <ModernDivider variant="start" glowColor="secondary" />
            </div>
          </div>

          {/* Conteúdo Principal com padding e max-width */}
          <div className="px-6 pb-12">
            <div className="max-w-7xl mx-auto">
              <ProfileContent
                userData={userData}
                initialAddresses={addresses}
                locale={locale}
              />
            </div>
          </div>
        </div>

        {/* Pattern de fundo sutil */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyMHYySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
      </div>
    </NavSidebar>
  );
}