// /src/components/ForgotPasswordForm.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import TextField from './TextField';
import Button from './Button';
import Link from 'next/link';

export default function ForgotPasswordForm() {
  const t = useTranslations('ForgotPassword');
  const { locale } = (useParams() as { locale?: string }) ?? 'pt';

  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const forgotPasswordSchema = z.object({
    email: z
      .string()
      .nonempty({ message: t('emailRequired') })
      .email({ message: t('emailInvalid') }),
  });
  type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setFocus,
    clearErrors,
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data: ForgotPasswordData) => {
    setFormError(null); // Clear any previous errors
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const res = await fetch(`${apiUrl}/api/v1/auth/password/request-reset`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email.trim() }),
      });

      const result = await res.json();
      
      // According to API docs, always returns 200 with same message for security
      // regardless of whether email exists or not
      if (res.ok || res.status === 200) {
        setSubmittedEmail(data.email);
        setIsSuccess(true);
      } else if (res.status === 400 && result.errors) {
        // Validation error
        const emailErrors = result.errors.email;
        if (emailErrors && emailErrors.length > 0) {
          setFormError(emailErrors[0]);
        } else {
          setFormError(t('forgotPasswordFailed'));
        }
      } else if (res.status === 429) {
        // Rate limiting (Too Many Requests)
        setFormError(t('rateLimitError'));
      } else {
        // Other errors
        setFormError(result.message || t('forgotPasswordFailed'));
      }
    } catch (err: unknown) {
      console.error('Password reset request error:', err);
      
      // Check if it's a network error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setFormError(t('networkError'));
      } else if (err instanceof Error) {
        // Check for specific error types
        if (err.message.toLowerCase().includes('network') || 
            err.message.toLowerCase().includes('failed to fetch')) {
          setFormError(t('networkError'));
        } else {
          setFormError(t('forgotPasswordFailed'));
        }
      } else {
        setFormError(t('forgotPasswordFailed'));
      }
    }
  };

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
            {t('successMessage', { email: submittedEmail })}
          </p>
          <p className="text-gray-400 text-xs">
            {t('checkSpam')}
          </p>
        </div>
        
        <Link
          href={`/${locale}/login`}
          className="inline-block text-secondary hover:text-accent transition-colors duration-200"
        >
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
      noValidate
    >
      <div className="text-center space-y-2 mb-8">
        <p className="text-gray-300 text-sm">
          {t('instructions')}
        </p>
      </div>

      {formError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-shake">
          <p className="text-center text-red-500 text-sm">
            {formError}
          </p>
        </div>
      )}

      <div>
        <TextField
          label={t('email')}
          type="email"
          placeholder={t('emailPlaceholder')}
          {...register('email')}
          onFocus={() => {
            clearErrors('email');
            setFormError(null);
          }}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500 animate-fadeIn">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="large"
        disabled={isSubmitting}
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
            {t('sending')}
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