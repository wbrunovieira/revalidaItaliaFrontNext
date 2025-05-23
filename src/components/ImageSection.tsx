// src/components/ImageSection.tsx
import Image from 'next/image';
import React from 'react';

export default function ImageSection() {
  return (
    <div className="bg-secondary hidden lg:flex lg:w-1/2 relative ">
      <Image
        src="/images/loginrevalidaItalia4.png"
        alt="Perfil"
        width={500}
        height={500}
        priority
        className="object-cover w-full h-full"
      />
      {/* faixa clara */}
      <div className="hidden lg:block absolute left-0 top-0 h-full w-2 bg-[var(--color-secondary)]" />
    </div>
  );
}
