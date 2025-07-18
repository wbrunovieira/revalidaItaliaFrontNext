// src/app/[locale]/forgot-password/page.tsx
import React from 'react';
import ImageSection from '@/components/ImageSection';
import ForgotPasswordPanel from '@/components/ForgotPasswordPanel';
import LanguageButton from '@/components/LanguageButton';

export default function ForgotPasswordPage() {
  return (
    <div
      className="
        relative bg-accent h-screen
        overflow-hidden lg:overflow-visible
        lg:flex lg:flex-row
      "
    >
      <div className="absolute top-0 right-0 p-6 z-20">
        <LanguageButton />
      </div>

      <div
        className="
          absolute inset-0
          lg:static lg:h-auto lg:w-1/2
          overflow-hidden
        "
      >
        <ImageSection />
      </div>

      <div
        className="
          relative z-10 flex items-end justify-center h-full
          lg:items-center lg:justify-center lg:w-1/2
        "
      >
        <div className="w-full sm:w-3/4 lg:w-full lg:h-full max-w-sm lg:max-w-none">
          <ForgotPasswordPanel />
        </div>
      </div>
    </div>
  );
}