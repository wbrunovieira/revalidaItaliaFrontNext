'use client';

import type { BodyPartConfig } from '../../types';

interface BodyPartButtonProps {
  part: BodyPartConfig;
  isActive: boolean;
  onClick: () => void;
  label: string;
  hasExpander?: boolean;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

export function BodyPartButton({
  part,
  isActive,
  onClick,
  label,
  hasExpander,
  isExpanded,
  onExpandToggle,
}: BodyPartButtonProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onClick}
        className={`
          flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
          flex items-center gap-2 border-2 whitespace-nowrap
          ${
            isActive
              ? 'bg-[#3887A6] text-white border-[#3887A6] shadow-md'
              : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
          }
        `}
      >
        <span className="text-base">{part.icon}</span>
        {label}
      </button>
      {hasExpander && (
        <button
          onClick={e => {
            e.stopPropagation();
            onExpandToggle?.();
          }}
          className={`
            p-2 rounded-lg transition-all duration-300 border-2
            ${
              isExpanded
                ? 'bg-[#3887A6] text-white border-[#3887A6]'
                : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
            }
          `}
          title={isExpanded ? 'Chiudi dettagli' : 'Mostra dettagli'}
        >
          <svg
            className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}
