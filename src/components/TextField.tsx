// src/components/TextField.tsx
'use client';

import React from 'react';
import type { InputHTMLAttributes } from 'react';

type TextFieldProps =
  InputHTMLAttributes<HTMLInputElement> & {
    /** Label acima do input */
    label: string;
  };

export default function TextField({
  label,
  className = '',
  id,
  ...inputProps
}: TextFieldProps) {
  const inputId = id || inputProps.name;

  return (
    <label htmlFor={inputId} className="block">
      <span className="text-sm text-foreground">
        {label}
      </span>
      <input
        id={inputId}
        className={`mt-1 block w-full rounded bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-secondary ${className}`}
        {...inputProps}
      />
    </label>
  );
}
