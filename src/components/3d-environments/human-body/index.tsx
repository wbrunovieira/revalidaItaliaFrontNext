'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, RoundedBox, useGLTF, Html, Text } from '@react-three/drei';
import { useTranslations } from 'next-intl';
import * as THREE from 'three';
import { Environment3DProps } from '../registry';
import Environment3DContainer from '../Environment3DContainer';

// Body parts configuration for camera focus
interface BodyPartConfig {
  id: string;
  labelKey: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  icon: string;
}

const BODY_PARTS: BodyPartConfig[] = [
  {
    id: 'full',
    labelKey: 'bodyFull',
    cameraPosition: [0, 0.5, 5],
    cameraTarget: [0, 0.5, 0],
    icon: '👤',
  },
  {
    id: 'head',
    labelKey: 'head',
    cameraPosition: [0, 1.1, 0.3],
    cameraTarget: [0, 1.2, -0.5],
    icon: '🧠',
  },
  {
    id: 'torso',
    labelKey: 'torso',
    cameraPosition: [0, 0.3, 1.5],
    cameraTarget: [0, 0.3, -1.5],
    icon: '🫁',
  },
  {
    id: 'legs',
    labelKey: 'legs',
    cameraPosition: [0, -0.5, 1.5],
    cameraTarget: [0, -0.5, 0],
    icon: '🦵',
  },
  {
    id: 'hand',
    labelKey: 'hand',
    cameraPosition: [0.5, 0.1, 0.7],
    cameraTarget: [0.7, 0, -2.2],
    icon: '✋',
  },
];

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

// Chalkboard with instructions
function InstructionsChalkboard() {
  const primaryDark = '#0F2940';
  const secondaryColor = '#3887A6';

  return (
    <group position={[-3, 2.5, -4.9]}>
      {/* Chalkboard frame - secondary color */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 3.2, 0.1]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.8} />
      </mesh>

      {/* Chalkboard surface - primary dark */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[4.7, 2.9]} />
        <meshStandardMaterial color={primaryDark} roughness={0.95} />
      </mesh>

      {/* Chalk tray */}
      <mesh position={[0, -1.5, 0.15]}>
        <boxGeometry args={[4.2, 0.08, 0.15]} />
        <meshStandardMaterial color="#0C3559" roughness={0.8} />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 1.1, 0.07]}
        fontSize={0.22}
        color="#F5F5DC"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        Come usare
        <meshBasicMaterial color="#F5F5DC" />
      </Text>

      {/* Instruction 1 */}
      <Text
        position={[-2.1, 0.5, 0.07]}
        fontSize={0.15}
        color="#F5F5DC"
        anchorX="left"
        anchorY="middle"
        maxWidth={4.2}
        fontWeight={700}
      >
        1. Scegli la parte del corpo nel pannello
        <meshBasicMaterial color="#F5F5DC" />
      </Text>

      {/* Instruction 2 */}
      <Text
        position={[-2.1, 0.05, 0.07]}
        fontSize={0.15}
        color="#F5F5DC"
        anchorX="left"
        anchorY="middle"
        maxWidth={4.2}
        fontWeight={700}
      >
        2. Passa il mouse sui punti per vedere il nome
        <meshBasicMaterial color="#F5F5DC" />
      </Text>

      {/* Instruction 3 */}
      <Text
        position={[-2.1, -0.4, 0.07]}
        fontSize={0.15}
        color="#F5F5DC"
        anchorX="left"
        anchorY="middle"
        maxWidth={4.2}
        fontWeight={700}
      >
        {"3. Clicca per ascoltare l'audio"}
        <meshBasicMaterial color="#F5F5DC" />
      </Text>

      {/* Closing message */}
      <Text
        position={[0, -1.0, 0.07]}
        fontSize={0.18}
        color="#90EE90"
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        ❤️ Divertiti e impara! ❤️
        <meshBasicMaterial color="#90EE90" />
      </Text>
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
          <mesh key={i} position={[0, 0.85 - i * 0.15, 0]} rotation={[0.3, 0, 0]}>
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
      <Text fontSize={0.7} anchorX="center" anchorY="middle" letterSpacing={0.02} fontWeight={700}>
        Revalida Italia
        <meshStandardMaterial color="#0C3559" metalness={0.2} roughness={0.4} />
      </Text>
    </group>
  );
}

