'use client';

import React from 'react';

type ButtonProps = {
  /**
   * Tamanho do botão: 'small', 'medium' ou 'large'
   * Default: 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  /** Texto exibido no botão */
  text: string;
  /** Função executada no click */
  onClick?: () => void;
  /** Desabilita o botão */
  disabled?: boolean;
};

const sizeClasses: Record<
  Required<ButtonProps>['size'],
  string
> = {
  small: 'px-3 py-1 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-12 py-3 text-lg',
};

const Button: React.FC<ButtonProps> = ({
  size = 'medium',
  text,
  onClick,
  disabled = false,
}) => {
  const baseClasses =
    'bg-secondary cursor-pointer hover:bg-accent text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out';
  const classes = `${baseClasses} ${sizeClasses[size]}`;

  return (
    <button
      onClick={onClick}
      className={classes}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
