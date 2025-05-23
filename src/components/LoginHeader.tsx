// src/components/LoginHeader.tsx
import React from 'react';
import { useTranslations } from 'next-intl';

export default function LoginHeader() {
  const t = useTranslations('Login');
  return (
    <header className="text-center text-white">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2">{t('subtitle')}</p>
    </header>
  );
}
