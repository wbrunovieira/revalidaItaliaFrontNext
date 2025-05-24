// src/components/LoginForm.tsx
'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import TextField from './TextField';
import Button from './Button';
import Link from 'next/link';

export default function LoginForm() {
  const t = useTranslations('Login');

  // 1) Schema zod para *required* e *min length*
  const loginSchema = z.object({
    email: z
      .string()
      .nonempty({ message: t('emailRequired') })
      .email({ message: t('emailInvalid') }),
    password: z
      .string()
      .nonempty({ message: t('passwordRequired') })
      .min(6, {
        message: t('passwordMinLength', { min: 6 }),
      }),
  });
  type LoginData = z.infer<typeof loginSchema>;

  // 2) Inicia RHF com modo onBlur (valida required e min)
  const {
    register,
    handleSubmit,
    watch,
    formState: {
      errors,
      isSubmitting,
      isSubmitSuccessful,
      touchedFields,
    },
    setFocus,
    clearErrors,
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // 3) Foca no email ao montar
  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data: LoginData) => {
    // TODO: chamar sua API de login
    console.log('login', data);
  };

  // 4) Watch + touched para validações em tempo real
  const password = watch('password') || '';
  const showCriteria = Boolean(touchedFields.password);

  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(
    password
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      {/* EMAIL */}
      <div>
        <TextField
          label={t('email')}
          type="email"
          placeholder={t('email')}
          {...register('email')}
          onFocus={() => clearErrors('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* SENHA */}
      <div>
        <TextField
          label={t('password')}
          type="password"
          placeholder={t('password')}
          {...register('password')}
          onFocus={() => clearErrors('password')}
          className={
            errors.password ? 'border-red-500' : ''
          }
        />

        {/* erros zod (required + min length) */}
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">
            {errors.password.message}
          </p>
        )}

        {/* critérios adicionais, só depois do primeiro blur */}
        {showCriteria && !errors.password && (
          <ul className="mt-2 space-y-1 text-sm">
            {!hasUppercase && (
              <li className="text-red-500">
                {t('passwordUppercase')}
              </li>
            )}
            {!hasNumber && (
              <li className="text-red-500">
                {t('passwordNumber')}
              </li>
            )}
            {!hasSpecial && (
              <li className="text-red-500">
                {t('passwordSpecial')}
              </li>
            )}
          </ul>
        )}
      </div>

      {/* ESQUECI A SENHA */}
      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-sm text-secondary hover:underline focus:outline-none focus:ring-1 focus:ring-secondary"
        >
          {t('forgotPassword')}
        </Link>
      </div>

      {/* BOTÃO */}
      <Button
        type="submit"
        text={
          isSubmitSuccessful
            ? t('buttonSuccess')
            : t('button')
        }
        size="large"
        disabled={isSubmitting}
      />
    </form>
  );
}
