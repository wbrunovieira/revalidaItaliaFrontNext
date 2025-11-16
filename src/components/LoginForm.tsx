// /src/components/LoginForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield } from 'lucide-react';
import TextField from './TextField';
import Button from './Button';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useAuthStore } from '@/stores/auth.store';

export default function LoginForm() {
  const t = useTranslations('Login');
  const tSession = useTranslations('Session');
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || 'pt';
  const { login } = useAuth();

  // Observar estado de rate limit do Zustand
  const isRateLimited = useAuthStore((state) => state.isRateLimited);

  const [formError, setFormError] = useState<string | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

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
    setFormError(null); // Clear any previous errors
    setLoginSuccess(false); // Reset success state
    
    try {
      // Usar o Auth Store para fazer login
      await login({
        email: data.email,
        password: data.password
      });
      
      // Mark as successful
      setLoginSuccess(true);
      
      // Redirecionar após sucesso
      router.push(`/${locale}`);
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        // 🆕 Tratamento especial para rate limiting
        if (err.message === 'RATE_LIMIT_EXCEEDED') {
          // Não definir formError aqui, o Alert será mostrado automaticamente
          // graças ao isRateLimited do store
          setLoginSuccess(false);
          return; // Sair sem definir formError
        }
        // Check for network errors
        else if (err.message.toLowerCase().includes('failed to fetch') ||
            err.message.toLowerCase().includes('network') ||
            err.message.toLowerCase().includes('fetch')) {
          message = t('networkError');
        } else if (err.message === 'loginFailed') {
          message = t('loginFailed');
        } else if (err.message.includes('401') || err.message.includes('Invalid credentials')) {
          message = t('invalidCredentials');
        } else {
          // Use generic error message instead of showing technical details
          message = t('genericError');
        }
      } else {
        message = t('genericError');
      }
      setFormError(message);
      setLoginSuccess(false); // Ensure success state is false on error
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
      {/* Rate Limit Alert */}
      {isRateLimited && (
        <div className="border border-yellow-500 bg-yellow-50 rounded-lg p-4 flex gap-3">
          <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-yellow-900 font-semibold mb-1">
              {tSession('rateLimit.title')}
            </h3>
            <p className="text-yellow-800 text-sm mb-2">
              {tSession('rateLimit.description')}
            </p>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm underline font-medium text-yellow-900 hover:text-yellow-700"
            >
              {tSession('rateLimit.forgotPassword')} {tSession('rateLimit.forgotPasswordLink')}
            </Link>
          </div>
        </div>
      )}

      {formError && !isRateLimited && (
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
          className="absolute right-0 top-1/2 -translate-y-1/2 transform pr-3"
          style={{ marginTop: '0.75rem' }}
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
          isRateLimited
            ? tSession('rateLimit.buttonDisabled')
            : loginSuccess
            ? t('buttonSuccess')
            : isSubmitting
            ? t('buttonLoading')
            : t('button')
        }
        size="large"
        disabled={isSubmitting || isRateLimited}
      />
    </form>
  );
}
