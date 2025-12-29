'use client';

import { Text } from '@react-three/drei';

// Legend for hotspot types on wall (next to chalkboard)
export function HotspotLegend() {
  const primaryColor = '#0C3559';
  const secondaryColor = '#3887A6';

  return (
    <group position={[2.5, 2.5, -4.85]}>
      {/* Legend frame - white background */}
      <mesh position={[0.1, -0.1, 0]}>
        <planeGeometry args={[2.6, 2.0]} />
        <meshStandardMaterial color="#f8f5f0" />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.5, 0.01]}
        fontSize={0.12}
        color={primaryColor}
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        LEGENDA ANATOMICA
        <meshBasicMaterial color={primaryColor} />
      </Text>

      {/* Point section */}
      <group position={[-0.5, 0.1, 0.01]}>
        {/* Sphere symbol - big */}
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={0.5} />
        </mesh>
        {/* Point label */}
        <Text
          position={[0.35, 0.02, 0]}
          fontSize={0.16}
          color={primaryColor}
          anchorX="left"
          anchorY="middle"
          fontWeight={700}
        >
          Punto
          <meshBasicMaterial color={primaryColor} />
        </Text>
        {/* Point description */}
        <Text position={[0.35, -0.2, 0]} fontSize={0.11} color="#444444" anchorX="left" anchorY="middle" maxWidth={1.5}>
          Sede anatomica precisa
          <meshBasicMaterial color="#444444" />
        </Text>
      </group>

      {/* Area section */}
      <group position={[-0.5, -0.5, 0.01]}>
        {/* Hexagon symbol - big */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.05, 6]} />
          <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.5} />
        </mesh>
        {/* Outer ring for area */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.22, 6]} />
          <meshStandardMaterial color={secondaryColor} transparent opacity={0.4} />
        </mesh>
        {/* Area label */}
        <Text
          position={[0.35, 0.02, 0]}
          fontSize={0.16}
          color={secondaryColor}
          anchorX="left"
          anchorY="middle"
          fontWeight={700}
        >
          Area
          <meshBasicMaterial color={secondaryColor} />
        </Text>
        {/* Area description */}
        <Text position={[0.35, -0.2, 0]} fontSize={0.11} color="#444444" anchorX="left" anchorY="middle" maxWidth={1.5}>
          Regione corporea estesa
          <meshBasicMaterial color="#444444" />
        </Text>
      </group>

      {/* Decorative border */}
      <mesh position={[0.1, -0.1, -0.01]}>
        <planeGeometry args={[2.7, 2.1]} />
        <meshStandardMaterial color={secondaryColor} />
      </mesh>
    </group>
  );
}
