'use client';

import { useState, useCallback, useRef, createContext, useContext } from 'react';

// Context to share fullscreen functionality with children
interface FullscreenContextType {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const FullscreenContext = createContext<FullscreenContextType | null>(null);

export const useFullscreen = () => {
  const context = useContext(FullscreenContext);
  if (!context) {
    throw new Error('useFullscreen must be used within Environment3DContainer');
  }
  return context;
};

interface Environment3DContainerProps {
  children: React.ReactNode;
  title: string;
}

export default function Environment3DContainer({
  children,
  title,
}: Environment3DContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, toggleFullscreen }}>
      <div
        ref={containerRef}
        className="relative w-full h-[70vh] bg-black rounded-lg overflow-hidden"
      >
        {/* Header with title only */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
        </div>

        {/* 3D Canvas */}
        <div className="w-full h-full">{children}</div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
          <div className="flex justify-center">
            <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <p className="text-white/60 text-sm text-center">
                Trascina per ruotare • Scorri per ingrandire • Clicca per selezionare
              </p>
            </div>
          </div>
        </div>
      </div>
    </FullscreenContext.Provider>
  );
}
