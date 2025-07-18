// /src/components/ForgotPasswordPanel.tsx
'use client';

import React from 'react';
import ForgotPasswordHeader from './ForgotPasswordHeader';
import ForgotPasswordForm from './ForgotPasswordForm';
import Logo from './Logo';

export default function ForgotPasswordPanel() {
  return (
    <div
      className="
        h-full bg-primary flex items-center justify-center
        border-t-16 border-[var(--color-secondary)] lg:border-t-0
        rounded-t-3xl lg:rounded-none
        lg:border-l-4 lg:border-secondary
        p-6 overflow-y-auto
      "
    >
      <div className="w-full max-w-sm space-y-4 my-auto">
        <ForgotPasswordHeader />
        <hr className="border-t-2 border-[var(--color-secondary)] w-48 lg:w-96 mx-auto" />
        <ForgotPasswordForm />
        <hr className="border-t-2 border-[var(--color-secondary)] w-48 lg:w-96 mx-auto" />
        <div className="flex justify-center pt-2 pb-4">
          <Logo />
        </div>
      </div>
    </div>
  );
}