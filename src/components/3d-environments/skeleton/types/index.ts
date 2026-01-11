// Types for skeleton 3D environment

export interface BonePartConfig {
  id: string;
  labelKey: string;
  label: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  icon: string;
  fov?: number;
}

export interface BoneHotspot {
  id: string;
  position: [number, number, number];
  label: string;
  forms: string;
  latinName?: string;
  yMin?: number;
  yMax?: number;
  size: number;
  audioUrl?: string;
  transcription?: string;
  type: 'bone' | 'joint' | 'region';
}

export interface BoneGroup {
  id: string;
  label: string;
  bones: string[];
}

export type GameMode = 'study' | 'challenge' | 'scrivi' | 'consultation';
