'use client';

// Skeleton room floor with dark primary color
export function SkeletonFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#050d15" roughness={0.8} metalness={0.1} />
    </mesh>
  );
}
