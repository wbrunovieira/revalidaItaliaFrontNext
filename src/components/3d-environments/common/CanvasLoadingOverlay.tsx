'use client';

import { useProgress, Html } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

/**
 * Loading overlay that renders inside the Canvas
 *
 * Uses Html from @react-three/drei to render DOM content in 3D space
 * Shows loading progress while 3D assets are being loaded
 */
export function CanvasLoadingOverlay() {
  const { progress, active } = useProgress();

  if (!active) return null;

  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 p-8 bg-black/80 rounded-xl backdrop-blur-sm">
        {/* Progress circle */}
        <div className="relative w-24 h-24">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="8"
            />
            {/* Progress arc */}
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="#3887A6"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              className="transition-all duration-300"
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xl font-bold">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Loading text */}
        <div className="flex items-center gap-2 text-gray-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Caricamento ambiente 3D...</span>
        </div>
      </div>
    </Html>
  );
}
