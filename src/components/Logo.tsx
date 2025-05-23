// src/components/Logo.tsx
import React from 'react';
import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/images/logo-3.png"
      alt="Revalida Itália"
      width={300}
      height={40}
    />
  );
}
