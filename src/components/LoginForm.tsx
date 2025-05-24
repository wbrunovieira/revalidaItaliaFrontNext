// src/components/LoginForm.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import TextField from './TextField';
import Button from './Button';

export default function LoginForm() {
  const t = useTranslations('Login');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: chamar API de login
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label={t('email')}
        name="email"
        type="email"
        placeholder={t('email')}
      />
      <TextField
        label={t('password')}
        name="password"
        type="password"
        placeholder={t('password')}
      />

      <div className="text-end">
        <a
          href="/forgot-password"
          className="text-sm text-secondary hover:underline"
        >
          {t('forgotPassword')}
        </a>
      </div>
      <Button text={t('button')} size="large" />

      {/* Link discreto para “Esqueci minha senha” */}
    </form>
  );
}
