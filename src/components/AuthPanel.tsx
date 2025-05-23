'use client';

import React from 'react';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import Logo from './Logo';

export default function AuthPanel() {
  return (
    <div
      className="
        flex-1 bg-primary flex flex-col justify-between
        rounded-t-3xl lg:rounded-none
        lg:border-l-4 lg:border-secondary
        overflow-hidden
      "
    >
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Lottie Icon */}
          <lottie-player
            src="/icons/pisa.json"
            background="transparent"
            speed="1"
            loop
            autoplay
            className="w-24 h-24 mx-auto"
          />

          <LoginHeader />
          <hr className="mt-4 border-t-2 border-[var(--color-secondary)] w-96 mx-auto" />
          <LoginForm />
          <hr className="mt-4 border-t-2 border-[var(--color-secondary)] w-96 mx-auto" />
        </div>
      </div>
      <footer className="p-6 flex justify-center">
        <Logo />
      </footer>
    </div>
  );
}
