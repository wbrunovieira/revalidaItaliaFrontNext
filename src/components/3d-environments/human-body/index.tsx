'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, RoundedBox, useGLTF, Html, Text } from '@react-three/drei';
import { useTranslations } from 'next-intl';
import * as THREE from 'three';
import { Environment3DProps } from '../registry';
import Environment3DContainer from '../Environment3DContainer';

// Body parts configuration for camera focus
interface BodyPartConfig {
  id: string;
  labelKey: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  icon: string;
}

const BODY_PARTS: BodyPartConfig[] = [
  {
    id: 'full',
    labelKey: 'bodyFull',
    cameraPosition: [0, 0.5, 5],
    cameraTarget: [0, 0.5, 0],
    icon: '👤',
  },
  {
    id: 'head',
    labelKey: 'head',
    cameraPosition: [0, 1.5, 2.5],
    cameraTarget: [0, 1.4, 0],
    icon: '🧠',
  },
];

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
      <meshStandardMaterial map={floorTexture} roughness={0.3} metalness={0.1} />
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

// Hospital ceiling
function HospitalCeiling() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#f5efe6" roughness={0.9} />
    </mesh>
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

// Window with blinds
function HospitalWindow() {
  const blindsCount = 12;

  return (
    <group position={[5.9, 2, -1]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[2.5, 2, 0.1]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Venetian blinds */}
      <group position={[0, 0, 0.06]}>
        {Array.from({ length: blindsCount }).map((_, i) => (
          <mesh
            key={i}
            position={[0, 0.85 - i * 0.15, 0]}
            rotation={[0.3, 0, 0]}
          >
            <boxGeometry args={[2.2, 0.08, 0.01]} />
            <meshStandardMaterial color="#e8e0d0" roughness={0.8} />
          </mesh>
        ))}

        {/* Blinds cord */}
        <mesh position={[1.0, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 1.8, 8]} />
          <meshStandardMaterial color="#d0c8b8" />
        </mesh>
      </group>

      {/* Window sill */}
      <mesh position={[0, -1.05, 0.15]}>
        <boxGeometry args={[2.6, 0.08, 0.3]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Anatomy poster on wall
function AnatomyPoster() {
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

// 3D Wall Text with shadow effect (multiple layers for blur)
function WallText() {
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
      <Text
        fontSize={0.7}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
        fontWeight={700}
      >
        Revalida Italia
        <meshStandardMaterial color="#0C3559" metalness={0.2} roughness={0.4} />
      </Text>
    </group>
  );
}

// Human body 3D model (external only - skin, eyes, eyebrows, eyelashes)
// In production, Nginx proxies /public/ to S3; in dev, Next.js serves from public/ at root
const MODEL_PATH = process.env.NODE_ENV === 'production'
  ? '/public/models/human-body/anatomy-internal.glb'
  : '/models/human-body/anatomy-internal.glb';

// Hotspot component for interactive anatomy points
interface HotspotProps {
  position: [number, number, number];
  label: string;
  onHover?: (isHovered: boolean) => void;
}

function Hotspot({ position, label, onHover }: HotspotProps) {
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(false);
  };

  return (
    <group position={position}>
      {/* Hotspot point */}
      <mesh onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#3887A6' : '#0C3559'}
          emissive={hovered ? '#3887A6' : '#0C3559'}
          emissiveIntensity={hovered ? 1.2 : 0.6}
        />
      </mesh>

      {/* Pulsing ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.06, 32]} />
        <meshStandardMaterial color="#3887A6" transparent opacity={hovered ? 0.9 : 0.5} />
      </mesh>

      {/* Label tooltip - positioned to the right */}
      {hovered && (
        <Html
          position={[0, 0, 0]}
          distanceFactor={6}
          center={false}
          style={{
            pointerEvents: 'none',
            transform: 'translate(0, -50%)',
          }}
        >
          <div className="flex items-center">
            {/* Connector line - full length */}
            <div
              style={{
                width: '80px',
                height: '2px',
                backgroundColor: '#3887A6',
              }}
            />
            {/* Label box */}
            <div
              className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shadow-xl"
              style={{
                backgroundColor: '#0C3559',
                border: '2px solid #3887A6',
                color: '#ffffff',
              }}
            >
              {label}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Anatomy hotspots data (positions relative to model)
// yMin/yMax define the vertical range of meshes to highlight
const ANATOMY_HOTSPOTS: {
  id: string;
  position: [number, number, number];
  label: string;
  yMin: number;
  yMax: number;
}[] = [{ id: 'testa', position: [0, 1.65, 0.12], label: 'Testa', yMin: 1.4, yMax: 2.0 }];

interface HumanBodyModelProps {
  rotation: number;
}

function HumanBodyModel({ rotation }: HumanBodyModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map());

  // Clone the scene and store mesh references
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    meshRefs.current.clear();
    originalMaterials.current.clear();

    clone.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Keep original materials
        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.clone) {
            originalMaterials.current.set(child.uuid, mat.clone());
          }
        }

        // Store mesh reference with name for later filtering
        meshRefs.current.set(child.uuid, child);
      }
    });
    return clone;
  }, [scene]);

  // Update mesh materials based on hover state
  useFrame(() => {
    if (!hoveredHotspot) {
      // Reset all materials to original
      meshRefs.current.forEach(mesh => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      });
      return;
    }

    // Find the hovered hotspot data
    const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === hoveredHotspot);
    if (!hotspot) return;

    // Highlight meshes in the Y range
    meshRefs.current.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;

      // Get bounding box center for more accurate position
      const bbox = new THREE.Box3().setFromObject(mesh);
      const center = new THREE.Vector3();
      bbox.getCenter(center);

      if (center.y >= hotspot.yMin && center.y <= hotspot.yMax) {
        // Highlight this mesh
        mat.emissive.setHex(0x3887a6);
        mat.emissiveIntensity = 0.3;
      } else {
        // Reset
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  });

  // Model settings (single model now)
  const modelSettings = { scale: 0.012, baseY: -1.0, rotationOffset: Math.PI };

  // Subtle floating animation + horizontal rotation
  useFrame(state => {
    if (groupRef.current) {
      // Base Y position + floating animation
      groupRef.current.position.y = modelSettings.baseY + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
      groupRef.current.rotation.y = rotation + modelSettings.rotationOffset;
    }
  });

  const handleHotspotHover = useCallback((hotspotId: string, isHovered: boolean) => {
    setHoveredHotspot(isHovered ? hotspotId : null);
  }, []);

  return (
    <group ref={groupRef} position={[0, modelSettings.baseY, 0]} scale={modelSettings.scale}>
      <primitive object={clonedScene} />

      {/* Anatomy hotspots */}
      {ANATOMY_HOTSPOTS.map(hotspot => (
        <Hotspot
          key={hotspot.id}
          position={hotspot.position}
          label={hotspot.label}
          onHover={isHovered => handleHotspotHover(hotspot.id, isHovered)}
        />
      ))}
    </group>
  );
}

