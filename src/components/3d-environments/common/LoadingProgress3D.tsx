'use client';

import { useProgress } from '@react-three/drei';
import { Loader2, Box } from 'lucide-react';

interface LoadingProgress3DProps {
  message?: string;
}

/**
 * Loading component with actual progress tracking
 *
 * Uses @react-three/drei's useProgress hook to show real loading progress
 * for 3D models and textures being loaded by Three.js
 */
export default function LoadingProgress3D({ message }: LoadingProgress3DProps) {
  const { progress, active, item } = useProgress();

  // Format the current loading item name
  const currentItem = item ? item.split('/').pop() : '';

  return (
    <div className="w-full h-[70vh] bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-lg flex flex-col items-center justify-center gap-6">
      {/* 3D Icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
          <Box className="w-10 h-10 text-secondary" />
        </div>
        {active && (
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-secondary rounded-full animate-spin" />
        )}
      </div>

      {/* Progress bar */}
      <div className="w-64 space-y-2">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-300 ease-out"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Math.round(progress)}%</span>
          <span>{active ? 'Carregando...' : 'Pronto'}</span>
        </div>
      </div>

      {/* Loading message */}
      {message && (
        <p className="text-gray-400 text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {message}
        </p>
      )}

      {/* Current item being loaded */}
      {currentItem && active && (
        <p className="text-gray-600 text-xs font-mono truncate max-w-xs">
          {currentItem}
        </p>
      )}
    </div>
  );
}
