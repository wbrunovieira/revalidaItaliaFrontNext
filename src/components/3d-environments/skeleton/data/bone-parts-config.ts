import type { BonePartConfig } from '../types';

// Bone parts configuration for camera focus and navigation
export const BONE_PARTS: BonePartConfig[] = [
  {
    id: 'rules',
    labelKey: 'rules',
    label: 'Regole',
    cameraPosition: [-2, 2.5, -2],
    cameraTarget: [-2, 2.5, -4.9],
    icon: '📋',
    fov: 70,
  },
  {
    id: 'full',
    labelKey: 'skeletonFull',
    label: 'Scheletro intero',
    cameraPosition: [0, 0.5, 5],
    cameraTarget: [0, 0.5, 0],
    icon: '💀',
  },
  {
    id: 'skull',
    labelKey: 'skull',
    label: 'Cranio',
    cameraPosition: [0, 1.1, 0.3],
    cameraTarget: [0, 1.2, -0.5],
    icon: '🦴',
  },
  {
    id: 'spine',
    labelKey: 'spine',
    label: 'Colonna',
    cameraPosition: [0.5, 0.3, 1.5],
    cameraTarget: [0, 0.3, -1.5],
    icon: '🦴',
  },
  {
    id: 'ribcage',
    labelKey: 'ribcage',
    label: 'Gabbia toracica',
    cameraPosition: [0, 0.5, 1.2],
    cameraTarget: [0, 0.5, 0],
    icon: '🦴',
  },
  {
    id: 'pelvis',
    labelKey: 'pelvis',
    label: 'Bacino',
    cameraPosition: [0, -0.2, 1.5],
    cameraTarget: [0, -0.2, 0],
    icon: '🦴',
  },
  {
    id: 'limbs',
    labelKey: 'limbs',
    label: 'Arti',
    cameraPosition: [0.6, -0.3, 1.8],
    cameraTarget: [0, -0.2, 0],
    icon: '🦴',
  },
];
