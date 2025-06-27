// src/app/[locale]/admin/components/UsersList.tsx

'use client';

import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';

export default function UsersList() {
  const t = useTranslations('Admin.usersList');

  return (
    <div className="rounded-lg bg-gray-800 p-6 shadow-lg">
      <h3 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
        <Users size={24} className="text-secondary" />
        {t('title')}
      </h3>

      <div className="text-center py-12">
        <Users
          size={64}
          className="text-gray-500 mx-auto mb-4"
        />
        <p className="text-gray-400">{t('comingSoon')}</p>
      </div>
    </div>
  );
}
