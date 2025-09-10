// /src/components/Logo.tsx
// src/components/Logo.tsx

'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface LogoProps {
  alt?: string;
}

export default function Logo({ alt = 'Revalida Itália' }: LogoProps) {
  const params = useParams() as { locale?: string };
  const locale = params?.locale || 'pt';

  return (
    <Link
      href={`/${locale}`}
      className="inline-flex items-center hover:opacity-90 transition-opacity duration-200"
      aria-label={alt}
    >
      <Image
        src="/images/logo-3.png"
        alt={alt}
        width={300}
        height={40}
        priority
        className="cursor-pointer w-auto h-auto max-w-[260px] xl:max-w-[300px]"
      />
    </Link>
  );
}
