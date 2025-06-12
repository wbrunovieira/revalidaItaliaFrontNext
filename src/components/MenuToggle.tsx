import { useState } from 'react';

export default function MenuToggle() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button
      aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      onClick={() => setIsOpen(prev => !prev)}
      // Aumentado para tela desktop: dobro do tamanho (48x48px)
      className="relative w-12 h-12 focus:outline-none"
    >
      {/* Ícone "open" */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-0' : 'opacity-100'
        }`}
        stroke="#3887A6"
        strokeWidth={1.5}
        strokeLinecap="round"
      >
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="17" x2="16" y2="17" />
        <polyline
          points="16,15 20,17 16,19"
          strokeWidth={1}
        />
      </svg>

      {/* Ícone "close" */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        stroke="#3887A6"
        strokeWidth={1.5}
        strokeLinecap="round"
      >
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="8" y1="17" x2="20" y2="17" />
        <polyline points="8,15 4,17 8,19" strokeWidth={1} />
      </svg>
    </button>
  );
}
