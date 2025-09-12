// /src/components/ResetPasswordPanel.tsx
'use client';

import React from 'react';
import ResetPasswordHeader from './ResetPasswordHeader';
import ResetPasswordForm from './ResetPasswordForm';
import Logo from './Logo';

export default function ResetPasswordPanel() {
  return (
    <div
      className="
        min-h-full bg-primary flex items-center justify-center
        border-t-16 border-[var(--color-secondary)] lg:border-t-0
        rounded-t-3xl lg:rounded-none
        lg:border-l-4 lg:border-secondary
        p-6 overflow-y-auto
      "
    >
      <div className="w-full max-w-sm space-y-4 py-8 animate-slideUp">
        <ResetPasswordHeader />
        <hr className="border-t-2 border-[var(--color-secondary)] w-48 lg:w-96 mx-auto animate-fadeIn" style={{ animationDelay: '0.2s' }} />
        <ResetPasswordForm />
        <hr className="border-t-2 border-[var(--color-secondary)] w-48 lg:w-96 mx-auto animate-fadeIn" style={{ animationDelay: '0.4s' }} />
        <div className="flex justify-center pt-2 pb-4 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <Logo />
        </div>
      </div>
    </div>
  );
}