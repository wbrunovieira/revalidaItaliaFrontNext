'use client';

import { memo } from 'react';

interface SkeletonPlaceholderProps {
  rotation: number;
}

/**
 * Placeholder component for the skeleton model
 * This will be replaced with the actual GLB model when available
 */
function SkeletonPlaceholderComponent({ rotation }: SkeletonPlaceholderProps) {
  return (
    <group rotation-y={rotation}>
      {/* Simple skeleton outline placeholder */}
      <group position={[0, 0, 0]}>
        {/* Skull */}
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#f5f5dc" wireframe />
        </mesh>

        {/* Spine */}
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
          <meshStandardMaterial color="#f5f5dc" wireframe />
        </mesh>

        {/* Ribcage */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.2, 0.15, 0.4, 8]} />
          <meshStandardMaterial color="#f5f5dc" wireframe />
        </mesh>

        {/* Pelvis */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.3, 0.15, 0.1]} />
          <meshStandardMaterial color="#f5f5dc" wireframe />
        </mesh>

        {/* Left arm */}
        <mesh position={[-0.35, 1.1, 0]} rotation={[0, 0, Math.PI / 6]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
          <meshStandardMaterial color="#f5f5dc" wireframe />
        </mesh>

        {/* Right arm */}
        <mesh position={[0.35, 1.1, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
          <meshStandardMaterial color="#f5f5dc" wireframe />
        </mesh>

        {/* Left leg */}
        <mesh position={[-0.1, -0.3, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.8, 8]} />
          <meshStandardMaterial color="#f5f5dc" wireframe />
        </mesh>

        {/* Right leg */}
        <mesh position={[0.1, -0.3, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.8, 8]} />
          <meshStandardMaterial color="#f5f5dc" wireframe />
        </mesh>
      </group>

      {/* Placeholder label using HTML overlay would be better */}
      {/* Text labels removed - fonts not available */}
    </group>
  );
}

export const SkeletonPlaceholder = memo(SkeletonPlaceholderComponent);
