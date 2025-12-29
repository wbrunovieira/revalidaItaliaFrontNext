'use client';

import { Text } from '@react-three/drei';

// 3D Wall Text with shadow effect (multiple layers for blur)
export function WallText() {
  return (
    <group position={[-5.9, 1.8, 0]} rotation={[0, Math.PI / 2, 0]}>
      {/* Shadow layers - multiple for blur effect */}
      <Text
        position={[0.08, -0.08, -0.05]}
        fontSize={0.7}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
        fontWeight={700}
      >
        Revalida Italia
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.08} />
      </Text>
      <Text
        position={[0.06, -0.06, -0.04]}
        fontSize={0.7}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
        fontWeight={700}
      >
        Revalida Italia
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.1} />
      </Text>
      <Text
        position={[0.04, -0.04, -0.03]}
        fontSize={0.7}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
        fontWeight={700}
      >
        Revalida Italia
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.12} />
      </Text>

      {/* Main text */}
      <Text fontSize={0.7} anchorX="center" anchorY="middle" letterSpacing={0.02} fontWeight={700}>
        Revalida Italia
        <meshStandardMaterial color="#0C3559" metalness={0.2} roughness={0.4} />
      </Text>
    </group>
  );
}
