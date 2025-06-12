'use client';

interface MenuToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function MenuToggle({
  collapsed,
  onToggle,
}: MenuToggleProps) {
  return (
    <button
      aria-label={collapsed ? 'Abrir menu' : 'Fechar menu'}
      onClick={onToggle}
      className="relative w-12 h-12 focus:outline-none"
    >
      {/* ícone “open” */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
          collapsed ? 'opacity-100' : 'opacity-0'
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

      {/* ícone “close” */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
          collapsed ? 'opacity-0' : 'opacity-100'
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
