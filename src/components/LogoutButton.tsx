// src/components/LogoutButton.tsx
'use client';

import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function LogoutButton() {
  const router = useRouter();
  const { locale } = (useParams() as {
    locale?: string;
  }) ?? { locale: 'pt' };
  const t = useTranslations('LogoutButton');

  const handleLogout = () => {
    document.cookie =
      'token=; Path=/; SameSite=Lax; max-age=0';
    router.push(`/${locale}/login`);
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-2xl shadow hover:opacity-90 text-xs"
    >
      <Image
        src="/icons/sign-out.svg"
        alt={t('iconAlt')}
        width={16}
        height={16}
      />
      <span>{t('logout')}</span>
    </button>
  );
}
