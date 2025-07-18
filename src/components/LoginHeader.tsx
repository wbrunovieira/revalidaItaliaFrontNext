// /src/components/LoginHeader.tsx
// src/components/LoginHeader.tsx
import React from 'react';
import { useTranslations } from 'next-intl';
import Lottie from 'lottie-react';
import pisaAnimation from '../../public/icons/pisa.json';

export default function LoginHeader() {
  const t = useTranslations('Login');
  return (
    <header className="text-center text-background-white">
      <div className="flex items-center justify-center gap-2">
        <Lottie
          animationData={pisaAnimation}
          loop={true}
          autoplay={true}
          className="w-12 h-12 "
        />
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>
      <p className="mt-2">{t('subtitle')}</p>
    </header>
  );
}
