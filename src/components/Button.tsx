// src/components/Button.tsx
'use client';

import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: 'small' | 'medium' | 'large';

    text: string;
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
  className = '',
  disabled,
  ...buttonProps
}) => {
  const baseClasses =
    'bg-secondary hover:bg-accent text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out';
  const classes = `${baseClasses} ${sizeClasses[size]} ${className}`;

  return (
    <button
      {...buttonProps}
      type={buttonProps.type || 'button'}
      className={classes}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
