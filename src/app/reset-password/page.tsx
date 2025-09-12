// src/app/[locale]/reset-password/page.tsx
import React, { Suspense } from 'react';
import ImageSection from '@/components/ImageSection';
import ResetPasswordPanel from '@/components/ResetPasswordPanel';

// Force dynamic rendering to ensure query params are available
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return (
    <div className="relative bg-accent min-h-screen flex flex-col lg:flex-row">
      {/* Image Section - Mobile: fixed height, Desktop: full height */}
      <div className="relative h-[40vh] lg:h-screen lg:w-1/2 overflow-hidden bg-accent">
        <ImageSection />
      </div>

      {/* Form Section */}
      <div className="relative flex-1 lg:w-1/2 lg:h-screen flex items-center justify-center">
        <div className="w-full max-w-sm lg:max-w-none lg:h-full">
          <Suspense fallback={
            <div className="min-h-full bg-primary flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
            </div>
          }>
            <ResetPasswordPanel />
          </Suspense>
        </div>
      </div>
    </div>
  );
}