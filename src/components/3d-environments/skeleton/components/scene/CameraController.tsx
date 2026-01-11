'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { BONE_PARTS } from '../../data';

interface CameraControllerProps {
  focusedPart: string;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

export function CameraController({ focusedPart, controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0.5, 5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.5, 0));
  const targetFov = useRef(50);

  useEffect(() => {
    const part = BONE_PARTS.find(p => p.id === focusedPart);
    if (part) {
      targetPosition.current.set(...part.cameraPosition);
      targetLookAt.current.set(...part.cameraTarget);
      targetFov.current = part.fov || 50;
    }
  }, [focusedPart]);

  useFrame(() => {
    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, 0.05);

    // Smoothly interpolate FOV
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov += (targetFov.current - camera.fov) * 0.05;
      camera.updateProjectionMatrix();
    }

    // Update OrbitControls target
    if (controlsRef.current) {
      const controls = controlsRef.current;
      controls.target.lerp(targetLookAt.current, 0.05);
      controls.update();
    }
  });

  return null;
}
