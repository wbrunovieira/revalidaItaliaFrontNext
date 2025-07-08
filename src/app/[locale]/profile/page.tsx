import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';

import { ArrowLeft } from 'lucide-react';
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

  // Buscar dados do usuário atual usando GET /students/:id
  const resUser = await fetch(
    `${apiUrl}/students/${userId}`,
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
      <div className="flex-1 flex flex-col bg-primary min-h-screen">
        {/* Botão Voltar */}
        <div className="p-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white hover:text-secondary transition-colors"
          >
            <ArrowLeft size={20} />
            {t('back')}
          </Link>
        </div>

        {/* Cabeçalho */}
        <div className="px-6 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/icons/avatar.svg"
              alt={t('title')}
              width={48}
              height={48}
              className="text-white"
            />
            <h1 className="text-4xl lg:text-6xl font-bold text-white">
              {t('title')}
            </h1>
          </div>
          <hr className="border-t-2 border-secondary w-48 lg:w-96" />
        </div>

        {/* Conteúdo Principal */}
        <ProfileContent
          userData={userData}
          initialAddresses={addresses}
          locale={locale}
        />
      </div>
    </NavSidebar>
  );
}
