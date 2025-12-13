'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, RoundedBox, useGLTF, Html, Text } from '@react-three/drei';
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

// Human body 3D model (single model with system visibility)
// In production, Nginx proxies /public/ to S3; in dev, Next.js serves from public/ at root
const MODEL_PATH = process.env.NODE_ENV === 'production'
  ? '/public/models/human-body/anatomy-internal.glb'
  : '/models/human-body/anatomy-internal.glb';

// Anatomical systems visibility state
interface AnatomySystemsVisibility {
  skin: boolean;
  muscles: boolean;
  skeleton: boolean;
  organs: boolean;
  circulatory: boolean;
  nervous: boolean;
}

// Mesh names for each anatomical system
const SKIN_MESHES = ['body', 'eyes', 'eyebrows', 'eyelashes'];

const SKELETON_MESHES = [
  'skull', 'jaw_bone', 'upper_teeth', 'lover_teeth', 'hyoid_bone', 'hyoid_bone_skeletal',
  'cervical_spine', 'thoracic_spine', 'lumbar_spine', 'sacrum', 'coccyx', 'intervertebral_disks',
  'thorax', 'sternum', 'costal_cartilage', 'ilium', 'pubic_symphysis',
  'l_clavicle', 'l_scapula', 'l_humerus', 'l_radius', 'l_ulna', 'l_wrist', 'l_metacarpal_bones', 'l_finger_bones',
  'r_clavicle', 'r_scapula', 'r_humerus', 'r_radius', 'r_ulna', 'r_wrist', 'r_metacarpal_bones', 'r_finger_bones',
  'l_femur', 'l_patella', 'l_tibia', 'l_fibula', 'l_talus', 'l_calcaneum', 'l_tarsal_bones', 'l_metatarsal_bones', 'l_phalanges',
  'r_femur', 'r_patella', 'r_tibia', 'r_fibula', 'r_talus', 'r_calcaneum', 'r_tarsal_bones', 'r_metatarsal_bones', 'r_phalanges',
];

const ORGAN_MESHES = [
  'brain', 'esophagus', 'stomach', 'small_intestine', 'colon', 'appendix',
  'liver_right', 'liver_left', 'gallbladder', 'hepatic_duct', 'pancreas', 'spleen',
  'pharynx', 'lungs', 'bronch',
  'kidneys', 'ureter', 'bladder', 'urethra', 'adrenal_glands',
  'testis', 'epididymis', 'vas_deferens', 'seminal_vesicle', 'prostate',
  'corpus_cavernosum', 'corpus_spongiosum', 'glans_penis',
  'thyroid', 'thyroid_cartilage', 'cricoid_cartilage', 'arytenoid_cartilage',
  'corniculate_cartilage', 'thyrohyoid_membrane',
];

const CIRCULATORY_MESHES = ['heart', 'vessels_red', 'vessels_blue'];

const NERVOUS_MESHES = ['nerves'];

// Function to check if mesh belongs to a system
function getMeshSystem(meshName: string): keyof AnatomySystemsVisibility | 'muscle' | null {
  const name = meshName.toLowerCase();

  if (SKIN_MESHES.includes(name)) return 'skin';
  if (SKELETON_MESHES.includes(name)) return 'skeleton';
  if (ORGAN_MESHES.includes(name)) return 'organs';
  if (CIRCULATORY_MESHES.includes(name)) return 'circulatory';
  if (NERVOUS_MESHES.includes(name)) return 'nervous';

  // Check if it's a muscle (most meshes with prefixes are muscles)
  if (name.startsWith('l_') || name.startsWith('r_') ||
      name.includes('muscle') || name.includes('_head') ||
      name.includes('oblique') || name.includes('abdominis') ||
      name.includes('spinalis') || name.includes('levator') ||
      name.includes('orbicularis') || name.includes('frontalis') ||
      name.includes('nasalis') || name.includes('coccygeus') ||
      name.includes('pubococcygeus') || name === 'polysurface1') {
    // But exclude skeleton meshes that also start with l_/r_
    if (!SKELETON_MESHES.includes(name)) {
      return 'muscle';
    }
  }

  return null;
}

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
  systemsVisibility: AnatomySystemsVisibility;
}

