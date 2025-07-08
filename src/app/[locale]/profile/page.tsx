// src/app/[locale]/profile/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import NavSidebar from '@/components/NavSidebar';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Calendar,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

  // Formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(
      locale === 'pt'
        ? 'pt-BR'
        : locale === 'es'
        ? 'es-ES'
        : 'it-IT'
    );
  };

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
        <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações Pessoais */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {t('personalInfo')}
                </h2>
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Image
                    src={
                      userData.profileImageUrl ||
                      '/icons/avatar.svg'
                    }
                    alt={userData.name}
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-secondary object-cover"
                  />
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white">
                  <Image
                    src="/icons/avatar.svg"
                    alt="Name"
                    width={20}
                    height={20}
                    className="text-secondary"
                  />
                  <div>
                    <p className="text-sm text-gray-400">
                      {t('name')}
                    </p>
                    <p className="font-medium">
                      {userData.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-white">
                  <Mail
                    size={20}
                    className="text-secondary"
                  />
                  <div>
                    <p className="text-sm text-gray-400">
                      {t('email')}
                    </p>
                    <p className="font-medium">
                      {userData.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-white">
                  <Hash
                    size={20}
                    className="text-secondary"
                  />
                  <div>
                    <p className="text-sm text-gray-400">
                      {t('cpf')}
                    </p>
                    <p className="font-medium">
                      {userData.cpf}
                    </p>
                  </div>
                </div>

                {userData.phone && (
                  <div className="flex items-center gap-3 text-white">
                    <Phone
                      size={20}
                      className="text-secondary"
                    />
                    <div>
                      <p className="text-sm text-gray-400">
                        {t('phone')}
                      </p>
                      <p className="font-medium">
                        {userData.phone}
                      </p>
                    </div>
                  </div>
                )}

                {userData.birthDate && (
                  <div className="flex items-center gap-3 text-white">
                    <Calendar
                      size={20}
                      className="text-secondary"
                    />
                    <div>
                      <p className="text-sm text-gray-400">
                        {t('birthDate')}
                      </p>
                      <p className="font-medium">
                        {formatDate(userData.birthDate)}
                      </p>
                    </div>
                  </div>
                )}

                {userData.lastLogin && (
                  <div className="flex items-center gap-3 text-white">
                    <Calendar
                      size={20}
                      className="text-secondary"
                    />
                    <div>
                      <p className="text-sm text-gray-400">
                        {t('lastLogin')}
                      </p>
                      <p className="font-medium">
                        {formatDate(userData.lastLogin)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Endereços */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <MapPin
                    size={24}
                    className="text-secondary"
                  />
                  {t('addresses')}
                </h2>
              </div>

              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(address => (
                    <div
                      key={address.id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-secondary transition-colors"
                    >
                      <div className="space-y-2 text-white">
                        <p className="font-medium">
                          {address.street}, {address.number}
                        </p>
                        {address.complement && (
                          <p className="text-sm text-gray-400">
                            {address.complement}
                          </p>
                        )}
                        {address.district && (
                          <p className="text-sm text-gray-400">
                            {address.district}
                          </p>
                        )}
                        <p className="text-sm">
                          {address.city}
                          {address.state &&
                            `, ${address.state}`}{' '}
                          - {address.country}
                        </p>
                        <p className="text-sm text-gray-400">
                          {t('postalCode')}:{' '}
                          {address.postalCode}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin
                    size={48}
                    className="mx-auto mb-4 text-gray-500"
                  />
                  <p className="text-gray-400">
                    {t('noAddresses')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </NavSidebar>
  );
}
