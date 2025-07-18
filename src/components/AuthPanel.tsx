// /src/components/AuthPanel.tsx
'use client';

import React from 'react';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import Logo from './Logo';

export default function AuthPanel() {
  return (
    <div
      className="
        h-full flex-1 bg-primary flex flex-col justify-between
        border-t-16 border-[var(--color-secondary)] lg:border-t-0
        rounded-t-3xl lg:rounded-none
        lg:border-l-4 lg:border-secondary
        
      "
    >
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <LoginHeader />
          <hr className="mt-4 border-t-2 border-[var(--color-secondary)] w-48 lg:w-96 mx-auto" />
          <LoginForm />
          <hr className="mt-4 border-t-2 border-[var(--color-secondary)] w-48 lg:w-96 mx-auto" />
        </div>
      </div>
      <footer className="p-6 lg:pb-32 flex justify-center">
        <Logo />
      </footer>
    </div>
  );
}