// Preload model
useGLTF.preload(MODEL_PATH);

// Camera controller for smooth transitions
interface CameraControllerProps {
  focusedPart: string;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

function CameraController({ focusedPart, controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0.5, 5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.5, 0));

  useEffect(() => {
    const part = BODY_PARTS.find(p => p.id === focusedPart);
    if (part) {
      targetPosition.current.set(...part.cameraPosition);
      targetLookAt.current.set(...part.cameraTarget);
    }
  }, [focusedPart]);

  useFrame(() => {
    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, 0.05);

    // Update OrbitControls target
    if (controlsRef.current) {
      const controls = controlsRef.current;
      controls.target.lerp(targetLookAt.current, 0.05);
      controls.update();
    }
  });

  return null;
}

// Scene component with all 3D elements
interface SceneProps {
  bodyRotation: number;
  focusedPart: string;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

function Scene({ bodyRotation, focusedPart, controlsRef }: SceneProps) {
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
      <HospitalCeiling />
      <WallText />
      <HospitalWindow />
      <AnatomyPoster />
      <CeilingLights />

      {/* Human body model (rotates horizontally) */}
      <HumanBodyModel rotation={bodyRotation} />

      {/* Environment for subtle reflections */}
      <Environment preset="apartment" />

      {/* Camera controller for smooth transitions */}
      <CameraController focusedPart={focusedPart} controlsRef={controlsRef} />

      {/* Zoom only controls - no rotation */}
      <OrbitControls
        ref={controlsRef}
        target={[0, 0.5, 0]}
        enablePan={false}
        enableZoom={true}
        enableRotate={false}
        minDistance={1.5}
        maxDistance={8}
      />
    </>
  );
}

// Body part selection button
interface BodyPartButtonProps {
  part: BodyPartConfig;
  isActive: boolean;
  onClick: () => void;
  label: string;
}

function BodyPartButton({ part, isActive, onClick, label }: BodyPartButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
        flex items-center gap-2 border-2 whitespace-nowrap
        ${isActive
          ? 'bg-[#3887A6] text-white border-[#3887A6] shadow-md'
          : 'bg-black/30 text-white/70 border-transparent hover:bg-black/40 hover:text-white'
        }
      `}
    >
      <span className="text-base">{part.icon}</span>
      {label}
    </button>
  );
}

export default function HumanBodyEnvironment({ }: Environment3DProps) {
  const t = useTranslations('Environment3D');
  const [bodyRotation, setBodyRotation] = useState(0);
  const [focusedPart, setFocusedPart] = useState('full');
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const handleReset = useCallback(() => {
    setBodyRotation(0);
    setFocusedPart('full');
  }, []);

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
    <Environment3DContainer title={t('environments.humanBody') || 'Human Body - Anatomy'} onReset={handleReset}>
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
            position: [0, 0.5, 5],
            fov: 50,
            near: 0.1,
            far: 100,
          }}
        >
          <color attach="background" args={['#1a1a2e']} />
          <fog attach="fog" args={['#1a1a2e', 8, 20]} />
          <Scene bodyRotation={bodyRotation} focusedPart={focusedPart} controlsRef={controlsRef} />
        </Canvas>

        {/* Body Parts Panel */}
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 space-y-2 shadow-xl border border-white/10">
            <div className="text-xs text-white/60 font-medium mb-2 px-1">
              {t('controls.bodyParts')}
            </div>
            <div className="flex flex-col gap-2">
              {BODY_PARTS.map(part => (
                <BodyPartButton
                  key={part.id}
                  part={part}
                  isActive={focusedPart === part.id}
                  onClick={() => setFocusedPart(part.id)}
                  label={t(`controls.${part.labelKey}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Environment3DContainer>
  );
}