function HumanBodyModel({ rotation, systemsVisibility }: HumanBodyModelProps) {
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

  // Update visibility based on systems visibility
  const systemsRef = useRef(systemsVisibility);
  systemsRef.current = systemsVisibility;

  useFrame(() => {
    // Traverse cloned scene directly to update visibility
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const system = getMeshSystem(child.name);

        if (system === 'skin') {
          child.visible = systemsRef.current.skin;
        } else if (system === 'muscle') {
          child.visible = systemsRef.current.muscles;
        } else if (system === 'skeleton') {
          child.visible = systemsRef.current.skeleton;
        } else if (system === 'organs') {
          child.visible = systemsRef.current.organs;
        } else if (system === 'circulatory') {
          child.visible = systemsRef.current.circulatory;
        } else if (system === 'nervous') {
          child.visible = systemsRef.current.nervous;
        }
      }
    });
  });

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

      {/* Anatomy hotspots - only show when skin is visible */}
      {systemsVisibility.skin && ANATOMY_HOTSPOTS.map(hotspot => (
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

// Scene component with all 3D elements
interface SceneProps {
  bodyRotation: number;
  systemsVisibility: AnatomySystemsVisibility;
}

function Scene({ bodyRotation, systemsVisibility }: SceneProps) {
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
      <HumanBodyModel rotation={bodyRotation} systemsVisibility={systemsVisibility} />

      {/* Environment for subtle reflections */}
      <Environment preset="apartment" />

      {/* Zoom only controls - no rotation */}
      <OrbitControls
        target={[0, 0.5, 0]}
        enablePan={false}
        enableZoom={true}
        enableRotate={false}
        minDistance={2}
        maxDistance={8}
      />
    </>
  );
}

// Default visibility state - skin visible, others hidden
const DEFAULT_SYSTEMS_VISIBILITY: AnatomySystemsVisibility = {
  skin: true,
  muscles: false,
  skeleton: false,
  organs: false,
  circulatory: false,
  nervous: false,
};

// System toggle button component
interface SystemToggleProps {
  systemKey: keyof AnatomySystemsVisibility;
  label: string;
  isActive: boolean;
  onToggle: () => void;
  color: string;
}

function SystemToggle({ label, isActive, onToggle, color }: SystemToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
        flex items-center gap-2 border-2
        ${isActive
          ? 'text-white shadow-md'
          : 'bg-black/30 text-white/70 border-transparent hover:bg-black/40 hover:text-white'
        }
      `}
      style={isActive ? { backgroundColor: color, borderColor: color } : {}}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full transition-all ${isActive ? 'bg-white' : 'bg-white/40'}`}
      />
      {label}
    </button>
  );
}

export default function HumanBodyEnvironment({ }: Environment3DProps) {
  const t = useTranslations('Environment3D');
  const [bodyRotation, setBodyRotation] = useState(0);
  const [systemsVisibility, setSystemsVisibility] = useState<AnatomySystemsVisibility>(DEFAULT_SYSTEMS_VISIBILITY);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const toggleSystem = useCallback((system: keyof AnatomySystemsVisibility) => {
    setSystemsVisibility(prev => ({
      ...prev,
      [system]: !prev[system],
    }));
  }, []);

  const handleReset = useCallback(() => {
    setBodyRotation(0);
    setSystemsVisibility(DEFAULT_SYSTEMS_VISIBILITY);
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
          <Scene bodyRotation={bodyRotation} systemsVisibility={systemsVisibility} />
        </Canvas>

        {/* Anatomy Systems Panel */}
        <div className="absolute top-4 right-4 z-20">
          {/* Toggle panel button */}
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="mb-2 w-full px-3 py-2 rounded-lg bg-[#0C3559] hover:bg-[#0a2a47] text-white font-medium text-sm transition-all flex items-center justify-between gap-2 shadow-lg"
          >
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              {t('controls.anatomySystems')}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${isPanelOpen ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Systems toggles */}
          {isPanelOpen && (
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 space-y-2 shadow-xl border border-white/10 min-w-[140px]">
              <SystemToggle
                systemKey="skin"
                label={t('controls.skin')}
                isActive={systemsVisibility.skin}
                onToggle={() => toggleSystem('skin')}
                color="#f4a460"
              />
              <SystemToggle
                systemKey="muscles"
                label={t('controls.muscles')}
                isActive={systemsVisibility.muscles}
                onToggle={() => toggleSystem('muscles')}
                color="#dc3545"
              />
              <SystemToggle
                systemKey="skeleton"
                label={t('controls.skeleton')}
                isActive={systemsVisibility.skeleton}
                onToggle={() => toggleSystem('skeleton')}
                color="#f8f9fa"
              />
              <SystemToggle
                systemKey="organs"
                label={t('controls.organs')}
                isActive={systemsVisibility.organs}
                onToggle={() => toggleSystem('organs')}
                color="#9b59b6"
              />
              <SystemToggle
                systemKey="circulatory"
                label={t('controls.circulatory')}
                isActive={systemsVisibility.circulatory}
                onToggle={() => toggleSystem('circulatory')}
                color="#e74c3c"
              />
              <SystemToggle
                systemKey="nervous"
                label={t('controls.nervous')}
                isActive={systemsVisibility.nervous}
                onToggle={() => toggleSystem('nervous')}
                color="#f1c40f"
              />
            </div>
          )}
        </div>
      </div>
    </Environment3DContainer>
  );
}
