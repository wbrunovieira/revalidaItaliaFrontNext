// src/components/Logo.tsx

'use client';
import React from 'react';
import Image from 'next/image';

interface LogoProps {
  alt?: string;
}

export default function Logo({
  alt = 'Revalida Itália',
}: LogoProps) {
  return (
    <Image
      src="/images/logo-3.png"
      alt={alt}
      width={300}
      height={40}
      priority
    />
  );
}
