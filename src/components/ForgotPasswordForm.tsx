// /src/components/ForgotPasswordForm.tsx
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

export default function ForgotPasswordForm() {
  const t = useTranslations('ForgotPassword');
  const API = process.env.NEXT_PUBLIC_API_URL!;
  const router = useRouter();
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
    try {
      // API route not implemented yet, simulating success for now
      // In real implementation:
      // const res = await fetch(`${API}/auth/forgot-password`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (err: unknown) {
      let message: string;
      if (err instanceof Error) {
        message = err.message === 'forgotPasswordFailed' 
          ? t('forgotPasswordFailed') 
          : err.message;
      } else {
        message = t('forgotPasswordFailed');
      }
      setFormError(message);
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