// src/components/LanguageButton.tsx
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Link,
  usePathname as useBasePath,
} from '@/i18n/navigation';

interface Tab {
  label: string;
}

export default function LanguageButton() {
  const tabs: Tab[] = [
    { label: 'PT' },
    { label: 'IT' },
    { label: 'ES' },
  ];

  const searchParams = useSearchParams();
  const suffix = searchParams.toString()
    ? `?${searchParams.toString()}`
    : '';

  const basePath = useBasePath() ?? '';

  const locale = useLocale().toUpperCase();
  const idx = tabs.findIndex(tab => tab.label === locale);
  const activeIndex = idx >= 0 ? idx : 0;

  return (
    <div className="relative bg-secondary shadow-[0_0_1px_rgba(24,94,224,0.15),0_6px_12px_rgba(24,94,224,0.15)] p-1 rounded-full inline-block">
      <div className="relative flex">
        <span
          className="absolute top-0 left-0 h-[30px] w-[50px] bg-primary-dark rounded-full transition-all duration-300 ease-in-out"
          style={{
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {tabs.map((tab, i) => (
          <Link
            key={tab.label}
            href={`${basePath}${suffix}`}
            locale={tab.label.toLowerCase()}
            className={`
              relative flex items-center justify-center
              h-[30px] w-[50px] text-[0.6rem] font-medium rounded-full
              cursor-pointer transition-colors duration-300 ease-in-out
              ${
                activeIndex === i
                  ? 'text-white'
                  : 'text-primary-dark'
              }
            `}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
