'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { ANATOMY_HOTSPOTS, MODEL_PATH } from '../../data';
import { Hotspot } from '../hotspot';

interface HumanBodyModelProps {
  rotation: number;
  audioVolume: number;
  focusedPart: string;
  activeHotspotId: string | null;
  // Challenge mode props
  challengeMode?: boolean;
  challengeTargetId?: string | null;
  showCorrectAnswer?: boolean;
  scriviTargetId?: string | null;
  isScriviMode?: boolean;
  onChallengeClick?: (hotspotId: string) => void;
}

export function HumanBodyModel({
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
}: HumanBodyModelProps) {
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
  const modelSettings = { scale: 0.012, baseY: -1.0, rotationOffset: 0 };

  // Horizontal rotation only (floating animation removed)
  useFrame(() => {
    if (groupRef.current) {
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
          hotspotType={hotspot.type}
          onHover={isHovered => handleHotspotHover(hotspot.id, isHovered)}
          onChallengeClick={onChallengeClick}
        />
      ))}
    </group>
  );
}

// Preload model
useGLTF.preload(MODEL_PATH);
