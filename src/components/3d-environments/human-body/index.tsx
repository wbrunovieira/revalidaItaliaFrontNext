'use client';

import { useState, useCallback, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { useTranslations } from 'next-intl';
import * as THREE from 'three';
import { Environment3DProps } from '../registry';
import Environment3DContainer from '../Environment3DContainer';

// Placeholder body model - will be replaced with actual GLTF model
function PlaceholderBody() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Subtle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Torso */}
      <mesh
        position={[0, 0.5, 0]}
        onPointerOver={() => setHovered('torso')}
        onPointerOut={() => setHovered(null)}
      >
        <capsuleGeometry args={[0.35, 0.8, 8, 16]} />
        <meshStandardMaterial
          color={hovered === 'torso' ? '#4a9eff' : '#e8d4c4'}
          roughness={0.7}
          metalness={0.1}
        />
        {hovered === 'torso' && (
          <Html center distanceFactor={10}>
            <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Torso
            </div>
          </Html>
        )}
      </mesh>

      {/* Head */}
      <mesh
        position={[0, 1.35, 0]}
        onPointerOver={() => setHovered('head')}
        onPointerOut={() => setHovered(null)}
      >
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={hovered === 'head' ? '#4a9eff' : '#e8d4c4'}
          roughness={0.7}
          metalness={0.1}
        />
        {hovered === 'head' && (
          <Html center distanceFactor={10}>
            <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Head
            </div>
          </Html>
        )}
      </mesh>

      {/* Left Arm */}
      <mesh
        position={[-0.55, 0.6, 0]}
        rotation={[0, 0, 0.3]}
        onPointerOver={() => setHovered('leftArm')}
        onPointerOut={() => setHovered(null)}
      >
        <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
        <meshStandardMaterial
          color={hovered === 'leftArm' ? '#4a9eff' : '#e8d4c4'}
          roughness={0.7}
          metalness={0.1}
        />
        {hovered === 'leftArm' && (
          <Html center distanceFactor={10}>
            <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Left Arm
            </div>
          </Html>
        )}
      </mesh>

      {/* Right Arm */}
      <mesh
        position={[0.55, 0.6, 0]}
        rotation={[0, 0, -0.3]}
        onPointerOver={() => setHovered('rightArm')}
        onPointerOut={() => setHovered(null)}
      >
        <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
        <meshStandardMaterial
          color={hovered === 'rightArm' ? '#4a9eff' : '#e8d4c4'}
          roughness={0.7}
          metalness={0.1}
        />
        {hovered === 'rightArm' && (
          <Html center distanceFactor={10}>
            <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Right Arm
            </div>
          </Html>
        )}
      </mesh>

      {/* Left Leg */}
      <mesh
        position={[-0.2, -0.5, 0]}
        onPointerOver={() => setHovered('leftLeg')}
        onPointerOut={() => setHovered(null)}
      >
        <capsuleGeometry args={[0.12, 0.8, 8, 16]} />
        <meshStandardMaterial
          color={hovered === 'leftLeg' ? '#4a9eff' : '#e8d4c4'}
          roughness={0.7}
          metalness={0.1}
        />
        {hovered === 'leftLeg' && (
          <Html center distanceFactor={10}>
            <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Left Leg
            </div>
          </Html>
        )}
      </mesh>

      {/* Right Leg */}
      <mesh
        position={[0.2, -0.5, 0]}
        onPointerOver={() => setHovered('rightLeg')}
        onPointerOut={() => setHovered(null)}
      >
        <capsuleGeometry args={[0.12, 0.8, 8, 16]} />
        <meshStandardMaterial
          color={hovered === 'rightLeg' ? '#4a9eff' : '#e8d4c4'}
          roughness={0.7}
          metalness={0.1}
        />
        {hovered === 'rightLeg' && (
          <Html center distanceFactor={10}>
            <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Right Leg
            </div>
          </Html>
        )}
      </mesh>
    </group>
  );
}

// Scene component with all 3D elements
function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
      />

      {/* Body placeholder */}
      <PlaceholderBody />

      {/* Ground shadow */}
      <ContactShadows
        position={[0, -1.1, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />

      {/* Environment for reflections */}
      <Environment preset="studio" />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI - Math.PI / 6}
        target={[0, 0.3, 0]}
      />
    </>
  );
}

export default function HumanBodyEnvironment({ onComplete }: Environment3DProps) {
  const t = useTranslations('Environment3D');

  const handleReset = useCallback(() => {
    // Reset is handled by OrbitControls internally when re-rendered
    // For now, this is a placeholder for future implementation
  }, []);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <Environment3DContainer
      title={t('environments.humanBody') || 'Human Body - Anatomy'}
      onReset={handleReset}
    >
      <Canvas
        shadows
        camera={{
          position: [0, 1, 4],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        style={{ background: 'linear-gradient(to bottom, #1a1a2e, #0a0a0a)' }}
        onCreated={() => {
          // Canvas ready - could trigger onComplete after user interaction
          handleComplete();
        }}
      >
        <Scene />
      </Canvas>
    </Environment3DContainer>
  );
}
