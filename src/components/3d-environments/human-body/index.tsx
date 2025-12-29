'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Environment3DProps } from '../registry';
import Environment3DContainer, { useFullscreen } from '../Environment3DContainer';

// Import types
import type { BodyPartConfig } from './types';

// Import data from extracted modules
import {
  BODY_PARTS,
  ANATOMY_HOTSPOTS,
  MODEL_PATH,
  HEAD_HOTSPOTS,
  TORSO_HOTSPOTS,
  LEGS_HOTSPOTS,
  HAND_HOTSPOTS,
} from './data';

// Import room components
import {
  HospitalFloor,
  HospitalWalls,
  HospitalCeiling,
  CeilingLights,
  HospitalWindow,
} from './components/room';

// Import decoration components
import {
  InstructionsChalkboard,
  HotspotLegend,
  AnatomyPoster,
  WallText,
} from './components/decorations';

// Import hotspot component
import { Hotspot } from './components/hotspot';


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

function HumanBodyModel({
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

// Camera controller for smooth transitions
interface CameraControllerProps {
  focusedPart: string;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}

function CameraController({ focusedPart, controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0.5, 5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.5, 0));
  const targetFov = useRef(50);

  useEffect(() => {
    const part = BODY_PARTS.find(p => p.id === focusedPart);
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

// Scene component with all 3D elements
interface SceneProps {
  bodyRotation: number;
  focusedPart: string;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
  audioVolume: number;
  activeHotspotId: string | null;
  // Game mode props
  gameMode?: 'study' | 'challenge' | 'consultation' | 'scrivi';
  challengeMode?: boolean;
  challengeTargetId?: string | null;
  showCorrectAnswer?: boolean;
  scriviTargetId?: string | null;
  isScriviMode?: boolean;
  onChallengeClick?: (hotspotId: string) => void;
}

function Scene({
  bodyRotation,
  focusedPart,
  controlsRef,
  audioVolume,
  activeHotspotId,
  gameMode = 'study',
  challengeMode = false,
  challengeTargetId = null,
  showCorrectAnswer = false,
  scriviTargetId = null,
  isScriviMode = false,
  onChallengeClick,
}: SceneProps) {
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
      <HotspotLegend />
      <InstructionsChalkboard gameMode={gameMode} />
      <CeilingLights />

      {/* Human body model (rotates horizontally) */}
      <HumanBodyModel
        rotation={bodyRotation}
        audioVolume={audioVolume}
        focusedPart={focusedPart}
        activeHotspotId={activeHotspotId}
        challengeMode={challengeMode}
        challengeTargetId={challengeTargetId}
        showCorrectAnswer={showCorrectAnswer}
        scriviTargetId={scriviTargetId}
        isScriviMode={isScriviMode}
        onChallengeClick={onChallengeClick}
      />

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
  hasExpander?: boolean;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

function BodyPartButton({
  part,
  isActive,
  onClick,
  label,
  hasExpander,
  isExpanded,
  onExpandToggle,
}: BodyPartButtonProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onClick}
        className={`
          flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
          flex items-center gap-2 border-2 whitespace-nowrap
          ${
            isActive
              ? 'bg-[#3887A6] text-white border-[#3887A6] shadow-md'
              : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
          }
        `}
      >
        <span className="text-base">{part.icon}</span>
        {label}
      </button>
      {hasExpander && (
        <button
          onClick={e => {
            e.stopPropagation();
            onExpandToggle?.();
          }}
          className={`
            p-2 rounded-lg transition-all duration-300 border-2
            ${
              isExpanded
                ? 'bg-[#3887A6] text-white border-[#3887A6]'
                : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
            }
          `}
          title={isExpanded ? 'Chiudi dettagli' : 'Mostra dettagli'}
        >
          <svg
            className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Hotspot menu item
interface HotspotMenuItemProps {
  hotspot: { id: string; label: string };
  isPlaying: boolean;
  transcription: string;
  onPlay: () => void;
}

function HotspotMenuItem({ hotspot, isPlaying, transcription, onPlay }: HotspotMenuItemProps) {
  return (
    <button
      onClick={onPlay}
      className={`
        w-full px-2 py-1.5 rounded-md text-xs transition-all duration-200
        flex items-center gap-2 text-left
        ${isPlaying ? 'bg-[#2E7D32] text-white' : 'bg-[#0a2a47] text-white/80 hover:bg-[#1a3a55] hover:text-white'}
      `}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium">{hotspot.label}</div>
        {isPlaying && <div className="text-[10px] opacity-80 truncate italic mt-0.5">{transcription}</div>}
      </div>
      {isPlaying && (
        <div className="flex gap-0.5 items-end h-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="w-0.5 bg-white rounded-sm"
              style={{
                animation: 'soundBar 0.5s ease-in-out infinite alternate',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}

// Fullscreen button component that uses the context
function FullscreenButton({ compact = false }: { compact?: boolean }) {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  if (compact) {
    return (
      <button
        onClick={toggleFullscreen}
        className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
          isFullscreen
            ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
            : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
        }`}
        title={isFullscreen ? 'Esci Schermo Intero' : 'Schermo Intero'}
      >
        <span className="text-lg">{isFullscreen ? '🔲' : '⛶'}</span>
        <span className="text-[10px] font-medium whitespace-nowrap">{isFullscreen ? 'Esci' : 'Full'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleFullscreen}
      className="w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 border-2 whitespace-nowrap bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white"
    >
      <span className="text-base">{isFullscreen ? '🔲' : '⛶'}</span>
      {isFullscreen ? 'Esci Schermo Intero' : 'Schermo Intero'}
    </button>
  );
}

export default function HumanBodyEnvironment({}: Environment3DProps) {
  const [bodyRotation, setBodyRotation] = useState(0);
  const [focusedPart, setFocusedPart] = useState('full');
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [headExpanded, setHeadExpanded] = useState(false);
  const [torsoExpanded, setTorsoExpanded] = useState(false);
  const [legsExpanded, setLegsExpanded] = useState(false);
  const [handExpanded, setHandExpanded] = useState(false);
  const [playingHotspotId, setPlayingHotspotId] = useState<string | null>(null);

  // Challenge mode state
  const [gameMode, setGameMode] = useState<'study' | 'challenge' | 'consultation' | 'scrivi'>('study');
  const [isModeMenuExpanded, setIsModeMenuExpanded] = useState(true);
  const [challengeState, setChallengeState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [completedHotspots, setCompletedHotspots] = useState<string[]>([]);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  // Consultation mode state
  const CONSULTATION_ROUNDS = 10;
  const [consultationState, setConsultationState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [consultationRound, setConsultationRound] = useState(0);
  const [consultationScore, setConsultationScore] = useState(0);
  const [consultationTargetId, setConsultationTargetId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [usedConsultationHotspots, setUsedConsultationHotspots] = useState<string[]>([]);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const consultationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Scrivi mode state
  const SCRIVI_ROUNDS = 10;
  const [scriviState, setScriviState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [scriviRound, setScriviRound] = useState(0);
  const [scriviScore, setScriviScore] = useState(0);
  const [scriviTargetId, setScriviTargetId] = useState<string | null>(null);
  const [scriviInput, setScriviInput] = useState('');
  const [usedScriviHotspots, setUsedScriviHotspots] = useState<string[]>([]);
  const [scriviAnswerFeedback, setScriviAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);
  const scriviInputRef = useRef<HTMLInputElement | null>(null);

  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const menuAudioRef = useRef<HTMLAudioElement | null>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  // Get random hotspot from remaining ones
  const getNextRandomTarget = useCallback((completed: string[]) => {
    const remaining = ANATOMY_HOTSPOTS.filter(h => !completed.includes(h.id));
    if (remaining.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * remaining.length);
    return remaining[randomIndex].id;
  }, []);

  // Start challenge
  const startChallenge = useCallback(() => {
    setGameMode('challenge');
    setChallengeState('playing');
    setScore(0);
    setCompletedHotspots([]);
    setShowCorrectAnswer(false);
    setStartTime(Date.now());
    setEndTime(null);
    setFocusedPart('full');
    // Get first random target
    const firstTarget = getNextRandomTarget([]);
    setCurrentTargetId(firstTarget);
  }, [getNextRandomTarget]);

  // Handle challenge click
  const handleChallengeClick = useCallback(
    (clickedId: string) => {
      if (challengeState !== 'playing' || !currentTargetId) return;

      if (clickedId === currentTargetId) {
        // Correct!
        const newCompleted = [...completedHotspots, currentTargetId];
        setCompletedHotspots(newCompleted);
        setScore(prev => prev + 1);

        // Check if all completed
        if (newCompleted.length === ANATOMY_HOTSPOTS.length) {
          setChallengeState('won');
          setEndTime(Date.now());
          setCurrentTargetId(null);
        } else {
          // Get next target
          const nextTarget = getNextRandomTarget(newCompleted);
          setCurrentTargetId(nextTarget);
        }
      } else {
        // Wrong! Show correct answer and reset
        setShowCorrectAnswer(true);
        setChallengeState('lost');

        // After 2 seconds, show the lost state
        setTimeout(() => {
          setShowCorrectAnswer(false);
        }, 2000);
      }
    },
    [challengeState, currentTargetId, completedHotspots, getNextRandomTarget]
  );

  // Restart challenge after losing
  const restartChallenge = useCallback(() => {
    startChallenge();
  }, [startChallenge]);

  // Exit challenge mode
  const exitChallenge = useCallback(() => {
    setGameMode('study');
    setChallengeState('idle');
    setCurrentTargetId(null);
    setScore(0);
    setCompletedHotspots([]);
    setShowCorrectAnswer(false);
    setStartTime(null);
    setEndTime(null);
  }, []);

  // Get random hotspot for consultation (avoiding repeats)
  const getRandomConsultationTarget = useCallback((used: string[]) => {
    const available = ANATOMY_HOTSPOTS.filter(h => !used.includes(h.id) && h.audioUrl);
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex].id;
  }, []);

  // Play consultation audio
  const playConsultationAudio = useCallback(
    (hotspotId: string) => {
      const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === hotspotId);
      if (!hotspot?.audioUrl) return;

      // Stop any currently playing audio
      if (consultationAudioRef.current) {
        consultationAudioRef.current.pause();
        consultationAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(hotspot.audioUrl);
      audio.volume = audioVolume;
      consultationAudioRef.current = audio;

      audio.onplay = () => setIsAudioPlaying(true);
      audio.onended = () => setIsAudioPlaying(false);
      audio.onerror = () => setIsAudioPlaying(false);

      audio.play().catch(() => setIsAudioPlaying(false));
    },
    [audioVolume]
  );

  // Start consultation mode
  const startConsultation = useCallback(() => {
    setGameMode('consultation');
    setConsultationState('playing');
    setConsultationRound(1);
    setConsultationScore(0);
    setUsedConsultationHotspots([]);
    setFocusedPart('full');

    // Get first random target
    const firstTarget = getRandomConsultationTarget([]);
    setConsultationTargetId(firstTarget);

    // Play audio after a short delay
    if (firstTarget) {
      setTimeout(() => playConsultationAudio(firstTarget), 500);
    }
  }, [getRandomConsultationTarget, playConsultationAudio]);

  // Handle consultation click
  const handleConsultationClick = useCallback(
    (clickedId: string) => {
      if (consultationState !== 'playing' || !consultationTargetId) return;

      const isCorrect = clickedId === consultationTargetId;

      // Set feedback
      setLastAnswerCorrect(isCorrect);

      if (isCorrect) {
        setConsultationScore(prev => prev + 1);
      }

      // Show correct answer briefly
      setShowCorrectAnswer(true);
      setTimeout(() => {
        setShowCorrectAnswer(false);
        setLastAnswerCorrect(null);
      }, 1500);

      // Move to next round or finish
      const newUsed = [...usedConsultationHotspots, consultationTargetId];
      setUsedConsultationHotspots(newUsed);

      if (consultationRound >= CONSULTATION_ROUNDS) {
        // Finished all rounds
        setTimeout(() => {
          setConsultationState('finished');
          setConsultationTargetId(null);
        }, 1500);
      } else {
        // Next round
        setTimeout(() => {
          const nextTarget = getRandomConsultationTarget(newUsed);
          setConsultationTargetId(nextTarget);
          setConsultationRound(prev => prev + 1);

          if (nextTarget) {
            setTimeout(() => playConsultationAudio(nextTarget), 300);
          }
        }, 1500);
      }
    },
    [
      consultationState,
      consultationTargetId,
      consultationRound,
      usedConsultationHotspots,
      getRandomConsultationTarget,
      playConsultationAudio,
    ]
  );

  // Replay consultation audio
  const replayConsultationAudio = useCallback(() => {
    if (consultationTargetId) {
      playConsultationAudio(consultationTargetId);
    }
  }, [consultationTargetId, playConsultationAudio]);

  // Exit consultation mode
  const exitConsultation = useCallback(() => {
    if (consultationAudioRef.current) {
      consultationAudioRef.current.pause();
      consultationAudioRef.current = null;
    }
    setGameMode('study');
    setConsultationState('idle');
    setConsultationRound(0);
    setConsultationScore(0);
    setConsultationTargetId(null);
    setUsedConsultationHotspots([]);
    setIsAudioPlaying(false);
  }, []);

  // Get consultation diagnosis based on score
  const getConsultationDiagnosis = useCallback(() => {
    const percentage = (consultationScore / CONSULTATION_ROUNDS) * 100;
    if (percentage === 100)
      return { emoji: '🏆', title: 'Medico Esperto!', message: 'Perfetto! Hai identificato tutte le parti!' };
    if (percentage >= 80) return { emoji: '🌟', title: 'Ottimo lavoro!', message: 'Sei quasi un esperto!' };
    if (percentage >= 60) return { emoji: '👍', title: 'Buon lavoro!', message: 'Continua a studiare!' };
    if (percentage >= 40)
      return { emoji: '📚', title: 'Devi studiare!', message: 'Torna al modo studio per migliorare.' };
    return { emoji: '💪', title: 'Non mollare!', message: 'La pratica rende perfetti!' };
  }, [consultationScore]);

  // Get random hotspot for scrivi (avoiding repeats)
  const getRandomScriviTarget = useCallback((used: string[]) => {
    const available = ANATOMY_HOTSPOTS.filter(h => !used.includes(h.id));
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex].id;
  }, []);

  // Get camera position for a hotspot (for auto-zoom in scrivi mode)
  const getHotspotCameraPosition = useCallback((hotspotId: string) => {
    const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === hotspotId);
    if (!hotspot) return null;

    const xPos = hotspot.position[0]; // X position (lateral)
    const yPos = hotspot.position[1]; // Y position (vertical in cm)

    // Hand hotspots have x > 25 (lateral position)
    if (Math.abs(xPos) > 25) {
      return BODY_PARTS.find(p => p.id === 'hand');
    }
    // Head: y > 155 (testa, fronte, naso, bocca, occhio, etc.)
    if (yPos > 155) {
      return BODY_PARTS.find(p => p.id === 'head');
    }
    // Torso: y > 80 (spalla, schiena, petto, addome, lombare, etc.)
    if (yPos > 80) {
      return BODY_PARTS.find(p => p.id === 'torso');
    }
    // Legs: y <= 80 (coscia, ginocchio, gamba, piede, etc.)
    return BODY_PARTS.find(p => p.id === 'legs');
  }, []);

  // Start scrivi mode
  const startScrivi = useCallback(() => {
    setGameMode('scrivi');
    setScriviState('playing');
    setScriviRound(1);
    setScriviScore(0);
    setScriviInput('');
    setUsedScriviHotspots([]);
    setScriviAnswerFeedback(null);

    // Get first random target
    const firstTarget = getRandomScriviTarget([]);
    setScriviTargetId(firstTarget);

    // Auto-zoom to the body part
    if (firstTarget) {
      const cameraConfig = getHotspotCameraPosition(firstTarget);
      if (cameraConfig) {
        setFocusedPart(cameraConfig.id);
      }
    }

    // Focus input after a short delay
    setTimeout(() => {
      scriviInputRef.current?.focus();
    }, 500);
  }, [getRandomScriviTarget, getHotspotCameraPosition]);

  // Handle scrivi input submission
  const handleScriviSubmit = useCallback(() => {
    if (scriviState !== 'playing' || !scriviTargetId || !scriviInput.trim()) return;

    const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === scriviTargetId);
    if (!hotspot) return;

    // Normalize both strings for comparison (lowercase, trim)
    const normalizedInput = scriviInput.trim().toLowerCase();
    const normalizedLabel = hotspot.label.toLowerCase();

    const isCorrect = normalizedInput === normalizedLabel;

    // Set feedback
    setScriviAnswerFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScriviScore(prev => prev + 1);
    }

    // Move to next round after feedback
    const newUsed = [...usedScriviHotspots, scriviTargetId];
    setUsedScriviHotspots(newUsed);

    if (scriviRound >= SCRIVI_ROUNDS) {
      // Finished all rounds
      setTimeout(() => {
        setScriviState('finished');
        setScriviTargetId(null);
        setScriviInput('');
        setScriviAnswerFeedback(null);
      }, 1500);
    } else {
      // Next round
      setTimeout(() => {
        const nextTarget = getRandomScriviTarget(newUsed);
        setScriviTargetId(nextTarget);
        setScriviRound(prev => prev + 1);
        setScriviInput('');
        setScriviAnswerFeedback(null);

        // Auto-zoom to the new body part
        if (nextTarget) {
          const cameraConfig = getHotspotCameraPosition(nextTarget);
          if (cameraConfig) {
            setFocusedPart(cameraConfig.id);
          }
        }

        // Focus input
        setTimeout(() => {
          scriviInputRef.current?.focus();
        }, 100);
      }, 1500);
    }
  }, [
    scriviState,
    scriviTargetId,
    scriviInput,
    scriviRound,
    usedScriviHotspots,
    getRandomScriviTarget,
    getHotspotCameraPosition,
  ]);

  // Exit scrivi mode
  const exitScrivi = useCallback(() => {
    setGameMode('study');
    setScriviState('idle');
    setScriviRound(0);
    setScriviScore(0);
    setScriviTargetId(null);
    setScriviInput('');
    setUsedScriviHotspots([]);
    setScriviAnswerFeedback(null);
  }, []);

  // Get scrivi diagnosis based on score
  const getScriviDiagnosis = useCallback(() => {
    const percentage = (scriviScore / SCRIVI_ROUNDS) * 100;
    if (percentage === 100)
      return { emoji: '🏆', title: 'Scrittura Perfetta!', message: 'Conosci tutti i nomi anatomici!' };
    if (percentage >= 80) return { emoji: '🌟', title: 'Ottimo lavoro!', message: 'Scrivi quasi tutto correttamente!' };
    if (percentage >= 60) return { emoji: '👍', title: 'Buon lavoro!', message: 'Continua a praticare la scrittura!' };
    if (percentage >= 40)
      return { emoji: '📚', title: 'Devi studiare!', message: 'Ripassa i nomi delle parti del corpo.' };
    return { emoji: '✏️', title: 'Non mollare!', message: 'La pratica rende perfetti!' };
  }, [scriviScore]);

  // Get current scrivi target label
  const currentScriviLabel = useMemo(() => {
    if (!scriviTargetId) return '';
    const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === scriviTargetId);
    return hotspot?.label || '';
  }, [scriviTargetId]);

  // Get current target label
  const currentTargetLabel = useMemo(() => {
    if (!currentTargetId) return '';
    const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === currentTargetId);
    return hotspot?.label || '';
  }, [currentTargetId]);

  // Calculate elapsed time
  const getElapsedTime = useCallback(() => {
    if (!startTime) return '0:00';
    const end = endTime || Date.now();
    const seconds = Math.floor((end - startTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [startTime, endTime]);

  // Play audio from menu
  const handlePlayFromMenu = useCallback(
    (hotspotId: string) => {
      const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === hotspotId);
      if (!hotspot?.audioUrl) return;

      // Stop any currently playing audio
      if (menuAudioRef.current) {
        menuAudioRef.current.pause();
        menuAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(hotspot.audioUrl);
      audio.volume = audioVolume;
      menuAudioRef.current = audio;

      audio.onplay = () => {
        setPlayingHotspotId(hotspotId);
      };

      audio.onended = () => {
        setPlayingHotspotId(null);
      };

      audio.onerror = () => {
        setPlayingHotspotId(null);
        console.error('Error playing audio:', hotspot.audioUrl);
      };

      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setPlayingHotspotId(null);
      });
    },
    [audioVolume]
  );

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (menuAudioRef.current) {
        menuAudioRef.current.pause();
        menuAudioRef.current = null;
      }
    };
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
    <Environment3DContainer title="Corpo Umano - Anatomia">
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
          <Scene
            bodyRotation={bodyRotation}
            focusedPart={focusedPart}
            controlsRef={controlsRef}
            audioVolume={audioVolume}
            activeHotspotId={playingHotspotId}
            gameMode={gameMode}
            challengeMode={gameMode === 'challenge' || gameMode === 'consultation'}
            challengeTargetId={
              gameMode === 'challenge' ? currentTargetId : gameMode === 'consultation' ? consultationTargetId : null
            }
            showCorrectAnswer={showCorrectAnswer}
            scriviTargetId={gameMode === 'scrivi' ? scriviTargetId : null}
            isScriviMode={gameMode === 'scrivi'}
            onChallengeClick={
              gameMode === 'challenge'
                ? handleChallengeClick
                : gameMode === 'consultation'
                ? handleConsultationClick
                : undefined
            }
          />
        </Canvas>

        {/* Mode Toggle - Collapsible Version */}
        <div className="absolute top-14 left-4 z-20">
          {isModeMenuExpanded ? (
            /* Expanded Version */
            <div className="bg-[#0C3559]/95 backdrop-blur-md rounded-xl p-2 md:p-4 shadow-2xl border-2 border-[#3887A6]/40 md:min-w-[280px] transition-all duration-300">
              {/* Header with label and collapse button */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#3887A6]/30">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3887A6] animate-pulse"></div>
                  <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Modalità</span>
                </div>
                <button
                  onClick={() => setIsModeMenuExpanded(false)}
                  className="p-1 rounded-md hover:bg-[#3887A6]/30 transition-colors"
                  title="Riduci menu"
                >
                  <svg
                    className="w-4 h-4 text-white/60 hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Mode Buttons - Vertical */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (gameMode === 'challenge') exitChallenge();
                    else if (gameMode === 'consultation') exitConsultation();
                    else if (gameMode === 'scrivi') exitScrivi();
                    else setGameMode('study');
                  }}
                  className={`group relative px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    gameMode === 'study'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg shadow-[#3887A6]/50 scale-[1.02]'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90 hover:scale-[1.01]'
                  }`}
                  title="Modalità Studio"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <div className="flex-1 text-left">
                      <div className="font-bold">Studio</div>
                      <div
                        className={`text-xs mt-0.5 transition-opacity ${
                          gameMode === 'study' ? 'text-white/90' : 'text-white/40'
                        }`}
                      >
                        Esplora l&apos;anatomia
                      </div>
                    </div>
                    {gameMode === 'study' && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={startChallenge}
                  className={`group relative px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    gameMode === 'challenge'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg shadow-[#3887A6]/50 scale-[1.02]'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90 hover:scale-[1.01]'
                  }`}
                  title="Modalità Trova"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1 text-left">
                      <div className="font-bold">Trova</div>
                      <div
                        className={`text-xs mt-0.5 transition-opacity ${
                          gameMode === 'challenge' ? 'text-white/90' : 'text-white/40'
                        }`}
                      >
                        Testa le conoscenze
                      </div>
                    </div>
                    {gameMode === 'challenge' && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={startConsultation}
                  className={`group relative px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    gameMode === 'consultation'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg shadow-[#3887A6]/50 scale-[1.02]'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90 hover:scale-[1.01]'
                  }`}
                  title="Simulazione Medica"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <div className="flex-1 text-left">
                      <div className="font-bold">Ascolta</div>
                      <div
                        className={`text-xs mt-0.5 transition-opacity ${
                          gameMode === 'consultation' ? 'text-white/90' : 'text-white/40'
                        }`}
                      >
                        Pratica l&apos;ascolto
                      </div>
                    </div>
                    {gameMode === 'consultation' && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={startScrivi}
                  className={`group relative px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    gameMode === 'scrivi'
                      ? 'bg-gradient-to-r from-[#FF9F43] to-[#FFC107] text-white shadow-lg shadow-[#FF9F43]/50 scale-[1.02]'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90 hover:scale-[1.01]'
                  }`}
                  title="Modalità Scrivi"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <div className="flex-1 text-left">
                      <div className="font-bold">Scrivi</div>
                      <div
                        className={`text-xs mt-0.5 transition-opacity ${
                          gameMode === 'scrivi' ? 'text-white/90' : 'text-white/40'
                        }`}
                      >
                        Pratica di scrittura
                      </div>
                    </div>
                    {gameMode === 'scrivi' && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Collapsed Version - Minimal icons only */
            <div className="bg-[#0C3559]/95 backdrop-blur-md rounded-xl p-2 shadow-2xl border-2 border-[#3887A6]/40 transition-all duration-300">
              <div className="flex flex-col gap-1.5">
                {/* Expand button */}
                <button
                  onClick={() => setIsModeMenuExpanded(true)}
                  className="p-2 rounded-lg bg-[#3887A6]/30 hover:bg-[#3887A6]/50 transition-colors mb-1"
                  title="Espandi menu"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Study Mode */}
                <button
                  onClick={() => {
                    if (gameMode === 'challenge') exitChallenge();
                    else if (gameMode === 'consultation') exitConsultation();
                    else if (gameMode === 'scrivi') exitScrivi();
                    else setGameMode('study');
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    gameMode === 'study'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                  }`}
                  title="Studio"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </button>

                {/* Challenge Mode */}
                <button
                  onClick={startChallenge}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    gameMode === 'challenge'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                  }`}
                  title="Trova"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                {/* Consultation Mode */}
                <button
                  onClick={startConsultation}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    gameMode === 'consultation'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                  }`}
                  title="Ascolta"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </button>

                {/* Scrivi Mode */}
                <button
                  onClick={startScrivi}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    gameMode === 'scrivi'
                      ? 'bg-gradient-to-r from-[#FF9F43] to-[#FFC107] text-white shadow-lg'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                  }`}
                  title="Scrivi"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Challenge Mode UI */}
        {gameMode === 'challenge' && (
          <>
            {/* Challenge Body Parts Navigation - Responsive */}
            {/* Mobile: Bottom horizontal bar */}
            <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-2">
              <div className="bg-[#0C3559]/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-[#3887A6]/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {BODY_PARTS.map(part => (
                    <button
                      key={part.id}
                      onClick={() => setFocusedPart(part.id)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        focusedPart === part.id
                          ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                          : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                      }`}
                      title={part.label}
                    >
                      <span className="text-lg">{part.icon}</span>
                      <span className="text-[10px] font-medium whitespace-nowrap">{part.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Right side panel */}
            <div className="hidden md:block absolute top-16 right-4 z-20">
              <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg p-3 shadow-xl border border-[#3887A6]/30">
                <div className="text-xs text-white/60 font-medium mb-2 px-1">Naviga</div>
                <div className="flex flex-col gap-2">
                  {BODY_PARTS.map((part, index) => (
                    <div key={part.id}>
                      <button
                        onClick={() => setFocusedPart(part.id)}
                        className={`
                          w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                          flex items-center gap-2 border-2 whitespace-nowrap
                          ${
                            focusedPart === part.id
                              ? 'bg-[#3887A6] text-white border-[#3887A6] shadow-md'
                              : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
                          }
                        `}
                      >
                        <span className="text-base">{part.icon}</span>
                        {part.label}
                      </button>
                      {index === 0 && <div className="border-b border-white/10 my-2" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Challenge Prompt - Responsive */}
            {challengeState === 'playing' && currentTargetLabel && (
              <div className="absolute top-16 md:top-32 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-[#0C3559] backdrop-blur-sm rounded-xl px-4 md:px-8 py-2 md:py-4 shadow-2xl border-2 border-[#3887A6]">
                  <div className="text-center">
                    <div className="text-white/60 text-xs md:text-sm mb-0.5 md:mb-1">Clicca su:</div>
                    <div className="text-white text-lg md:text-2xl font-bold">{currentTargetLabel}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar - Responsive */}
            {challengeState === 'playing' && (
              <div className="absolute top-4 md:top-16 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-20">
                <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg px-3 md:px-4 py-1.5 md:py-2 shadow-xl border border-[#3887A6]/30">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="text-white/60 text-xs md:text-sm">
                      {completedHotspots.length}/{ANATOMY_HOTSPOTS.length}
                    </div>
                    <div className="w-20 md:w-48 h-1.5 md:h-2 bg-[#0F2940] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4CAF50] transition-all duration-300"
                        style={{ width: `${(completedHotspots.length / ANATOMY_HOTSPOTS.length) * 100}%` }}
                      />
                    </div>
                    <div className="text-white/60 text-xs md:text-sm">⏱ {getElapsedTime()}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Lost Modal - Responsive */}
            {challengeState === 'lost' && !showCorrectAnswer && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 p-4">
                <div className="bg-[#0C3559] rounded-2xl p-4 md:p-8 shadow-2xl border-2 border-red-500 max-w-md text-center">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4">😢</div>
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-1 md:mb-2">Sbagliato!</h2>
                  <p className="text-white/70 text-sm md:text-base mb-3 md:mb-4">
                    Hai completato {score} su {ANATOMY_HOTSPOTS.length} parti.
                  </p>
                  <div className="flex gap-2 md:gap-4 justify-center">
                    <button
                      onClick={restartChallenge}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#3887A6] text-white rounded-lg text-sm md:text-base font-medium hover:bg-[#2d6d8a] transition-all"
                    >
                      🔄 Riprova
                    </button>
                    <button
                      onClick={exitChallenge}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#0F2940] text-white/70 rounded-lg text-sm md:text-base font-medium hover:bg-[#1a3a55] transition-all"
                    >
                      📚 Studio
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Won Modal - Responsive */}
            {challengeState === 'won' && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 p-4">
                <div className="bg-[#0C3559] rounded-2xl p-4 md:p-8 shadow-2xl border-2 border-[#4CAF50] max-w-md text-center">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4">🎉</div>
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-1 md:mb-2">Complimenti!</h2>
                  <p className="text-white/70 text-sm md:text-base mb-1 md:mb-2">
                    Hai completato tutte le {ANATOMY_HOTSPOTS.length} parti anatomiche!
                  </p>
                  <p className="text-[#4CAF50] text-lg md:text-xl font-bold mb-3 md:mb-4">Tempo: {getElapsedTime()}</p>
                  <div className="flex gap-2 md:gap-4 justify-center">
                    <button
                      onClick={restartChallenge}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#4CAF50] text-white rounded-lg text-sm md:text-base font-medium hover:bg-[#3d8b40] transition-all"
                    >
                      🔄 <span className="hidden md:inline">Gioca ancora</span>
                      <span className="md:hidden">Riprova</span>
                    </button>
                    <button
                      onClick={exitChallenge}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#0F2940] text-white/70 rounded-lg text-sm md:text-base font-medium hover:bg-[#1a3a55] transition-all"
                    >
                      📚 Studio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Consultation Mode UI */}
        {gameMode === 'consultation' && (
          <>
            {/* Consultation Body Parts Navigation - Responsive */}
            {/* Mobile: Bottom horizontal bar */}
            <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-2">
              <div className="bg-[#0C3559]/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-[#3887A6]/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {BODY_PARTS.map(part => (
                    <button
                      key={part.id}
                      onClick={() => setFocusedPart(part.id)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        focusedPart === part.id
                          ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                          : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                      }`}
                      title={part.label}
                    >
                      <span className="text-lg">{part.icon}</span>
                      <span className="text-[10px] font-medium whitespace-nowrap">{part.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Right side panel */}
            <div className="hidden md:block absolute top-16 right-4 z-20">
              <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg p-3 shadow-xl border border-[#3887A6]/30">
                <div className="text-xs text-white/60 font-medium mb-2 px-1">Naviga</div>
                <div className="flex flex-col gap-2">
                  {BODY_PARTS.map((part, index) => (
                    <div key={part.id}>
                      <button
                        onClick={() => setFocusedPart(part.id)}
                        className={`
                          w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                          flex items-center gap-2 border-2 whitespace-nowrap
                          ${
                            focusedPart === part.id
                              ? 'bg-[#3887A6] text-white border-[#3887A6] shadow-md'
                              : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
                          }
                        `}
                      >
                        <span className="text-base">{part.icon}</span>
                        {part.label}
                      </button>
                      {index === 0 && <div className="border-b border-white/10 my-2" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Card - Audio indicator - Responsive */}
            {consultationState === 'playing' && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 md:top-32 md:left-auto md:translate-x-0 md:right-[200px] z-20">
                <div
                  className={`bg-[#0C3559] backdrop-blur-sm rounded-xl px-4 md:px-6 py-3 md:py-4 shadow-2xl border-2 transition-all duration-300 ${
                    lastAnswerCorrect === true
                      ? 'border-[#4CAF50]'
                      : lastAnswerCorrect === false
                      ? 'border-red-500'
                      : 'border-[#3887A6]'
                  }`}
                >
                  <div className="text-center">
                    {/* Feedback indicator */}
                    {lastAnswerCorrect !== null ? (
                      <div
                        className={`text-2xl md:text-4xl mb-1 md:mb-2 ${
                          lastAnswerCorrect ? 'animate-bounce' : 'animate-pulse'
                        }`}
                      >
                        {lastAnswerCorrect ? '✅' : '❌'}
                      </div>
                    ) : (
                      <div className="text-2xl md:text-4xl mb-1 md:mb-2">🏥</div>
                    )}
                    <div className="text-white/60 text-xs md:text-sm mb-0.5 md:mb-1">
                      {lastAnswerCorrect === true
                        ? 'Corretto!'
                        : lastAnswerCorrect === false
                        ? 'Sbagliato!'
                        : 'Il paziente parla...'}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2 md:mb-3">
                      {isAudioPlaying ? (
                        <div className="flex gap-1 items-end h-4 md:h-6">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div
                              key={i}
                              className="w-1 bg-[#4CAF50] rounded-sm"
                              style={{
                                animation: 'soundBar 0.4s ease-in-out infinite alternate',
                                animationDelay: `${i * 0.08}s`,
                              }}
                            />
                          ))}
                        </div>
                      ) : lastAnswerCorrect === null ? (
                        <div className="text-white/40 text-xs md:text-sm">Audio terminato</div>
                      ) : null}
                    </div>
                    {lastAnswerCorrect === null && (
                      <button
                        onClick={replayConsultationAudio}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-[#3887A6] text-white rounded-lg text-xs md:text-sm font-medium hover:bg-[#2d6d8a] transition-all flex items-center gap-2 mx-auto"
                      >
                        🔄 <span className="hidden md:inline">Ascolta di nuovo</span>
                        <span className="md:hidden">Replay</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar - Responsive */}
            {consultationState === 'playing' && (
              <div className="absolute top-4 right-4 md:top-16 md:right-auto md:left-1/2 md:transform md:-translate-x-1/2 z-20">
                <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg px-2 md:px-4 py-2 md:py-3 shadow-xl border border-[#3887A6]/30">
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    {/* General progress */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="text-white/60 text-xs md:text-sm">
                        <span className="md:hidden">
                          {consultationRound}/{CONSULTATION_ROUNDS}
                        </span>
                        <span className="hidden md:inline w-24">
                          Ascolta {consultationRound}/{CONSULTATION_ROUNDS}
                        </span>
                      </div>
                      <div className="w-16 md:w-40 h-1.5 md:h-2 bg-[#0F2940] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3887A6] transition-all duration-300"
                          style={{ width: `${(consultationRound / CONSULTATION_ROUNDS) * 100}%` }}
                        />
                      </div>
                    </div>
                    {/* Correct/Wrong counts - Hidden on mobile for space */}
                    <div className="hidden md:flex items-center gap-4 justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[#4CAF50] text-sm">✅</span>
                        <div className="w-16 h-1.5 bg-[#0F2940] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4CAF50] transition-all duration-300"
                            style={{ width: `${(consultationScore / CONSULTATION_ROUNDS) * 100}%` }}
                          />
                        </div>
                        <span className="text-[#4CAF50] text-sm font-medium">{consultationScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 text-sm">❌</span>
                        <div className="w-16 h-1.5 bg-[#0F2940] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 transition-all duration-300"
                            style={{
                              width: `${((consultationRound - 1 - consultationScore) / CONSULTATION_ROUNDS) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-red-400 text-sm font-medium">
                          {Math.max(0, consultationRound - 1 - consultationScore)}
                        </span>
                      </div>
                    </div>
                    {/* Mobile: Compact score */}
                    <div className="flex md:hidden items-center gap-2 justify-center text-xs">
                      <span className="text-[#4CAF50]">✅{consultationScore}</span>
                      <span className="text-red-400">❌{Math.max(0, consultationRound - 1 - consultationScore)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finished Modal - Responsive */}
            {consultationState === 'finished' && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 p-4">
                <div className="bg-[#0C3559] rounded-2xl p-4 md:p-8 shadow-2xl border-2 border-[#3887A6] max-w-md text-center">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4">{getConsultationDiagnosis().emoji}</div>
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-1 md:mb-2">
                    {getConsultationDiagnosis().title}
                  </h2>
                  <p className="text-white/70 text-sm md:text-base mb-3 md:mb-4">
                    {getConsultationDiagnosis().message}
                  </p>
                  <div className="text-[#4CAF50] text-lg md:text-xl font-bold mb-3 md:mb-4">
                    Punteggio: {consultationScore}/{CONSULTATION_ROUNDS}
                  </div>
                  <div className="flex gap-2 md:gap-4 justify-center">
                    <button
                      onClick={startConsultation}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#3887A6] text-white rounded-lg text-sm md:text-base font-medium hover:bg-[#2d6d8a] transition-all"
                    >
                      🔄 <span className="hidden md:inline">Gioca ancora</span>
                      <span className="md:hidden">Riprova</span>
                    </button>
                    <button
                      onClick={exitConsultation}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#0F2940] text-white/70 rounded-lg text-sm md:text-base font-medium hover:bg-[#1a3a55] transition-all"
                    >
                      📚 Studio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Scrivi Mode UI */}
        {gameMode === 'scrivi' && (
          <>
            {/* Scrivi Body Parts Navigation - Responsive */}
            {/* Mobile: Bottom horizontal bar */}
            <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-2">
              <div className="bg-[#0C3559]/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-[#FF9F43]/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {BODY_PARTS.filter(p => p.id !== 'rules').map(part => (
                    <button
                      key={part.id}
                      onClick={() => setFocusedPart(part.id)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        focusedPart === part.id
                          ? 'bg-gradient-to-r from-[#FF9F43] to-[#FFC107] text-white shadow-lg'
                          : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                      }`}
                      title={part.label}
                    >
                      <span className="text-lg">{part.icon}</span>
                      <span className="text-[10px] font-medium whitespace-nowrap">{part.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Right side panel */}
            <div className="hidden md:block absolute top-16 right-4 z-20">
              <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg p-3 shadow-xl border border-[#FF9F43]/30">
                <div className="text-xs text-white/60 font-medium mb-2 px-1">Naviga</div>
                <div className="flex flex-col gap-2">
                  {BODY_PARTS.filter(p => p.id !== 'rules').map(part => (
                    <button
                      key={part.id}
                      onClick={() => setFocusedPart(part.id)}
                      className={`
                        w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                        flex items-center gap-2 border-2 whitespace-nowrap
                        ${
                          focusedPart === part.id
                            ? 'bg-[#FF9F43] text-white border-[#FF9F43] shadow-md'
                            : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
                        }
                      `}
                    >
                      <span className="text-base">{part.icon}</span>
                      {part.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Card - Responsive */}
            {scriviState === 'playing' && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 md:top-32 md:left-auto md:translate-x-0 md:right-[200px] z-20">
                <div
                  className={`bg-[#0C3559] backdrop-blur-sm rounded-xl px-4 md:px-6 py-3 md:py-4 shadow-2xl border-2 transition-all duration-300 ${
                    scriviAnswerFeedback === 'correct'
                      ? 'border-[#4CAF50]'
                      : scriviAnswerFeedback === 'wrong'
                      ? 'border-red-500'
                      : 'border-[#FF9F43]'
                  }`}
                >
                  <div className="text-center">
                    {/* Feedback indicator */}
                    {scriviAnswerFeedback !== null ? (
                      <div
                        className={`text-2xl md:text-4xl mb-1 md:mb-2 ${
                          scriviAnswerFeedback === 'correct' ? 'animate-bounce' : 'animate-pulse'
                        }`}
                      >
                        {scriviAnswerFeedback === 'correct' ? '✅' : '❌'}
                      </div>
                    ) : (
                      <div className="text-2xl md:text-4xl mb-1 md:mb-2">✏️</div>
                    )}
                    <div className="text-white/60 text-xs md:text-sm mb-2">
                      {scriviAnswerFeedback === 'correct'
                        ? 'Corretto!'
                        : scriviAnswerFeedback === 'wrong'
                        ? `Era: ${currentScriviLabel}`
                        : 'Scrivi il nome della parte evidenziata'}
                    </div>

                    {/* Input field */}
                    {scriviAnswerFeedback === null && (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          handleScriviSubmit();
                        }}
                        className="flex flex-col gap-2"
                      >
                        <input
                          ref={scriviInputRef}
                          type="text"
                          value={scriviInput}
                          onChange={e => setScriviInput(e.target.value)}
                          placeholder="Scrivi qui..."
                          className="w-full px-3 py-2 bg-[#0F2940] border border-[#FF9F43]/30 rounded-lg text-white placeholder-white/40 text-sm md:text-base focus:outline-none focus:border-[#FF9F43] transition-colors"
                          autoComplete="off"
                          autoCapitalize="none"
                        />
                        <button
                          type="submit"
                          disabled={!scriviInput.trim()}
                          className="px-4 py-2 bg-[#FF9F43] text-white rounded-lg text-sm font-medium hover:bg-[#e8903d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <span>Conferma</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar - Responsive */}
            {scriviState === 'playing' && (
              <div className="absolute top-4 right-4 md:top-16 md:right-auto md:left-1/2 md:transform md:-translate-x-1/2 z-20">
                <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg px-2 md:px-4 py-2 md:py-3 shadow-xl border border-[#FF9F43]/30">
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    {/* General progress */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="text-white/60 text-xs md:text-sm">
                        <span className="md:hidden">
                          {scriviRound}/{SCRIVI_ROUNDS}
                        </span>
                        <span className="hidden md:inline w-24">
                          Scrivi {scriviRound}/{SCRIVI_ROUNDS}
                        </span>
                      </div>
                      <div className="w-16 md:w-40 h-1.5 md:h-2 bg-[#0F2940] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FF9F43] transition-all duration-300"
                          style={{ width: `${(scriviRound / SCRIVI_ROUNDS) * 100}%` }}
                        />
                      </div>
                    </div>
                    {/* Correct/Wrong counts - Hidden on mobile for space */}
                    <div className="hidden md:flex items-center gap-4 justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[#4CAF50] text-sm">✅</span>
                        <div className="w-16 h-1.5 bg-[#0F2940] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4CAF50] transition-all duration-300"
                            style={{ width: `${(scriviScore / SCRIVI_ROUNDS) * 100}%` }}
                          />
                        </div>
                        <span className="text-[#4CAF50] text-sm font-medium">{scriviScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 text-sm">❌</span>
                        <div className="w-16 h-1.5 bg-[#0F2940] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 transition-all duration-300"
                            style={{
                              width: `${((scriviRound - 1 - scriviScore) / SCRIVI_ROUNDS) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-red-400 text-sm font-medium">
                          {Math.max(0, scriviRound - 1 - scriviScore)}
                        </span>
                      </div>
                    </div>
                    {/* Mobile: Compact score */}
                    <div className="flex md:hidden items-center gap-2 justify-center text-xs">
                      <span className="text-[#4CAF50]">✅{scriviScore}</span>
                      <span className="text-red-400">❌{Math.max(0, scriviRound - 1 - scriviScore)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finished Modal - Responsive */}
            {scriviState === 'finished' && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 p-4">
                <div className="bg-[#0C3559] rounded-2xl p-4 md:p-8 shadow-2xl border-2 border-[#FF9F43] max-w-md text-center">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4">{getScriviDiagnosis().emoji}</div>
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-1 md:mb-2">
                    {getScriviDiagnosis().title}
                  </h2>
                  <p className="text-white/70 text-sm md:text-base mb-3 md:mb-4">{getScriviDiagnosis().message}</p>
                  <div className="text-[#FF9F43] text-lg md:text-xl font-bold mb-3 md:mb-4">
                    Punteggio: {scriviScore}/{SCRIVI_ROUNDS}
                  </div>
                  <div className="flex gap-2 md:gap-4 justify-center">
                    <button
                      onClick={startScrivi}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#FF9F43] text-white rounded-lg text-sm md:text-base font-medium hover:bg-[#e8903d] transition-all"
                    >
                      🔄 <span className="hidden md:inline">Gioca ancora</span>
                      <span className="md:hidden">Riprova</span>
                    </button>
                    <button
                      onClick={exitScrivi}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#0F2940] text-white/70 rounded-lg text-sm md:text-base font-medium hover:bg-[#1a3a55] transition-all"
                    >
                      📚 Studio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Body Parts Panel - Responsive Version */}
        {/* Mobile: Bottom horizontal bar with scroll */}
        {/* Desktop: Right side vertical panel */}
        {gameMode === 'study' && (
          <>
            {/* Mobile Version - Bottom horizontal bar */}
            <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-2">
              <div className="bg-[#0C3559]/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-[#3887A6]/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#3887A6]/50">
                  {/* Fullscreen button first */}
                  <FullscreenButton compact />
                  {/* Separator */}
                  <div className="w-px h-8 bg-white/20 flex-shrink-0" />
                  {BODY_PARTS.map(part => {
                    const displayLabel = part.id === 'rules' ? 'Istruzioni' : part.label;
                    return (
                      <button
                        key={part.id}
                        onClick={() => setFocusedPart(part.id)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                          focusedPart === part.id
                            ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                            : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                        }`}
                        title={displayLabel}
                      >
                        <span className="text-lg">{part.icon}</span>
                        <span className="text-[10px] font-medium whitespace-nowrap">{displayLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Desktop Version - Right side panel */}
            <div className="hidden md:block absolute top-16 right-4 z-20">
              <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg p-3 space-y-2 shadow-xl border border-[#3887A6]/30 max-h-[70vh] overflow-y-auto">
                {/* Fullscreen Button Section */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-white/60 font-medium px-1">Visualizzazione</div>
                  <FullscreenButton />
                  <div className="border-b border-white/10 my-1" />
                </div>

                <div className="flex flex-col gap-2">
                  {BODY_PARTS.map((part, index) => {
                    // Determine which hotspots and expanded state to use
                    const getExpandConfig = () => {
                      switch (part.id) {
                        case 'head':
                          return {
                            hotspots: HEAD_HOTSPOTS,
                            expanded: headExpanded,
                            toggle: () => setHeadExpanded(!headExpanded),
                            title: 'Dettagli della testa',
                          };
                        case 'torso':
                          return {
                            hotspots: TORSO_HOTSPOTS,
                            expanded: torsoExpanded,
                            toggle: () => setTorsoExpanded(!torsoExpanded),
                            title: 'Dettagli del torso',
                          };
                        case 'legs':
                          return {
                            hotspots: LEGS_HOTSPOTS,
                            expanded: legsExpanded,
                            toggle: () => setLegsExpanded(!legsExpanded),
                            title: 'Dettagli delle gambe',
                          };
                        case 'hand':
                          return {
                            hotspots: HAND_HOTSPOTS,
                            expanded: handExpanded,
                            toggle: () => setHandExpanded(!handExpanded),
                            title: 'Dettagli della mano',
                          };
                        default:
                          return null;
                      }
                    };

                    const expandConfig = getExpandConfig();
                    const hasExpander = expandConfig !== null;

                    // In study mode, show "Istruzioni" instead of "Regole"
                    const displayLabel = part.id === 'rules' ? 'Istruzioni' : part.label;

                    return (
                      <div key={part.id}>
                        <BodyPartButton
                          part={part}
                          isActive={focusedPart === part.id}
                          onClick={() => setFocusedPart(part.id)}
                          label={displayLabel}
                          hasExpander={hasExpander}
                          isExpanded={expandConfig?.expanded}
                          onExpandToggle={expandConfig?.toggle}
                        />
                        {/* Separator and label after Istruzioni */}
                        {index === 0 && (
                          <>
                            <div className="border-b border-white/10 my-2" />
                            <div className="text-xs text-white/60 font-medium mb-1 px-1">Parti del corpo</div>
                          </>
                        )}
                        {/* Expandable hotspots */}
                        {hasExpander && expandConfig && (
                          <div
                            className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${expandConfig.expanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}
                          `}
                          >
                            <div className="bg-[#0a2a47] rounded-lg p-2 space-y-1 ml-2 border-l-2 border-[#3887A6]/50">
                              <div className="text-[10px] text-white/50 font-medium px-1 mb-1">
                                {expandConfig.title}
                              </div>
                              {expandConfig.hotspots.map(hotspot => {
                                const anatomyHotspot = ANATOMY_HOTSPOTS.find(h => h.id === hotspot.id);
                                return (
                                  <HotspotMenuItem
                                    key={hotspot.id}
                                    hotspot={hotspot}
                                    isPlaying={playingHotspotId === hotspot.id}
                                    transcription={anatomyHotspot?.transcription || ''}
                                    onPlay={() => handlePlayFromMenu(hotspot.id)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Volume Control */}
                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="text-xs text-white/60 font-medium mb-2 px-1 flex items-center gap-2">
                    <span>🔊</span>
                    <span>Volume</span>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <button
                      onClick={() => setAudioVolume(0)}
                      className="text-white/60 hover:text-white transition-colors"
                      title="Mute"
                    >
                      {audioVolume === 0 ? '🔇' : '🔈'}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={audioVolume}
                      onChange={e => setAudioVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-3
                      [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-[#3887A6]
                      [&::-webkit-slider-thumb]:shadow-md
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-3
                      [&::-moz-range-thumb]:h-3
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-[#3887A6]
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <span className="text-xs text-white/60 w-8 text-right">{Math.round(audioVolume * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CSS for menu sound bar animation */}
        <style>{`
          @keyframes soundBar {
            0% { height: 4px; }
            100% { height: 12px; }
          }
        `}</style>
      </div>
    </Environment3DContainer>
  );
}
