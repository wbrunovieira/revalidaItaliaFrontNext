'use client';

// Skeleton walls with primary color theme
export function SkeletonWalls() {
  const wallColor = '#0C3559'; // Primary color
  const accentColor = '#3887A6'; // Secondary color

  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Back wall accent stripe */}
      <mesh position={[0, 0.5, -4.98]}>
        <planeGeometry args={[20, 0.3]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-6, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Left wall accent stripe */}
      <mesh position={[-5.98, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 0.3]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>

      {/* Right wall */}
      <mesh position={[6, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Right wall accent stripe */}
      <mesh position={[5.98, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 0.3]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>
    </group>
  );
}
