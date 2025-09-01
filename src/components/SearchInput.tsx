// /src/components/SearchInput.tsx
'use client';

import { useState, ChangeEvent, KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
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
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'pt';
  const [query, setQuery] = useState('');

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  function handleKeyPress(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleSearch() {
    if (query.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    }
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
        onKeyPress={handleKeyPress}
        placeholder={t('placeholder')}
        className="w-full pl-10 pr-12 py-2 bg-[#0C2133] text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
      
      {/* Botão de busca */}
      {query.trim() && (
        <button
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-white/10 rounded transition-colors"
          aria-label={t('search')}
        >
          <svg
            className="w-5 h-5 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
