// /src/components/ForgotPasswordHeader.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordHeader() {
  const t = useTranslations('ForgotPassword');

  return (
    <div className="text-center space-y-4 animate-fadeIn">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary/10 rounded-full mb-4 animate-pulse">
        <svg 
          className="w-10 h-10 text-secondary"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" 
          />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-white">
        {t('title')}
      </h1>
      
      <p className="text-gray-400 text-lg">
        {t('subtitle')}
      </p>
    </div>
  );
}