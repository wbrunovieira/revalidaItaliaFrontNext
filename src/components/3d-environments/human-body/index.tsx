'use client';

import { Environment3DProps } from '../registry';
import Environment3DContainer from '../Environment3DContainer';

export default function HumanBodyEnvironment({ lessonId, locale }: Environment3DProps) {
  // TODO: Implement 3D scene with Three.js
  // This is a placeholder until we have the 3D model

  return (
    <Environment3DContainer title="Human Body - Anatomy">
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
            <span className="text-4xl">🫀</span>
          </div>
          <p className="text-white/60 text-sm">
            3D Environment Placeholder
          </p>
          <p className="text-white/40 text-xs mt-2">
            Lesson: {lessonId} | Locale: {locale}
          </p>
        </div>
      </div>
    </Environment3DContainer>
  );
}
