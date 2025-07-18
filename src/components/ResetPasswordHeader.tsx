// /src/components/ResetPasswordHeader.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function ResetPasswordHeader() {
  const t = useTranslations('ResetPassword');

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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
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