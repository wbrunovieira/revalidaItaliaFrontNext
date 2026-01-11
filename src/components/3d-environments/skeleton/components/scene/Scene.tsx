'use client';

import { memo, useMemo } from 'react';
import { Environment, OrbitControls } from '@react-three/drei';

import {
  HospitalCeiling,
  CeilingLights,
  HospitalWindow,
} from '../../../human-body/components/room';
import { SkeletonFloor, SkeletonWalls, SkeletonWallText } from '../room';
import {
  InstructionsChalkboard,
  HotspotLegend,
  AnatomyPoster,
} from '../../../human-body/components/decorations';
import { SkeletonPlaceholder } from './SkeletonPlaceholder';
import { CameraController } from './CameraController';

interface SceneProps {
  bodyRotation: number;
  focusedPart: string;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
  audioVolume: number;
  activeHotspotId: string | null;
  gameMode?: 'study' | 'challenge' | 'consultation' | 'scrivi';
  challengeMode?: boolean;
  challengeTargetId?: string | null;
  showCorrectAnswer?: boolean;
  scriviTargetId?: string | null;
  isScriviMode?: boolean;
  onChallengeClick?: (hotspotId: string) => void;
  // Performance props
  shadowMapSize?: number;
}

/**
 * Scene Component for Skeleton Environment
 * Reuses room components from human-body
 */
function SceneComponent({
  bodyRotation,
  focusedPart,
  controlsRef,
  gameMode = 'study',
  shadowMapSize = 2048,
}: SceneProps) {
  // Memoize shadow map size tuple
  const shadowMapSizeTuple = useMemo(
    () => [shadowMapSize, shadowMapSize] as [number, number],
    [shadowMapSize]
  );

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} color="#f0f5ff" />

      {/* Main directional light with dynamic shadow map size */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.5}
        castShadow
        shadow-mapSize={shadowMapSizeTuple}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Room environment with primary color theme */}
      <SkeletonFloor />
      <SkeletonWalls />
      <HospitalCeiling />
      <SkeletonWallText />
      <HospitalWindow />
      <AnatomyPoster />
      <HotspotLegend />
      <InstructionsChalkboard gameMode={gameMode} />
      <CeilingLights />

      {/* Skeleton placeholder (rotates horizontally) */}
      <SkeletonPlaceholder rotation={bodyRotation} />

      {/* Environment for subtle reflections - using 'city' for lighter load */}
      <Environment preset="city" />

      {/* Camera controller for smooth transitions */}
      <CameraController focusedPart={focusedPart} controlsRef={controlsRef} />

      {/* Zoom only controls - no rotation */}
      <OrbitControls
        ref={controlsRef}
        target={[0, 0.5, 0]}
        enablePan={false}
        enableZoom={true}
        enableRotate={false}
        minDistance={1.5}
        maxDistance={8}
      />
    </>
  );
}

// Export memoized component
export const Scene = memo(SceneComponent);
