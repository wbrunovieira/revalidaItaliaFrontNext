// /src/components/SearchInput.tsx
'use client';

import { useState, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

/**
 * SearchInput
 * Componente de input de busca com ícone e estilo personalizado.
 * - Gerencia estado interno
 * - Cor de fundo: #0C2133
 * - Cantos arredondados
 * - Ícone SVG dentro do campo, vindo de /public/icons
 * - Traduções via next-intl (namespace: 'SearchInput')
 */
export default function SearchInput() {
  const t = useTranslations('SearchInput');
  const [query, setQuery] = useState('');

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Ícone posicionado à esquerda com alt traduzido */}
      <Image
        src="/icons/search.svg"
        alt={t('iconAlt')}
        width={20}
        height={20}
        className="absolute left-3 top-1/2 transform -translate-y-1/2"
      />

      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={t('placeholder')}
        className="w-full pl-10 pr-4 py-2 bg-[#0C2133] text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
    </div>
  );
}