// Human body 3D model (external only - skin, eyes, eyebrows, eyelashes)
// In production, Nginx proxies /public/ to S3; in dev, Next.js serves from public/ at root
const MODEL_PATH =
  process.env.NODE_ENV === 'production'
    ? '/public/models/human-body/anatomy-internal.glb'
    : '/models/human-body/anatomy-internal.glb';

// Hotspot component for interactive anatomy points
interface HotspotProps {
  position: [number, number, number];
  label: string;
  size?: number;
  audioUrl?: string;
  volume?: number;
  onHover?: (isHovered: boolean) => void;
  onAudioPlay?: () => void;
}

function Hotspot({ position, label, size = 3, audioUrl, volume = 1, onHover, onAudioPlay }: HotspotProps) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Show tooltip based on hover or touch
  const tooltipVisible = showTooltip || hovered;

  const handlePointerOver = () => {
    if (!isTouchDevice) {
      setHovered(true);
      onHover?.(true);
    }
  };

  const handlePointerOut = () => {
    if (!isTouchDevice) {
      setHovered(false);
      onHover?.(false);
    }
  };

  const playAudio = useCallback(() => {
    if (!audioUrl) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audioRef.current = audio;

    audio.onplay = () => {
      setIsPlaying(true);
      onAudioPlay?.();
    };

    audio.onended = () => {
      setIsPlaying(false);
      setHasPlayed(true);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      console.error('Error playing audio:', audioUrl);
    };

    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    });
  }, [audioUrl, volume, onAudioPlay]);

  const handleClick = useCallback(() => {
    // On touch device: show tooltip for 3 seconds + play audio
    if (isTouchDevice) {
      // Clear any existing timeout
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }

      // Show tooltip
      setShowTooltip(true);
      onHover?.(true);

      // Hide tooltip after 3 seconds
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowTooltip(false);
        onHover?.(false);
      }, 3000);
    }

    // Play audio (both desktop and mobile)
    if (audioUrl) {
      playAudio();
    }
  }, [isTouchDevice, audioUrl, playAudio, onHover]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <group position={position}>
      {/* Hotspot point - clickable */}
      <mesh onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={handleClick}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={isPlaying ? '#4CAF50' : tooltipVisible ? '#3887A6' : '#0C3559'}
          emissive={isPlaying ? '#4CAF50' : tooltipVisible ? '#3887A6' : '#0C3559'}
          emissiveIntensity={isPlaying ? 1.5 : tooltipVisible ? 1.2 : 0.6}
        />
      </mesh>

      {/* Pulsing ring - animated when playing */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.3, size * 1.7, 32]} />
        <meshStandardMaterial
          color={isPlaying ? '#4CAF50' : '#3887A6'}
          transparent
          opacity={isPlaying ? 0.9 : tooltipVisible ? 0.9 : 0.5}
        />
      </mesh>

      {/* Playing animation indicator */}
      {isPlaying && (
        <Html position={[size * 2, size * 1.5, 0]} distanceFactor={6} center>
          <div
            style={{
              display: 'flex',
              gap: '2px',
              alignItems: 'flex-end',
              height: '14px',
            }}
          >
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: '3px',
                  background: '#4CAF50',
                  borderRadius: '1px',
                  animation: `soundBar 0.5s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes soundBar {
              0% { height: 4px; }
              100% { height: 14px; }
            }
          `}</style>
        </Html>
      )}

      {/* Label tooltip - positioned to the right */}
      {tooltipVisible && (
        <Html
          position={[0, 0, 0]}
          distanceFactor={6}
          center={false}
          style={{
            pointerEvents: 'auto',
            transform: 'translate(0, -50%)',
          }}
        >
          <div
            className="flex items-center"
            style={{
              animation: 'tooltipAppear 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Connector line with gradient and rounded ends */}
            <div
              style={{
                width: '40px',
                height: '2px',
                background: isPlaying
                  ? 'linear-gradient(90deg, #4CAF50 0%, #2E7D32 50%, #4CAF50 100%)'
                  : 'linear-gradient(90deg, #3887A6 0%, #0C3559 50%, #3887A6 100%)',
                borderRadius: '2px',
                boxShadow: isPlaying ? '0 0 6px rgba(76, 175, 80, 0.4)' : '0 0 6px rgba(56, 135, 166, 0.4)',
              }}
            />
            {/* Rounded connector dot */}
            <div
              style={{
                width: '6px',
                height: '6px',
                background: isPlaying
                  ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
                  : 'linear-gradient(135deg, #3887A6 0%, #0C3559 100%)',
                borderRadius: '50%',
                marginLeft: '-3px',
                boxShadow: isPlaying ? '0 0 8px rgba(76, 175, 80, 0.5)' : '0 0 8px rgba(56, 135, 166, 0.5)',
              }}
            />
            {/* Label box with animation */}
            <div
              className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-2"
              style={{
                background: isPlaying
                  ? 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)'
                  : 'linear-gradient(135deg, #0C3559 0%, #0a2a47 100%)',
                border: isPlaying ? '2px solid #4CAF50' : '2px solid #3887A6',
                borderRadius: '12px',
                color: '#ffffff',
                boxShadow: isPlaying
                  ? '0 4px 20px rgba(46, 125, 50, 0.4), 0 0 15px rgba(76, 175, 80, 0.3)'
                  : '0 4px 20px rgba(12, 53, 89, 0.4), 0 0 15px rgba(56, 135, 166, 0.3)',
                marginLeft: '-2px',
                cursor: audioUrl ? 'pointer' : 'default',
              }}
              onClick={e => {
                e.stopPropagation();
                if (audioUrl) playAudio();
              }}
            >
              {label}
              {/* Audio controls in tooltip */}
              {audioUrl && (
                <span
                  style={{
                    marginLeft: '4px',
                    fontSize: '14px',
                    opacity: isPlaying ? 1 : 0.7,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {isPlaying ? '🔉' : hasPlayed ? '↻' : '🔊'}
                </span>
              )}
            </div>
          </div>
          <style>{`
            @keyframes tooltipAppear {
              0% {
                opacity: 0;
                transform: translateX(-20px) scale(0.9);
              }
              100% {
                opacity: 1;
                transform: translateX(0) scale(1);
              }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
}

// Audio path helper - handles dev vs production paths
const getAudioPath = (filename: string) => {
  return process.env.NODE_ENV === 'production' ? `/public/audios/${filename}` : `/audios/${filename}`;
};

// Anatomy hotspots data (positions relative to model)
// yMin/yMax define the vertical range of meshes to highlight
const ANATOMY_HOTSPOTS: {
  id: string;
  position: [number, number, number];
  label: string;
  yMin: number;
  yMax: number;
  size?: number;
  audioUrl?: string;
}[] = [
  {
    id: 'testa',
    position: [0, 185, -5],
    label: 'Testa',
    yMin: 1.4,
    yMax: 2.0,
    size: 3,
    audioUrl: getAudioPath('testa.wav'),
  },
  { id: 'fronte', position: [0, 178, 6], label: 'Fronte', yMin: 1.3, yMax: 1.6, size: 1.5 },
  { id: 'sopracciglio', position: [4, 175, 5.5], label: 'Sopracciglio', yMin: 1.25, yMax: 1.45, size: 1.5 },
  { id: 'occhio', position: [4, 173, 6], label: 'Occhio', yMin: 1.2, yMax: 1.4, size: 1 },
  { id: 'naso', position: [0, 170, 12], label: 'Naso', yMin: 1.15, yMax: 1.35, size: 1 },
  { id: 'labbro', position: [0.8, 166, 8], label: 'Labbro', yMin: 1.1, yMax: 1.25, size: 1 },
  { id: 'bocca', position: [-1.2, 166, 8], label: 'Bocca', yMin: 1.05, yMax: 1.2, size: 1 },
  { id: 'mento', position: [0, 162, 8], label: 'Mento', yMin: 1.0, yMax: 1.15, size: 1 },
  { id: 'guancia', position: [6, 170, 4], label: 'Guancia', yMin: 1.2, yMax: 1.5, size: 1.5 },
  { id: 'mandibola', position: [5, 162, 5], label: 'Mandibola', yMin: 1.0, yMax: 1.3, size: 1.5 },
  { id: 'collo', position: [0, 157, 5], label: 'Collo', yMin: 0.8, yMax: 1.1, size: 1.5 },
  { id: 'spalla', position: [17, 153, 3], label: 'Spalla', yMin: 0.6, yMax: 0.9, size: 1.5 },
  { id: 'torace', position: [0, 140, 10], label: 'Torace', yMin: 0.6, yMax: 0.9, size: 1.5 },
  { id: 'ascella', position: [17, 135, 2], label: 'Ascella', yMin: 0.5, yMax: 0.8, size: 1.5 },
  { id: 'seno', position: [10, 130, 12], label: 'Seno', yMin: 0.5, yMax: 0.8, size: 1 },
  { id: 'capezzolo', position: [12, 135, 11], label: 'Capezzolo', yMin: 0.5, yMax: 0.7, size: 0.8 },
  { id: 'braccio', position: [22, 130, 0], label: 'Braccio', yMin: 0.3, yMax: 0.6, size: 1.5 },
  { id: 'gomito', position: [28, 120, -5], label: 'Gomito', yMin: 0.2, yMax: 0.5, size: 1.5 },

  { id: 'addome', position: [0, 125, 12], label: 'Addome', yMin: 0.3, yMax: 0.6, size: 1.5 },
  { id: 'ombelico', position: [0, 115, 15], label: 'Ombelico', yMin: 0.2, yMax: 0.5, size: 1.2 },

  { id: 'fianco', position: [8, 105, -10], label: 'Fianco', yMin: 0.1, yMax: 0.4, size: 1.5 },
  { id: 'anca', position: [16, 100, 5], label: 'Anca', yMin: 0.05, yMax: 0.3, size: 1.3 },

  { id: 'avambraccio', position: [30, 109, 2], label: 'Avambraccio', yMin: 0.1, yMax: 0.4, size: 1.5 },
  { id: 'natica', position: [6, 95, -15], label: 'Natica', yMin: 0.0, yMax: 0.3, size: 1.5 },
  { id: 'genitali', position: [0, 85, 15], label: 'Genitali', yMin: 0.0, yMax: 0.2, size: 1.3 },
  { id: 'inguine', position: [0, 93, 12], label: 'Inguine', yMin: 0.0, yMax: 0.2, size: 1.3 },
  { id: 'coscia', position: [6, 75, 10], label: 'Coscia', yMin: -0.1, yMax: 0.2, size: 1.5 },
  { id: 'ginocchio', position: [6, 50, 6], label: 'Ginocchio', yMin: -0.2, yMax: 0.1, size: 1.3 },
  { id: 'gamba', position: [15, 55, 8], label: 'Gamba', yMin: -0.3, yMax: 0.0, size: 1.5 },
  { id: 'tibia', position: [8, 35, 4], label: 'Tibia', yMin: -0.35, yMax: -0.05, size: 1.3 },
  { id: 'polpaccio', position: [6, 35, -11], label: 'Polpaccio', yMin: -0.35, yMax: -0.05, size: 1.3 },
  { id: 'caviglia', position: [7, 12, 2], label: 'Caviglia', yMin: -0.4, yMax: -0.1, size: 1.2 },
  { id: 'piede', position: [8, 5, 10], label: 'Piede', yMin: -0.5, yMax: -0.2, size: 1.5 },
  { id: 'tallone', position: [8, 3, -12], label: 'Tallone', yMin: -0.5, yMax: -0.2, size: 1.2 },
  { id: 'polso', position: [30, 98, 6], label: 'Polso', yMin: 0.1, yMax: 0.3, size: 1.2 },
  { id: 'mano', position: [42, 92, 9], label: 'Mano', yMin: 0.1, yMax: 0.3, size: 1.5 },
  { id: 'palmo', position: [30, 90, 6], label: 'Palmo', yMin: 0.1, yMax: 0.3, size: 1.2 },
  { id: 'dito', position: [32, 85, 10], label: 'Dito', yMin: 0.1, yMax: 0.3, size: 1.0 },
  // Dedos da mão esquerda (base)
  { id: 'pollice', position: [38, 90, 12.5], label: 'Pollice', yMin: 0.3, yMax: 0.5, size: 0.8 },
  { id: 'indice', position: [38, 80, 9.5], label: 'Indice', yMin: 0.3, yMax: 0.5, size: 0.8 },
  { id: 'medio', position: [33, 77, 9.5], label: 'Medio', yMin: 0.3, yMax: 0.5, size: 0.8 },
  { id: 'anulare', position: [29, 79, 9], label: 'Anulare', yMin: 0.3, yMax: 0.5, size: 0.8 },
  { id: 'mignolo', position: [26, 82, 9], label: 'Mignolo', yMin: 0.3, yMax: 0.5, size: 0.8 },
];

interface HumanBodyModelProps {
  rotation: number;
  audioVolume: number;
}

function HumanBodyModel({ rotation, audioVolume }: HumanBodyModelProps) {
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

      {/* Anatomy hotspots */}
      {ANATOMY_HOTSPOTS.map(hotspot => (
        <Hotspot
          key={hotspot.id}
          position={hotspot.position}
          label={hotspot.label}
          size={hotspot.size}
          audioUrl={hotspot.audioUrl}
          volume={audioVolume}
          onHover={isHovered => handleHotspotHover(hotspot.id, isHovered)}
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

  useEffect(() => {
    const part = BODY_PARTS.find(p => p.id === focusedPart);
    if (part) {
      targetPosition.current.set(...part.cameraPosition);
      targetLookAt.current.set(...part.cameraTarget);
    }
  }, [focusedPart]);

  useFrame(() => {
    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition.current, 0.05);

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
}

function Scene({ bodyRotation, focusedPart, controlsRef, audioVolume }: SceneProps) {
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
      <InstructionsChalkboard />
      <CeilingLights />

      {/* Human body model (rotates horizontally) */}
      <HumanBodyModel rotation={bodyRotation} audioVolume={audioVolume} />

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
}

function BodyPartButton({ part, isActive, onClick, label }: BodyPartButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
        flex items-center gap-2 border-2 whitespace-nowrap
        ${
          isActive
            ? 'bg-[#3887A6] text-white border-[#3887A6] shadow-md'
            : 'bg-black/30 text-white/70 border-transparent hover:bg-black/40 hover:text-white'
        }
      `}
    >
      <span className="text-base">{part.icon}</span>
      {label}
    </button>
  );
}

export default function HumanBodyEnvironment({}: Environment3DProps) {
  const t = useTranslations('Environment3D');
  const [bodyRotation, setBodyRotation] = useState(0);
  const [focusedPart, setFocusedPart] = useState('full');
  const [audioVolume, setAudioVolume] = useState(0.7);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const handleReset = useCallback(() => {
    setBodyRotation(0);
    setFocusedPart('full');
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
          <Scene
            bodyRotation={bodyRotation}
            focusedPart={focusedPart}
            controlsRef={controlsRef}
            audioVolume={audioVolume}
          />
        </Canvas>

        {/* Body Parts Panel */}
        <div className="absolute top-16 right-4 z-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 space-y-2 shadow-xl border border-white/10">
            <div className="text-xs text-white/60 font-medium mb-2 px-1">{t('controls.bodyParts')}</div>
            <div className="flex flex-col gap-2">
              {BODY_PARTS.map(part => (
                <BodyPartButton
                  key={part.id}
                  part={part}
                  isActive={focusedPart === part.id}
                  onClick={() => setFocusedPart(part.id)}
                  label={t(`controls.${part.labelKey}`)}
                />
              ))}
            </div>

            {/* Volume Control */}
            <div className="border-t border-white/10 pt-3 mt-3">
              <div className="text-xs text-white/60 font-medium mb-2 px-1 flex items-center gap-2">
                <span>🔊</span>
                <span>{t('controls.volume') || 'Volume'}</span>
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
      </div>
    </Environment3DContainer>
  );
}
