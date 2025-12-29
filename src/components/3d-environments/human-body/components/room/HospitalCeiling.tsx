'use client';

// Hospital ceiling
export function HospitalCeiling() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#f5efe6" roughness={0.9} />
    </mesh>
  );
}
