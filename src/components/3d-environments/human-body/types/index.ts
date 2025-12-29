import type { OrbitControls } from '@react-three/drei';

// Game modes available in the environment
export type GameMode = 'study' | 'challenge' | 'consultation' | 'scrivi';

// Hotspot type - point for specific location, area for body region
export type HotspotType = 'point' | 'area';

// Body parts configuration for camera focus
export interface BodyPartConfig {
  id: string;
  labelKey: string;
  label: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  icon: string;
  fov?: number; // Field of view (default: 50)
}

// Anatomy hotspot data structure
export interface AnatomyHotspot {
  id: string;
  position: [number, number, number];
  label: string;
  forms?: string; // Singular with article + plural, e.g., "(l'orecchio, le orecchie)"
  yMin: number;
  yMax: number;
  size?: number;
  audioUrl?: string;
  transcription?: string;
  type: HotspotType;
}

// Hotspot component props
export interface HotspotProps {
  position: [number, number, number];
  label: string;
  forms?: string;
  hotspotId: string;
  size?: number;
  audioUrl?: string;
  transcription?: string;
  volume?: number;
  isZoomedView?: boolean;
  isActiveFromMenu?: boolean;
  // Challenge mode props
  challengeMode?: boolean;
  showCorrectAnswer?: boolean;
  isScriviTarget?: boolean;
  isScriviMode?: boolean;
  hotspotType?: HotspotType;
  onHover?: (isHovered: boolean) => void;
  onAudioPlay?: () => void;
  onChallengeClick?: (hotspotId: string) => void;
}

// Instructions chalkboard props
export interface InstructionsChalkboardProps {
  gameMode?: GameMode;
}

// Human body 3D model props
export interface HumanBodyModelProps {
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

// Camera controller props
export interface CameraControllerProps {
  focusedPart: string;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

// Scene component props
export interface SceneProps {
  bodyRotation: number;
  focusedPart: string;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
  audioVolume: number;
  activeHotspotId: string | null;
  // Game mode props
  gameMode?: GameMode;
  challengeMode?: boolean;
  challengeTargetId?: string | null;
  showCorrectAnswer?: boolean;
  scriviTargetId?: string | null;
  isScriviMode?: boolean;
  onChallengeClick?: (hotspotId: string) => void;
}

// Body part selection button props
export interface BodyPartButtonProps {
  part: BodyPartConfig;
  isActive: boolean;
  onClick: () => void;
  label: string;
  hasExpander?: boolean;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

// Hotspot menu item props
export interface HotspotMenuItemProps {
  hotspot: { id: string; label: string };
  isPlaying: boolean;
  transcription: string;
  onPlay: () => void;
}

// Hotspot group item (for menu sections)
export interface HotspotGroupItem {
  id: string;
  label: string;
}
