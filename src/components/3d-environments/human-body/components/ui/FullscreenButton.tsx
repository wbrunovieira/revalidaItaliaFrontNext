'use client';

import { useFullscreen } from '../../../Environment3DContainer';

export function FullscreenButton({ compact = false }: { compact?: boolean }) {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  if (compact) {
    return (
      <button
        onClick={toggleFullscreen}
        className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
          isFullscreen
            ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
            : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
        }`}
        title={isFullscreen ? 'Esci Schermo Intero' : 'Schermo Intero'}
      >
        <span className="text-lg">{isFullscreen ? '🔲' : '⛶'}</span>
        <span className="text-[10px] font-medium whitespace-nowrap">{isFullscreen ? 'Esci' : 'Full'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleFullscreen}
      className="w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 border-2 whitespace-nowrap bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white"
    >
      <span className="text-base">{isFullscreen ? '🔲' : '⛶'}</span>
      {isFullscreen ? 'Esci Schermo Intero' : 'Schermo Intero'}
    </button>
  );
}
