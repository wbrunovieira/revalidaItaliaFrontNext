import type { BodyPartConfig } from '../types';

// Body parts configuration for camera focus and navigation
export const BODY_PARTS: BodyPartConfig[] = [
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
    labelKey: 'bodyFull',
    label: 'Corpo intero',
    cameraPosition: [0, 0.5, 5],
    cameraTarget: [0, 0.5, 0],
    icon: '👤',
  },
  {
    id: 'head',
    labelKey: 'head',
    label: 'Testa',
    cameraPosition: [0, 1.1, 0.3],
    cameraTarget: [0, 1.2, -0.5],
    icon: '🧠',
  },
  {
    id: 'torso',
    labelKey: 'torso',
    label: 'Torso',
    cameraPosition: [0, 0.3, 1.5],
    cameraTarget: [0, 0.3, -1.5],
    icon: '🫁',
  },
  {
    id: 'legs',
    labelKey: 'legs',
    label: 'Gambe',
    cameraPosition: [0, -0.5, 1.5],
    cameraTarget: [0, -0.5, 0],
    icon: '🦵',
  },
  {
    id: 'hand',
    labelKey: 'hand',
    label: 'Mano',
    cameraPosition: [0.5, 0.1, 0.7],
    cameraTarget: [0.7, 0, -2.2],
    icon: '✋',
  },
];
