// src/components/Avatar.tsx
'use client';

import Image from 'next/image';

export default function Avatar() {
  return (
    <div className="relative w-10 h-10">
      <Image
        src="/icons/avatar.svg"
        alt="Avatar"
        width={40}
        height={40}
        className="rounded-full"
      />
    </div>
  );
}
