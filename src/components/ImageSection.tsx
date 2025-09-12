// /src/components/ImageSection.tsx
import Image from 'next/image';
import React from 'react';

export default function ImageSection() {
  return (
    <div className="relative w-full h-full">
      {/* Imagem mobile */}
      <Image
        src="/images/loginrevalidaItalia_Mobile.png"
        alt="Perfil mobile"
        fill
        priority
        className="object-cover lg:hidden"
        sizes="100vw"
      />

      {/* Imagem desktop */}
      <Image
        src="/images/loginrevalidaItalia4.png"
        alt="Perfil desktop"
        fill
        priority
        className="object-cover hidden lg:block"
        sizes="50vw"
      />

      {/* Faixa clara no desktop */}
      <div className="hidden lg:block absolute left-0 top-0 h-full w-2 bg-[var(--color-secondary)] z-10" />
    </div>
  );
}
