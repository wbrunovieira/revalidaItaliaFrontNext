'use client';

import { RoundedBox } from '@react-three/drei';

// Ceiling lights - main surgical light and secondary lights
export function CeilingLights() {
  return (
    <group>
      {/* Main surgical light */}
      <group position={[0, 4.5, 0]}>
        {/* Light arm */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 16]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Light housing */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.5, 0.2, 32]} />
          <meshStandardMaterial color="#fff" metalness={0.3} roughness={0.5} />
        </mesh>

        {/* Light surface */}
        <mesh position={[0, -0.11, 0]} rotation={[Math.PI, 0, 0]}>
          <circleGeometry args={[0.45, 32]} />
          <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} />
        </mesh>

        {/* Actual light */}
        <pointLight position={[0, -0.5, 0]} intensity={2} distance={8} color="#fff" castShadow />
      </group>

      {/* Secondary ceiling lights */}
      {[
        [-3, 4.8, -2],
        [3, 4.8, -2],
        [-3, 4.8, 2],
        [3, 4.8, 2],
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <RoundedBox args={[1.2, 0.1, 0.4]} radius={0.02}>
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} />
          </RoundedBox>
          <pointLight position={[0, -0.3, 0]} intensity={0.5} distance={5} color="#f0f5ff" />
        </group>
      ))}
    </group>
  );
}
