// src/app/[locale]/reset-password/page.tsx
import React, { Suspense } from 'react';
import ImageSection from '@/components/ImageSection';
import ResetPasswordPanel from '@/components/ResetPasswordPanel';

// Force dynamic rendering to ensure query params are available
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <div
      className="
        relative bg-accent h-screen
        overflow-hidden lg:overflow-visible
        lg:flex lg:flex-row
      "
    >
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
          <Suspense fallback={<div className="h-full bg-primary flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div></div>}>
            <ResetPasswordPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}