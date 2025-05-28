'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import TextField from './TextField';
import Button from './Button';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginForm() {
  const t = useTranslations('Login');
  const API = process.env.NEXT_PUBLIC_API_URL!;
  const router = useRouter();
  const { locale } =
    (useParams() as { locale?: string }) ?? 'pt';

  const [formError, setFormError] = useState<string | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);

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

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data: LoginData) => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? 'loginFailed');
      }
      const { accessToken } = await res.json();
      document.cookie = [
        `token=${accessToken}`,
        `Path=/`,
        `SameSite=Lax`,
      ].join('; ');
      router.push(`/${locale}`);
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        message =
          err.message === 'loginFailed'
            ? t('loginFailed')
            : err.message;
      } else {
        message = t('loginFailed');
      }
      setFormError(message);
    }
  };

  const password = watch('password') ?? '';
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
      {formError && (
        <p className="text-center text-red-500">
          {formError}
        </p>
      )}

      <TextField
        label={t('email')}
        type="email"
        placeholder={t('email')}
        {...register('email')}
        onFocus={() => {
          clearErrors('email');
          setFormError(null);
        }}
        className={errors.email ? 'border-red-500' : ''}
      />
      {errors.email && (
        <p className="mt-1 text-sm text-red-500">
          {errors.email.message}
        </p>
      )}

      <div className="relative">
        <TextField
          label={t('password')}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('password')}
          {...register('password')}
          onFocus={() => {
            clearErrors('password');
            setFormError(null);
          }}
          className={
            errors.password ? 'border-red-500' : ''
          }
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-3 top-9 flex items-center"
          aria-label={
            showPassword ? 'Hide password' : 'Show password'
          }
        >
          <Image
            src={
              showPassword
                ? '/icons/visionOpen.svg'
                : '/icons/VIsionClosed.svg'
            }
            alt={showPassword ? 'Hide' : 'Show'}
            width={18}
            height={18}
          />
        </button>
      </div>
      {errors.password && (
        <p className="mt-1 text-sm text-red-500">
          {errors.password.message}
        </p>
      )}

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

      <div className="text-right">
        <Link
          href={`/${locale}/forgot-password`}
          className="text-sm text-secondary hover:underline"
        >
          {t('forgotPassword')}
        </Link>
      </div>

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
