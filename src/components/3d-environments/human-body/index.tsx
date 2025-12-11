'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, RoundedBox } from '@react-three/drei';
import { useTranslations } from 'next-intl';
import * as THREE from 'three';
import { Environment3DProps } from '../registry';
import Environment3DContainer from '../Environment3DContainer';

// Hospital room floor with tile pattern
function HospitalFloor() {
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Base color - light gray tiles
      ctx.fillStyle = '#e8eef2';
      ctx.fillRect(0, 0, 512, 512);

      // Tile grid
      ctx.strokeStyle = '#d0d8e0';
      ctx.lineWidth = 2;
      const tileSize = 64;
      for (let x = 0; x <= 512; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial
        map={floorTexture}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
}

// Hospital walls
function HospitalWalls() {
  const wallColor = '#f5f7fa';
  const accentColor = '#3887A6';

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

      {/* Right wall */}
      <mesh position={[6, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

// Ceiling lights
function CeilingLights() {
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
          <meshStandardMaterial
            color="#fff"
            emissive="#fff"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Actual light */}
        <pointLight
          position={[0, -0.5, 0]}
          intensity={2}
          distance={8}
          color="#fff"
          castShadow
        />
      </group>

      {/* Secondary ceiling lights */}
      {[[-3, 4.8, -2], [3, 4.8, -2], [-3, 4.8, 2], [3, 4.8, 2]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <RoundedBox args={[1.2, 0.1, 0.4]} radius={0.02}>
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.3} />
          </RoundedBox>
          <pointLight
            position={[0, -0.3, 0]}
            intensity={0.5}
            distance={5}
            color="#f0f5ff"
          />
        </group>
      ))}
    </group>
  );
}

// Medical examination pedestal
function ExaminationPedestal() {
  return (
    <group position={[0, -1.1, 0]}>
      {/* Base platform */}
      <RoundedBox
        args={[1.5, 0.15, 1.5]}
        radius={0.02}
        position={[0, 0.075, 0]}
      >
        <meshStandardMaterial color="#2a3f5f" metalness={0.6} roughness={0.3} />
      </RoundedBox>

      {/* Central pillar */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.5, 32]} />
        <meshStandardMaterial color="#3a4f6f" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Top platform */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial color="#1a2f4f" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Glowing ring */}
      <mesh position={[0, 0.76, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.5, 64]} />
        <meshStandardMaterial
          color="#3887A6"
          emissive="#3887A6"
          emissiveIntensity={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

// Medical monitor
function MedicalMonitor() {
  return (
    <group position={[2.5, 0.5, -2]} rotation={[0, -0.4, 0]}>
      {/* Stand */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 16]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Base */}
      <mesh position={[0, -1.55, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Screen frame */}
      <RoundedBox args={[0.8, 0.6, 0.05]} radius={0.02} position={[0, 0, 0]}>
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
      </RoundedBox>

      {/* Screen */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial
          color="#001a33"
          emissive="#003366"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Screen content - heartbeat line */}
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[0.6, 0.02]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

// Medical cabinet
function MedicalCabinet() {
  return (
    <group position={[-4, 0, -3]} rotation={[0, 0.3, 0]}>
      {/* Cabinet body */}
      <RoundedBox args={[1.2, 2, 0.5]} radius={0.02} position={[0, 0, 0]}>
        <meshStandardMaterial color="#e8eef2" roughness={0.7} />
      </RoundedBox>

      {/* Glass doors */}
      <mesh position={[0, 0.2, 0.26]}>
        <planeGeometry args={[1.1, 1.5]} />
        <meshStandardMaterial
          color="#a8c8d8"
          transparent
          opacity={0.3}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Shelves visible through glass */}
      {[-0.4, 0, 0.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[1.1, 0.02, 0.4]} />
          <meshStandardMaterial color="#d0d8e0" />
        </mesh>
      ))}

      {/* Handle */}
      <mesh position={[0.45, 0.2, 0.28]}>
        <boxGeometry args={[0.03, 0.2, 0.03]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

// IV Stand decoration
function IVStand() {
  return (
    <group position={[-2, -1.1, 1]}>
      {/* Base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.1, 6]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Pole */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 16]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Top hook holder */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Hooks */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.sin(angle) * 0.15, 1.95, Math.cos(angle) * 0.15]}
          rotation={[0, angle, -Math.PI / 6]}
        >
          <cylinderGeometry args={[0.01, 0.01, 0.15, 8]} />
          <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// Placeholder body model - will be replaced with actual GLTF model
interface PlaceholderBodyProps {
  rotation: number;
}

function PlaceholderBody({ rotation }: PlaceholderBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Subtle floating animation + horizontal rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
      groupRef.current.rotation.y = rotation;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Torso */}
      <mesh
        position={[0, 0.5, 0]}
        onPointerOver={() => setHovered('torso')}
        onPointerOut={() => setHovered(null)}
        castShadow
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
        castShadow
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
        castShadow
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
        castShadow
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
        castShadow
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
        castShadow
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
interface SceneProps {
  bodyRotation: number;
}

function Scene({ bodyRotation }: SceneProps) {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} color="#f0f5ff" />

      {/* Main directional light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Hospital environment (fixed) */}
      <HospitalFloor />
      <HospitalWalls />
      <CeilingLights />
      <ExaminationPedestal />
      <MedicalMonitor />
      <MedicalCabinet />
      <IVStand />

      {/* Body placeholder (rotates horizontally) */}
      <PlaceholderBody rotation={bodyRotation} />

      {/* Environment for subtle reflections */}
      <Environment preset="apartment" />

      {/* Zoom only controls - no rotation */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={false}
        minDistance={2}
        maxDistance={8}
      />
    </>
  );
}

export default function HumanBodyEnvironment({ lessonId }: Environment3DProps) {
  const t = useTranslations('Environment3D');
  const [bodyRotation, setBodyRotation] = useState(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const handleReset = useCallback(() => {
    setBodyRotation(0);
    console.log(`[3D Environment] Reset body rotation for lesson: ${lessonId}`);
  }, [lessonId]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setBodyRotation(prev => prev + deltaX * 0.01);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <Environment3DContainer
      title={t('environments.humanBody') || 'Human Body - Anatomy'}
      onReset={handleReset}
    >
      <div
        style={{ width: '100%', height: '100%', cursor: isDragging.current ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Canvas
          shadows
          camera={{
            position: [3, 2, 5],
            fov: 50,
            near: 0.1,
            far: 100,
          }}
        >
          <color attach="background" args={['#1a1a2e']} />
          <fog attach="fog" args={['#1a1a2e', 8, 20]} />
          <Scene bodyRotation={bodyRotation} />
        </Canvas>
      </div>
    </Environment3DContainer>
  );
}
