// /src/components/ImageSection.tsx
import Image from 'next/image';
import React from 'react';

export default function ImageSection() {
  return (
    <div className="relative overflow-hidden min-h-0 w-full h-full lg:flex lg:h-full lg:w-full">
      {/* Imagem mobile */}
      <Image
        src="/images/loginrevalidaItalia_Mobile.png"
        alt="Perfil mobile"
        width={250}
        height={250}
        priority
        className="object-cover w-full h-full lg:hidden"
      />

      {/* Imagem desktop */}
      <Image
        src="/images/loginrevalidaItalia4.png"
        alt="Perfil desktop"
        width={500}
        height={500}
        priority
        className="object-cover w-full h-full hidden md:block"
      />

      {/* Faixa clara no desktop */}
      <div className="hidden lg:block absolute left-0 top-0 h-full w-2 bg-[var(--color-secondary)]" />
    </div>
  );
}
