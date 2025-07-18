// /src/components/TextField.tsx
'use client';

import React from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type TextFieldProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  };

export default function TextField({
  label,
  error,
  className = '',
  id,
  ...inputProps
}: TextFieldProps) {
  const inputId = id || inputProps.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block">
          <span className="text-sm font-medium text-gray-300 mb-1 block">
            {label}
          </span>
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'mt-1 block w-full rounded-md px-3 py-2 text-sm transition-all duration-200',
          'bg-gray-800 border border-gray-600 text-white placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...inputProps}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
