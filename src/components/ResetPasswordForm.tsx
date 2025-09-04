// /src/components/ResetPasswordForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import TextField from './TextField';
import Button from './Button';
import Link from 'next/link';
import Image from 'next/image';

export default function ResetPasswordForm() {
  const t = useTranslations('ResetPassword');
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || 'pt';
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState<string>('');

  const resetPasswordSchema = z.object({
    password: z
      .string()
      .nonempty({ message: t('passwordRequired') })
      .min(8, { message: t('passwordMinLength', { min: 8 }) })
      .regex(/[A-Z]/, { message: t('passwordUppercase') })
      .regex(/[a-z]/, { message: t('passwordLowercase') })
      .regex(/[0-9]/, { message: t('passwordNumber') })
      .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: t('passwordSpecial') }),
    confirmPassword: z
      .string()
      .nonempty({ message: t('confirmPasswordRequired') }),
  }).refine(data => data.password === data.confirmPassword, {
    message: t('passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

  type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields },
    setFocus,
    clearErrors,
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        console.log('❌ No token provided in URL');
        setFormError(t('invalidToken'));
        setIsValidatingToken(false);
        return;
      }

      try {
        console.log('🔐 Verifying password reset token:', {
          token: token.substring(0, 10) + '...',
          timestamp: new Date().toISOString()
        });

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/v1/auth/password/verify-token?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        
        console.log('📥 Token verification response:', {
          status: response.status,
          valid: result.valid,
          email: result.email,
          expiresAt: result.expiresAt,
          timestamp: new Date().toISOString()
        });

        if (response.ok && result.valid) {
          console.log('✅ Token is valid');
          setTokenValid(true);
          setTokenEmail(result.email);
          setFocus('password');
        } else {
          console.log('❌ Token is invalid or expired');
          setFormError(result.detail || t('invalidOrExpiredToken'));
          setTokenValid(false);
        }
      } catch (error) {
        console.error('🔥 Token verification error:', error);
        setFormError(t('tokenVerificationError'));
        setTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    verifyToken();
  }, [token, setFocus, t]);

  const onSubmit = async (data: ResetPasswordData) => {
    if (!token || !tokenValid) {
      setFormError(t('invalidToken'));
      return;
    }

    setFormError(null);

    try {
      console.log('🔑 Submitting password reset:', {
        token: token.substring(0, 10) + '...',
        email: tokenEmail,
        timestamp: new Date().toISOString()
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/v1/auth/password/reset`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          token, 
          password: data.password 
        }),
      });
      
      const result = await response.json();
      
      console.log('📥 Password reset response:', {
        status: response.status,
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        console.log('✅ Password reset successful');
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 3000);
      } else {
        console.log('❌ Password reset failed:', result);
        if (response.status === 400 && result.detail) {
          setFormError(result.detail);
        } else if (response.status === 401) {
          setFormError(t('invalidOrExpiredToken'));
        } else {
          setFormError(result.message || t('resetPasswordFailed'));
        }
      }
    } catch (err: unknown) {
      console.error('🔥 Password reset error:', err);
      let message: string;
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes('network') || 
            err.message.toLowerCase().includes('fetch')) {
          message = t('networkError');
        } else {
          message = t('resetPasswordFailed');
        }
      } else {
        message = t('resetPasswordFailed');
      }
      setFormError(message);
    }
  };

  const password = watch('password') ?? '';
  const showCriteria = Boolean(touchedFields.password) && password.length > 0;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 8;

  // Show loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="space-y-6 text-center animate-fadeIn">
        <div className="bg-gray-800/50 rounded-lg p-8">
          <svg 
            className="w-12 h-12 text-secondary mx-auto mb-4 animate-spin"
            fill="none" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-300">
            {t('validatingToken')}
          </p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!tokenValid && !isValidatingToken) {
    return (
      <div className="space-y-6 text-center animate-fadeIn">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <svg 
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">
            {t('invalidTokenTitle')}
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            {formError || t('invalidOrExpiredToken')}
          </p>
        </div>
        
        <Link
          href={`/${locale}/forgot-password`}
          className="inline-block text-secondary hover:text-accent transition-colors duration-200"
        >
          {t('requestNewLink')}
        </Link>
      </div>
    );
  }

  // Show success message after password reset
  if (isSuccess) {
    return (
      <div className="space-y-6 text-center animate-fadeIn">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 animate-fadeIn">
          <svg 
            className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">
            {t('successTitle')}
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            {t('successMessage')}
          </p>
          <p className="text-gray-400 text-xs">
            {t('redirectingToLogin')}
          </p>
        </div>
      </div>
    );
  }

  // Show form if token is valid
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      {!token && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-shake">
          <p className="text-center text-red-500 text-sm">
            {t('invalidToken')}
          </p>
        </div>
      )}

      {formError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-shake">
          <p className="text-center text-red-500 text-sm">
            {formError}
          </p>
        </div>
      )}

      <div className="relative">
        <TextField
          label={t('newPassword')}
          type={showPassword ? 'text' : 'password'}
          placeholder={t('passwordPlaceholder')}
          {...register('password')}
          onFocus={() => {
            clearErrors('password');
            setFormError(null);
          }}
          className={errors.password ? 'border-red-500' : ''}
          disabled={!token}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-1/2 -translate-y-1/2 transform pr-3"
          style={{ marginTop: '0.75rem' }}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Image
            src={showPassword ? '/icons/visionOpen.svg' : '/icons/VIsionClosed.svg'}
            alt={showPassword ? 'Hide' : 'Show'}
            width={18}
            height={18}
          />
        </button>
      </div>
      {errors.password && (
        <p className="mt-1 text-sm text-red-500 animate-fadeIn">
          {errors.password.message}
        </p>
      )}

      {showCriteria && (
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 animate-fadeIn">
          <p className="text-sm font-medium text-gray-300 mb-2">{t('passwordRequirements')}</p>
          <ul className="space-y-1 text-sm">
            <li className={`flex items-center ${hasMinLength ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                {hasMinLength ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {t('passwordMinLength', { min: 8 })}
            </li>
            <li className={`flex items-center ${hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                {hasUppercase ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {t('passwordUppercase')}
            </li>
            <li className={`flex items-center ${hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                {hasLowercase ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {t('passwordLowercase')}
            </li>
            <li className={`flex items-center ${hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                {hasNumber ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {t('passwordNumber')}
            </li>
            <li className={`flex items-center ${hasSpecial ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                {hasSpecial ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              {t('passwordSpecial')}
            </li>
          </ul>
        </div>
      )}

      <div className="relative">
        <TextField
          label={t('confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder={t('confirmPasswordPlaceholder')}
          {...register('confirmPassword')}
          onFocus={() => {
            clearErrors('confirmPassword');
            setFormError(null);
          }}
          className={errors.confirmPassword ? 'border-red-500' : ''}
          disabled={!token}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-0 top-1/2 -translate-y-1/2 transform pr-3"
          style={{ marginTop: '0.75rem' }}
          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          <Image
            src={showConfirmPassword ? '/icons/visionOpen.svg' : '/icons/VIsionClosed.svg'}
            alt={showConfirmPassword ? 'Hide' : 'Show'}
            width={18}
            height={18}
          />
        </button>
      </div>
      {errors.confirmPassword && (
        <p className="mt-1 text-sm text-red-500 animate-fadeIn">
          {errors.confirmPassword.message}
        </p>
      )}

      <Button
        type="submit"
        size="large"
        disabled={isSubmitting || !token}
        className="w-full relative overflow-hidden"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg 
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {t('updating')}
          </span>
        ) : (
          t('button')
        )}
      </Button>

      <div className="text-center">
        <Link
          href={`/${locale}/login`}
          className="text-sm text-secondary hover:text-accent transition-colors duration-200"
        >
          {t('backToLogin')}
        </Link>
      </div>
    </form>
  );
}