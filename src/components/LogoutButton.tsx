'use client';

import { useRouter, useParams } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const { locale } = (useParams() as {
    locale?: string;
  }) ?? { locale: 'pt' };

  const handleLogout = () => {
    document.cookie =
      'token=; Path=/; SameSite=Lax; max-age=0';

    router.push(`/${locale}/login`);
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-secondary text-white rounded-2xl shadow hover:opacity-90"
    >
      Logout
    </button>
  );
}
