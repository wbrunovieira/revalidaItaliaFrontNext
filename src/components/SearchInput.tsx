// /src/components/SearchInput.tsx
'use client';

import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { useCourseSuggestions } from '@/hooks/use-courses';
import { Search, X, Loader2, BookOpen, TrendingUp } from 'lucide-react';

/**
 * SearchInput
 * Componente de input de busca com microinterações, loading state e debounce.
 * - Usa dados reais cacheados via TanStack Query
 * - Animações de foco com scale e glow
 * - Loading state com spinner
 * - Debounce de 300ms
 * - Sugestões reais dos cursos
 */
export default function SearchInput() {
  const t = useTranslations('SearchInput');
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'pt';
  
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Debounced value com 300ms
  const debouncedQuery = useDebounce(query, 300);
  
  // Buscar sugestões reais usando dados cacheados
  const { suggestions, isLoading } = useCourseSuggestions(debouncedQuery, 5);

  // Mostrar/esconder sugestões baseado no estado
  useEffect(() => {
    if (debouncedQuery && isFocused) {
      setShowSuggestions(true);
    } else if (!debouncedQuery) {
      setShowSuggestions(false);
    }
  }, [debouncedQuery, isFocused]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim()) {
      setShowSuggestions(false);
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    }
    // Clear on Escape
    if (e.key === 'Escape') {
      setQuery('');
      setShowSuggestions(false);
      (e.target as HTMLInputElement).blur();
    }
  }

  function handleSearch() {
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleClear() {
    setQuery('');
    setShowSuggestions(false);
  }

  function handleSuggestionClick(slug: string) {
    setShowSuggestions(false);
    // Navegar direto para o curso ao invés da página de busca
    router.push(`/${locale}/courses/${slug}`);
  }

  // Função para destacar o termo buscado
  function highlightMatch(text: string, searchTerm: string) {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? 
        <span key={index} className="text-[#8BCAD9] font-semibold">{part}</span> : 
        part
    );
  }

  return (
    <div 
      className={cn(
        "relative w-full max-w-md transition-all duration-300 ease-out",
        isFocused && "scale-[1.02]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container com glow effect */}
      <div className={cn(
        "relative rounded-lg transition-all duration-300",
        isFocused && "animate-glow-pulse-search"
      )}>
        
        {/* Shimmer overlay when focused */}
        {isFocused && (
          <div className="absolute inset-0 rounded-lg search-shimmer pointer-events-none opacity-50" />
        )}

        {/* Ícone de busca com animação ou spinner de loading */}
        <div className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-300",
          !isLoading && isHovered && "animate-pulse-search",
          isFocused && "text-[#8BCAD9]"
        )}>
          {isLoading && query ? (
            <Loader2 className="w-5 h-5 text-[#8BCAD9] animate-spin-search" />
          ) : query ? (
            <Search className="w-5 h-5 text-[#8BCAD9] transition-colors" />
          ) : (
            <Image
              src="/icons/search.svg"
              alt={t('iconAlt')}
              width={20}
              height={20}
              className={cn(
                "transition-all duration-300",
                (isHovered || isFocused) && "brightness-150 saturate-150"
              )}
            />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim() && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
            // Delay para permitir clique nas sugestões
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={t('placeholder')}
          className={cn(
            "w-full pl-10 pr-20 py-2.5",
            "bg-[#0C2133] text-white",
            "placeholder-gray-400/70 placeholder:transition-all placeholder:duration-300",
            "rounded-lg",
            "transition-all duration-300 ease-out",
            "border-2 border-transparent",
            // Focus states com cor secundária
            "focus:outline-none",
            "focus:border-[#8BCAD9]/50",
            "focus:bg-[#0C2133]/90",
            "focus:shadow-lg",
            "focus:shadow-[#8BCAD9]/20",
            "focus:placeholder-gray-500",
            // Hover states
            "hover:bg-[#0C2133]/95",
            "hover:border-[#8BCAD9]/20",
            // Glow effect on focus
            isFocused && "ring-2 ring-[#8BCAD9]/30 ring-offset-2 ring-offset-transparent"
          )}
        />
        
        {/* Container de botões */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Botão de limpar com animação */}
          {query && (
            <button
              onClick={handleClear}
              className={cn(
                "p-1.5 rounded transition-all duration-200",
                "hover:bg-white/10",
                "opacity-0 scale-75",
                query && "opacity-100 scale-100",
                "hover:rotate-90"
              )}
              aria-label={t('clear')}
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
            </button>
          )}

          {/* Botão de busca com hover effect */}
          {query.trim() && !isLoading && (
            <button
              onClick={handleSearch}
              className={cn(
                "p-1.5 rounded transition-all duration-200",
                "hover:bg-[#8BCAD9]/10",
                "group relative overflow-hidden"
              )}
              aria-label={t('search')}
            >
              {/* Background animado no hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8BCAD9]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              
              <svg
                className={cn(
                  "w-5 h-5 text-[#8BCAD9] relative z-10",
                  "transition-all duration-200",
                  "group-hover:text-white group-hover:translate-x-0.5"
                )}
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
      </div>

      {/* Dropdown de sugestões com dados reais */}
      {showSuggestions && (
        <div className={cn(
          "absolute top-full mt-2 w-full",
          "bg-[#0C2133] border-2 border-[#8BCAD9]/20",
          "rounded-lg shadow-xl",
          "overflow-hidden",
          "z-50",
          "animate-fadeIn"
        )}>
          {isLoading && query ? (
            // Skeleton loader enquanto carrega dados iniciais
            <div className="p-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-2 p-2">
                    <div className="w-4 h-4 bg-gray-700/50 rounded" />
                    <div className={cn(
                      "h-4 bg-gray-700/50 rounded",
                      i === 1 && "w-3/4",
                      i === 2 && "w-2/3",
                      i === 3 && "w-4/5"
                    )} />
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 text-center py-1">
                {t('searching')}...
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            // Sugestões reais com dados dos cursos
            <ul className="py-2 max-h-80 overflow-y-auto custom-scrollbar">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion.slug)}
                    className={cn(
                      "w-full px-4 py-3 text-left",
                      "hover:bg-[#8BCAD9]/10",
                      "transition-all duration-150",
                      "group",
                      "border-b border-gray-800/50 last:border-0"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-4 h-4 text-gray-500 group-hover:text-[#8BCAD9] transition-colors mt-0.5 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        {/* Título com highlight */}
                        <div className="text-white/90 text-sm font-medium truncate">
                          {highlightMatch(suggestion.title, query)}
                        </div>
                        
                        {/* Descrição se houver */}
                        {suggestion.description && (
                          <div className="text-gray-400 text-xs mt-0.5 line-clamp-1">
                            {highlightMatch(suggestion.description.substring(0, 60) + '...', query)}
                          </div>
                        )}
                        
                        {/* Info adicional */}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            {suggestion.moduleCount} {t('modules')}
                          </span>
                          
                          {/* Progresso se houver */}
                          {suggestion.progress > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-500">
                                {suggestion.progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Seta indicando ação */}
                      <svg
                        className={cn(
                          "w-4 h-4 text-gray-600 group-hover:text-[#8BCAD9]",
                          "transition-all duration-200",
                          "group-hover:translate-x-1",
                          "flex-shrink-0 mt-0.5"
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : query ? (
            // Sem resultados
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">{t('noSuggestions')}</p>
              <p className="text-gray-600 text-xs mt-1">{t('tryDifferent')}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}