// src/components/Avatar.tsx
'use client';

import Image from 'next/image';

export default function Notifications() {
  return (
    <div className="relative w-6 h-6">
      <Image
        src="/icons/notification.svg"
        alt="Avatar"
        width={40}
        height={40}
        className="rounded-full"
      />
    </div>
  );
}
