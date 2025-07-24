// Types for Panda Video Player API v2

export interface PandaPlayerOptions {
  onReady?: () => void;
  onError?: (error: Error | unknown) => void;
  video_id?: string;
  library_id?: string;
  defaultStyle?: boolean;
  playerConfigs?: {
    autoplay?: boolean;
    muted?: boolean;
    saveProgress?: boolean;
    smartAutoplay?: boolean;
    startTime?: number;
    controls?: string;
    color?: string;
    controlsColor?: string;
  };
}

export interface PandaPlayerInstance {
  play(): void;
  pause(): void;
  togglePlay(): void;
  getCurrentTime(): number;
  getDuration(): number;
  setCurrentTime(time: number): void;
  setVolume(volume: number): void;
  getVolume(): number;
  isPaused(): boolean;
  isMuted(): boolean;
  isFullscreen(): boolean;
  toggleFullscreen(): void;
  setSpeed(speed: number): void;
  onEvent(callback: (event: PandaPlayerEvent) => void): void;
  destroy(): void;
}

export interface PandaPlayerEvent {
  message: PandaEventType;
  currentTime?: number;
  duration?: number;
  video?: string;
  speed?: number;
}

export type PandaEventType = 
  | 'panda_ready'
  | 'panda_play'
  | 'panda_pause'
  | 'panda_timeupdate'
  | 'panda_progress'
  | 'panda_seeking'
  | 'panda_seeked'
  | 'panda_ended'
  | 'panda_error'
  | 'panda_canplay'
  | 'panda_speed_update'
  | 'panda_enterfullscreen'
  | 'panda_exitfullscreen'
  | 'panda_loaded'
  | 'panda_loadeddata'
  | 'panda_allData'
  | 'play'
  | 'pause'
  | 'ready'
  | 'error';

export interface VideoProgress {
  currentTime: number;
  duration: number;
  percentage: number;
  watchedSegments?: Array<[number, number]>;
  completionRate?: number;
}

export interface VideoEngagement {
  plays: number;
  pauses: number;
  seeks: number;
  speed: number;
  fullscreenTime: number;
  totalWatchTime: number;
}

// Browser compatibility detection
export interface BrowserFeatures {
  hasPromises: boolean;
  hasPostMessage: boolean;
  hasIntersectionObserver: boolean;
  hasFullscreen: boolean;
  canAutoplay: boolean;
  supportsHLS: boolean;
  supportsMSE: boolean;
  hasWebGL: boolean;
}

// Player strategy for fallback system
export interface PlayerStrategy {
  priority: number;
  name: 'api-v2' | 'iframe-enhanced' | 'iframe-basic';
  check: () => boolean;
  features: string[];
}

// Extended component props
export interface PandaVideoPlayerProps {
  // Basic props (existing)
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  playerUrl?: string;
  
  // Enhanced props (new)
  lessonId?: string;
  onProgress?: (progress: VideoProgress) => void;
  onReady?: () => void;
  onError?: (error: Error | unknown) => void;
  onComplete?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  startTime?: number;
  autoplay?: boolean;
  muted?: boolean;
  saveProgress?: boolean;
  smartAutoplay?: boolean;
}

// Global window extension
declare global {
  interface Window {
    PandaPlayer?: new (elementId: string, options: PandaPlayerOptions) => PandaPlayerInstance;
    pandascripttag?: Array<() => void>;
  }
}