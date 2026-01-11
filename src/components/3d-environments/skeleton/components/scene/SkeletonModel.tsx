'use client';

import { useState, useCallback, useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { BONE_HOTSPOTS } from '../../data';
import { Hotspot, SharedGeometriesProvider } from '../../../human-body/components/hotspot';

// Map bone hotspot types to human-body hotspot types
const mapHotspotType = (type: 'bone' | 'joint' | 'region'): 'point' | 'area' => {
  return type === 'region' ? 'area' : 'point';
};

// Skeleton mesh names to show (everything else will be hidden)
const SKELETON_MESHES = [
  // Skull and Head
  'skull',
  'jaw_bone',
  'upper_teeth',
  'lover_teeth',
  'hyoid_bone',
  'hyoid_bone_skeletal',

  // Spine
  'cervical_spine',
  'thoracic_spine',
  'lumbar_spine',
  'sacrum',
  'coccyx',
  'intervertebral_disks',

  // Thorax
  'thorax',
  'sternum',
  'costal_cartilage',

  // Pelvis
  'ilium',
  'pubic_symphysis',

  // Left Upper Limb
  'L_clavicle',
  'L_scapula',
  'L_humerus',
  'L_radius',
  'L_ulna',
  'L_wrist',
  'L_metacarpal_bones',
  'L_finger_bones',

  // Right Upper Limb
  'R_clavicle',
  'R_scapula',
  'R_humerus',
  'R_radius',
  'R_ulna',
  'R_wrist',
  'R_metacarpal_bones',
  'R_finger_bones',

  // Left Lower Limb
  'L_femur',
  'L_patella',
  'L_tibia',
  'L_fibula',
  'L_talus',
  'L_calcaneum',
  'L_tarsal_bones',
  'L_metatarsal_bones',
  'L_phalanges',

  // Right Lower Limb
  'R_femur',
  'R_patella',
  'R_tibia',
  'R_fibula',
  'R_talus',
  'R_calcaneum',
  'R_tarsal_bones',
  'R_metatarsal_bones',
  'R_phalanges',
];

// Model path - using optimized skeleton-only model
const MODEL_PATH =
  process.env.NODE_ENV === 'production'
    ? '/public/models/skeleton/skeleton-bones.glb'
    : '/models/skeleton/skeleton-bones.glb';

interface SkeletonModelProps {
  rotation: number;
  audioVolume: number;
  focusedPart: string;
  activeHotspotId: string | null;
  challengeMode?: boolean;
  challengeTargetId?: string | null;
  showCorrectAnswer?: boolean;
  scriviTargetId?: string | null;
  isScriviMode?: boolean;
  onChallengeClick?: (hotspotId: string) => void;
}

function SkeletonModelComponent({
  rotation,
  audioVolume,
  focusedPart,
  activeHotspotId,
  challengeMode = false,
  challengeTargetId = null,
  showCorrectAnswer = false,
  scriviTargetId = null,
  isScriviMode = false,
  onChallengeClick,
}: SkeletonModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const originalMaterials = useRef<Map<string, THREE.Material>>(new Map());

  // Clone the scene and filter to show only skeleton meshes
  const { clonedScene, meshBoundingData } = useMemo(() => {
    const clone = scene.clone();
    meshRefs.current.clear();
    originalMaterials.current.clear();

    const boundingData = new Map<string, { centerY: number }>();

    clone.traverse(child => {
      if (child instanceof THREE.Mesh) {
        // Check if this mesh is part of the skeleton
        const isSkeletonMesh = SKELETON_MESHES.includes(child.name);

        // Hide non-skeleton meshes
        child.visible = isSkeletonMesh;

        if (isSkeletonMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          // Apply bone-like material
          if (child.material) {
            const boneMaterial = new THREE.MeshStandardMaterial({
              color: '#f5f5dc', // Bone white/ivory color
              roughness: 0.6,
              metalness: 0.1,
            });
            child.material = boneMaterial;
            originalMaterials.current.set(child.uuid, boneMaterial.clone());
          }

          meshRefs.current.set(child.uuid, child);

          // Pre-calculate bounding box center
          const bbox = new THREE.Box3().setFromObject(child);
          const center = new THREE.Vector3();
          bbox.getCenter(center);
          boundingData.set(child.uuid, { centerY: center.y });
        }
      }
    });

    return { clonedScene: clone, meshBoundingData: boundingData };
  }, [scene]);

  // Model settings
  const modelSettings = useMemo(
    () => ({ scale: 0.012, baseY: -1.0, rotationOffset: 0 }),
    []
  );

  // Single combined useFrame hook for rotation and highlighting
  useFrame(() => {
    // Update rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation + modelSettings.rotationOffset;
    }

    // Update mesh materials based on hover state
    if (!hoveredHotspot) {
      // Reset all materials to original
      meshRefs.current.forEach(mesh => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.emissiveIntensity !== 0) {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
      return;
    }

    // Find the hovered hotspot data
    const hotspot = BONE_HOTSPOTS.find(h => h.id === hoveredHotspot);
    if (!hotspot) return;

    // Highlight meshes in the Y range
    meshRefs.current.forEach((mesh, uuid) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const boundingData = meshBoundingData.get(uuid);

      if (!boundingData) return;

      const { centerY } = boundingData;

      if (hotspot.yMin !== undefined && hotspot.yMax !== undefined && centerY >= hotspot.yMin && centerY <= hotspot.yMax) {
        // Highlight this mesh
        mat.emissive.setHex(0x3887a6);
        mat.emissiveIntensity = 0.3;
      } else {
        // Reset only if currently highlighted
        if (mat.emissiveIntensity !== 0) {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    });
  });

  const handleHotspotHover = useCallback((hotspotId: string, isHovered: boolean) => {
    setHoveredHotspot(isHovered ? hotspotId : null);
  }, []);

  return (
    <group ref={groupRef} position={[0, modelSettings.baseY, 0]} scale={modelSettings.scale}>
      <primitive object={clonedScene} />

      {/* Bone hotspots with shared geometries */}
      <SharedGeometriesProvider>
        {BONE_HOTSPOTS.map(hotspot => (
          <Hotspot
            key={hotspot.id}
            hotspotId={hotspot.id}
            position={hotspot.position}
            label={hotspot.label}
            forms={hotspot.forms}
            size={hotspot.size}
            audioUrl={hotspot.audioUrl}
            transcription={hotspot.transcription}
            volume={audioVolume}
            isZoomedView={focusedPart !== 'full'}
            isActiveFromMenu={activeHotspotId === hotspot.id}
            challengeMode={challengeMode}
            showCorrectAnswer={showCorrectAnswer && challengeTargetId === hotspot.id}
            isScriviTarget={scriviTargetId === hotspot.id}
            isScriviMode={isScriviMode}
            hotspotType={mapHotspotType(hotspot.type)}
            onHover={isHovered => handleHotspotHover(hotspot.id, isHovered)}
            onChallengeClick={onChallengeClick}
          />
        ))}
      </SharedGeometriesProvider>
    </group>
  );
}

// Wrap with React.memo for referential equality optimization
export const SkeletonModel = memo(SkeletonModelComponent);

// Preload model
useGLTF.preload(MODEL_PATH);
