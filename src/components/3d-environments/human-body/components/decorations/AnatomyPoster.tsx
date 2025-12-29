'use client';

// Anatomy poster on wall
export function AnatomyPoster() {
  const primaryColor = '#0C3559';
  const primaryDark = '#0F2940';
  const secondaryColor = '#3887A6';

  return (
    <group position={[5.9, 2.2, 1.8]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Poster frame */}
      <mesh>
        <boxGeometry args={[1.2, 1.6, 0.05]} />
        <meshStandardMaterial color={primaryDark} roughness={0.3} />
      </mesh>

      {/* Poster background */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[1.1, 1.5]} />
        <meshStandardMaterial color="#f8f5f0" />
      </mesh>

      {/* Title bar */}
      <mesh position={[0, 0.6, 0.04]}>
        <planeGeometry args={[1.0, 0.15]} />
        <meshStandardMaterial color={primaryColor} />
      </mesh>

      {/* Human body silhouette (simplified) */}
      <group position={[-0.15, -0.1, 0.04]}>
        {/* Head */}
        <mesh position={[0, 0.35, 0]}>
          <circleGeometry args={[0.07, 32]} />
          <meshBasicMaterial color={secondaryColor} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 0.1, 0]}>
          <planeGeometry args={[0.18, 0.32]} />
          <meshBasicMaterial color={secondaryColor} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.16, 0.12, 0]} rotation={[0, 0, 0.3]}>
          <planeGeometry args={[0.05, 0.26]} />
          <meshBasicMaterial color={secondaryColor} />
        </mesh>
        <mesh position={[0.16, 0.12, 0]} rotation={[0, 0, -0.3]}>
          <planeGeometry args={[0.05, 0.26]} />
          <meshBasicMaterial color={secondaryColor} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.05, -0.22, 0]}>
          <planeGeometry args={[0.06, 0.32]} />
          <meshBasicMaterial color={secondaryColor} />
        </mesh>
        <mesh position={[0.05, -0.22, 0]}>
          <planeGeometry args={[0.06, 0.32]} />
          <meshBasicMaterial color={secondaryColor} />
        </mesh>
      </group>

      {/* Anatomy lines/labels (decorative) */}
      {[0.2, 0.05, -0.1, -0.25, -0.4].map((y, i) => (
        <group key={i} position={[0.35, y, 0.04]}>
          {/* Line */}
          <mesh position={[-0.1, 0, 0]}>
            <planeGeometry args={[0.15, 0.005]} />
            <meshBasicMaterial color={primaryColor} />
          </mesh>
          {/* Label placeholder */}
          <mesh position={[0.08, 0, 0]}>
            <planeGeometry args={[0.2, 0.04]} />
            <meshBasicMaterial color={secondaryColor} transparent opacity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Footer text area */}
      <mesh position={[0, -0.65, 0.04]}>
        <planeGeometry args={[0.8, 0.08]} />
        <meshBasicMaterial color={primaryColor} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
