'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Environment3DContainerProps {
  children: React.ReactNode;
  title: string;
  onReset?: () => void;
}

export default function Environment3DContainer({
  children,
  title,
  onReset,
}: Environment3DContainerProps) {
  const t = useTranslations('Environment3D');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = useCallback(async () => {
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

  const handleReset = useCallback(() => {
    onReset?.();
  }, [onReset]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[70vh] bg-black rounded-lg overflow-hidden"
    >
      {/* Header with title and controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <div className="flex gap-2 pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('controls.reset')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreen}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-2" />
                  {t('controls.exitFullscreen')}
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-2" />
                  {t('controls.fullscreen')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-full">{children}</div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="flex justify-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-white/60 text-sm text-center">
              {t('instructions.dragToRotate')} • {t('instructions.scrollToZoom')} • {t('instructions.clickToSelect')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
