'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinner3DProps {
  message?: string;
}

export default function LoadingSpinner3D({ message }: LoadingSpinner3DProps) {
  return (
    <div className="w-full h-[70vh] bg-black rounded-lg flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-secondary/20 rounded-full" />
        {/* Spinning ring */}
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-secondary rounded-full animate-spin" />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-secondary animate-pulse" />
        </div>
      </div>
      {message && (
        <p className="text-gray-400 text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
}
