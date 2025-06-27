// src/components/Button.tsx
'use client';

import React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: 'small' | 'medium' | 'large';
    text?: string; // Agora é opcional para manter compatibilidade
    children?: React.ReactNode; // Suporta children
  };

const sizeClasses: Record<
  NonNullable<ButtonProps['size']>,
  string
> = {
  small: 'px-3 py-1 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-12 py-3 text-lg',
};

const Button: React.FC<ButtonProps> = ({
  size = 'medium',
  text,
  children,
  className = '',
  disabled,
  ...buttonProps
}) => {
  const baseClasses =
    'bg-secondary hover:bg-accent text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out';

  // Se className incluir classes de background/hover customizadas, não usar as padrões
  const hasCustomColors =
    className.includes('bg-') ||
    className.includes('hover:bg-');

  const classes = cn(
    !hasCustomColors && baseClasses,
    sizeClasses[size],
    className
  );

  // Prioriza children sobre text para o conteúdo
  const content = children || text;

  return (
    <button
      {...buttonProps}
      type={buttonProps.type || 'button'}
      className={classes}
      disabled={disabled}
    >
      {content}
    </button>
  );
};

export default Button;
