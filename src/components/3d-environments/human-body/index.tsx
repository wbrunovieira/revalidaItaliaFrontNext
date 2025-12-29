'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, RoundedBox, useGLTF, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Environment3DProps } from '../registry';
import Environment3DContainer, { useFullscreen } from '../Environment3DContainer';

// Body parts configuration for camera focus
interface BodyPartConfig {
  id: string;
  labelKey: string;
  label: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  icon: string;
  fov?: number; // Field of view (default: 50)
}

const BODY_PARTS: BodyPartConfig[] = [
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
interface InstructionsChalkboardProps {
  gameMode?: 'study' | 'challenge' | 'consultation' | 'scrivi';
}

function InstructionsChalkboard({ gameMode = 'study' }: InstructionsChalkboardProps) {
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

      {gameMode === 'challenge' ? (
        <>
          {/* Challenge Mode Title */}
          <Text
            position={[0, 1.1, 0.07]}
            fontSize={0.22}
            color="#FFD700"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            🎯 Modalità Trova
            <meshBasicMaterial color="#FFD700" />
          </Text>

          {/* Challenge Instruction 1 */}
          <Text
            position={[-2.1, 0.5, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            1. Leggi il nome della parte in alto
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Challenge Instruction 2 */}
          <Text
            position={[-2.1, 0.05, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            2. Trova e clicca sul punto corretto
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Challenge Instruction 3 */}
          <Text
            position={[-2.1, -0.25, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            3. Completa tutte le 43 parti per vincere!
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Challenge Instruction 4 */}
          <Text
            position={[-2.1, -0.6, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            4. Attenzione: se sbagli, ricominci da zero!
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Challenge Closing message */}
          <Text
            position={[0, -1.1, 0.07]}
            fontSize={0.16}
            color="#90EE90"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            💪 Sei pronto? Buona fortuna! 💪
            <meshBasicMaterial color="#90EE90" />
          </Text>
        </>
      ) : gameMode === 'consultation' ? (
        <>
          {/* Consultation Mode Title */}
          <Text
            position={[0, 1.1, 0.07]}
            fontSize={0.22}
            color="#87CEEB"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            🎧 Modalità Ascolta
            <meshBasicMaterial color="#87CEEB" />
          </Text>

          {/* Consultation Instruction 1 */}
          <Text
            position={[-2.1, 0.5, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            1. Ascolta il paziente che parla
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Consultation Instruction 2 */}
          <Text
            position={[-2.1, 0.05, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            2. Identifica la parte del corpo
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Consultation Instruction 3 */}
          <Text
            position={[-2.1, -0.4, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            3. Clicca sul punto corretto
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Consultation Closing message */}
          <Text
            position={[0, -1.0, 0.07]}
            fontSize={0.16}
            color="#90EE90"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            🏥 Diventa un ottimo medico! 🏥
            <meshBasicMaterial color="#90EE90" />
          </Text>
        </>
      ) : gameMode === 'scrivi' ? (
        <>
          {/* Scrivi Mode Title */}
          <Text
            position={[0, 1.1, 0.07]}
            fontSize={0.22}
            color="#FF9F43"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            ✏️ Modalità Scrivi
            <meshBasicMaterial color="#FF9F43" />
          </Text>

          {/* Scrivi Instruction 1 */}
          <Text
            position={[-2.1, 0.5, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            1. Osserva la parte del corpo evidenziata
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Scrivi Instruction 2 */}
          <Text
            position={[-2.1, 0.05, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            2. Scrivi il nome in italiano
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Scrivi Instruction 3 */}
          <Text
            position={[-2.1, -0.4, 0.07]}
            fontSize={0.15}
            color="#F5F5DC"
            anchorX="left"
            anchorY="middle"
            maxWidth={4.2}
            fontWeight={700}
          >
            3. Premi Invio per confermare
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Scrivi Closing message */}
          <Text
            position={[0, -1.0, 0.07]}
            fontSize={0.16}
            color="#90EE90"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            📝 Impara a scrivere correttamente! 📝
            <meshBasicMaterial color="#90EE90" />
          </Text>
        </>
      ) : (
        <>
          {/* Study Mode Title */}
          <Text
            position={[0, 1.1, 0.07]}
            fontSize={0.22}
            color="#F5F5DC"
            anchorX="center"
            anchorY="middle"
            fontWeight={700}
          >
            Come studiare
            <meshBasicMaterial color="#F5F5DC" />
          </Text>

          {/* Study Instruction 1 */}
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

          {/* Study Instruction 2 */}
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

          {/* Study Instruction 3 */}
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

          {/* Study Closing message */}
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
        </>
      )}
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

// Legend for hotspot types on wall (next to chalkboard)
function HotspotLegend() {
  const primaryColor = '#0C3559';
  const secondaryColor = '#3887A6';

  return (
    <group position={[2.5, 2.5, -4.85]}>
      {/* Legend frame - white background */}
      <mesh position={[0.1, -0.1, 0]}>
        <planeGeometry args={[2.6, 2.0]} />
        <meshStandardMaterial color="#f8f5f0" />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.5, 0.01]}
        fontSize={0.12}
        color={primaryColor}
        anchorX="center"
        anchorY="middle"
        fontWeight={700}
      >
        LEGENDA ANATOMICA
        <meshBasicMaterial color={primaryColor} />
      </Text>

      {/* Point section */}
      <group position={[-0.5, 0.1, 0.01]}>
        {/* Sphere symbol - big */}
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={0.5} />
        </mesh>
        {/* Point label */}
        <Text
          position={[0.35, 0.02, 0]}
          fontSize={0.16}
          color={primaryColor}
          anchorX="left"
          anchorY="middle"
          fontWeight={700}
        >
          Punto
          <meshBasicMaterial color={primaryColor} />
        </Text>
        {/* Point description */}
        <Text position={[0.35, -0.2, 0]} fontSize={0.11} color="#444444" anchorX="left" anchorY="middle" maxWidth={1.5}>
          Sede anatomica precisa
          <meshBasicMaterial color="#444444" />
        </Text>
      </group>

      {/* Area section */}
      <group position={[-0.5, -0.5, 0.01]}>
        {/* Hexagon symbol - big */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.05, 6]} />
          <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.5} />
        </mesh>
        {/* Outer ring for area */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.22, 6]} />
          <meshStandardMaterial color={secondaryColor} transparent opacity={0.4} />
        </mesh>
        {/* Area label */}
        <Text
          position={[0.35, 0.02, 0]}
          fontSize={0.16}
          color={secondaryColor}
          anchorX="left"
          anchorY="middle"
          fontWeight={700}
        >
          Area
          <meshBasicMaterial color={secondaryColor} />
        </Text>
        {/* Area description */}
        <Text position={[0.35, -0.2, 0]} fontSize={0.11} color="#444444" anchorX="left" anchorY="middle" maxWidth={1.5}>
          Regione corporea estesa
          <meshBasicMaterial color="#444444" />
        </Text>
      </group>

      {/* Decorative border */}
      <mesh position={[0.1, -0.1, -0.01]}>
        <planeGeometry args={[2.7, 2.1]} />
        <meshStandardMaterial color={secondaryColor} />
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
  isScriviTarget?: boolean; // Highlight this hotspot as the target in scrivi mode
  isScriviMode?: boolean; // True when in scrivi mode (to show all hotspots)
  hotspotType?: 'point' | 'area'; // point = sphere, area = hexagon with ring
  onHover?: (isHovered: boolean) => void;
  onAudioPlay?: () => void;
  onChallengeClick?: (hotspotId: string) => void;
}

function Hotspot({
  position,
  label,
  hotspotId,
  size = 3,
  audioUrl,
  transcription,
  volume = 1,
  isZoomedView = false,
  isActiveFromMenu = false,
  challengeMode = false,
  showCorrectAnswer = false,
  isScriviTarget = false,
  isScriviMode = false,
  hotspotType = 'point',
  onHover,
  onAudioPlay,
  onChallengeClick,
}: HotspotProps) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect touch device and mobile screen
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Check if mobile screen (< 768px)
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Show tooltip based on hover, touch, playing audio, or active from menu
  const tooltipVisible = showTooltip || hovered || isPlaying || isActiveFromMenu;

  // Combine playing states (local or from menu)
  const isActive = isPlaying || isActiveFromMenu;

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

      // Show transcription with 8-second timeout
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
      setShowTranscription(true);
      transcriptionTimeoutRef.current = setTimeout(() => {
        setShowTranscription(false);
      }, 8000);
    };

    audio.onended = () => {
      setIsPlaying(false);
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
    // In challenge mode, notify parent of click
    if (challengeMode) {
      onChallengeClick?.(hotspotId);
      return;
    }

    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Show tooltip (both desktop and mobile)
    setShowTooltip(true);
    onHover?.(true);

    // Hide tooltip after 8 seconds (enough time to read transcription)
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      onHover?.(false);
    }, 8000);

    // Play audio (both desktop and mobile)
    if (audioUrl) {
      playAudio();
    }
  }, [audioUrl, playAudio, onHover, challengeMode, hotspotId, onChallengeClick]);

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
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
    };
  }, []);

  // Close transcription manually
  const closeTranscription = useCallback(() => {
    setShowTranscription(false);
    if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current);
    }
  }, []);

  // Pulsing animation for scrivi target - alternates between primary and secondary colors
  const [pulseScale, setPulseScale] = useState(1);
  const [scriviColorPhase, setScriviColorPhase] = useState(0); // 0 = primary, 1 = secondary

  useEffect(() => {
    if (!isScriviTarget) {
      setPulseScale(1);
      setScriviColorPhase(0);
      return;
    }

    // Animate pulse for scrivi target
    let frame: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Pulse between 1.0 and 1.3 scale
      const scale = 1 + Math.sin(elapsed * 4) * 0.15;
      setPulseScale(scale);
      // Alternate colors - use sin wave to smoothly transition (every ~0.5 seconds)
      const colorPhase = (Math.sin(elapsed * 6) + 1) / 2; // 0 to 1
      setScriviColorPhase(colorPhase);
      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frame);
  }, [isScriviTarget]);

  // Interpolate between primary and secondary colors for scrivi target
  const getScriviTargetColor = () => {
    const primary = { r: 12, g: 53, b: 89 }; // #0C3559
    const secondary = { r: 56, g: 135, b: 166 }; // #3887A6
    const r = Math.round(primary.r + (secondary.r - primary.r) * scriviColorPhase);
    const g = Math.round(primary.g + (secondary.g - primary.g) * scriviColorPhase);
    const b = Math.round(primary.b + (secondary.b - primary.b) * scriviColorPhase);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Base colors based on hotspot type
  // Point: Primary (#0C3559) - specific location
  // Area: Secondary (#3887A6) - body region
  const baseColor = hotspotType === 'area' ? '#3887A6' : '#0C3559';
  const hoverColor = hotspotType === 'area' ? '#4ECDC4' : '#3887A6'; // Lighter version on hover

  // In scrivi mode: show all hotspots like study mode, but target is animated
  const getHotspotColor = () => {
    if (isScriviTarget) return getScriviTargetColor(); // Animated color between primary and secondary
    if (isScriviMode && !isScriviTarget) {
      // Scrivi mode non-target - show like study mode
      if (isActive) return '#4CAF50';
      if (tooltipVisible || hovered) return hoverColor;
      return baseColor;
    }
    if (challengeMode) {
      // Challenge/Consultation mode - hide unless hovered or correct answer
      if (showCorrectAnswer) return '#4CAF50';
      if (hovered) return hoverColor;
      return '#1a1a2e';
    }
    // Study mode - normal colors based on type
    if (isActive) return '#4CAF50';
    if (tooltipVisible || hovered) return hoverColor;
    return baseColor;
  };

  const getHotspotEmissive = () => {
    if (isScriviTarget) return 1.5 + scriviColorPhase * 1.5; // Pulses between 1.5 and 3.0
    if (isScriviMode && !isScriviTarget) {
      // Scrivi mode non-target - show like study mode
      if (isActive) return 1.5;
      if (tooltipVisible || hovered) return 1.2;
      return 0.6;
    }
    if (challengeMode) {
      if (showCorrectAnswer) return 1.5;
      if (hovered) return 0.8;
      return 0.1;
    }
    if (isActive) return 1.5;
    if (tooltipVisible || hovered) return 1.2;
    return 0.6;
  };

  const getHotspotOpacity = () => {
    if (isScriviTarget) return 1.0;
    if (isScriviMode && !isScriviTarget) {
      // Scrivi mode non-target - show like study mode
      if (isActive) return 0.9;
      if (tooltipVisible || hovered) return 0.9;
      return 0.5;
    }
    if (challengeMode) {
      if (showCorrectAnswer) return 0.9;
      return 0.1;
    }
    if (isActive) return 0.9;
    if (tooltipVisible || hovered) return 0.9;
    return 0.5;
  };

  // Animation for area outer ring
  const [areaRingScale, setAreaRingScale] = useState(1);

  useEffect(() => {
    if (hotspotType !== 'area' || challengeMode) {
      setAreaRingScale(1);
      return;
    }

    // Gentle pulsing animation for area rings
    let frame: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Pulse between 1.0 and 1.15 scale (subtle)
      const scale = 1 + Math.sin(elapsed * 2) * 0.075;
      setAreaRingScale(scale);
      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frame);
  }, [hotspotType, challengeMode]);

  return (
    <group position={position}>
      {/* Main hotspot - different geometry based on type */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        scale={isScriviTarget ? pulseScale : 1}
        rotation={hotspotType === 'area' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
      >
        {hotspotType === 'area' ? (
          // Hexagon (6-sided cylinder) for areas - flattened
          <cylinderGeometry args={[size * 1.2, size * 1.2, size * 0.4, 6]} />
        ) : (
          // Sphere for points
          <sphereGeometry args={[size, 16, 16]} />
        )}
        <meshStandardMaterial
          color={getHotspotColor()}
          emissive={getHotspotColor()}
          emissiveIntensity={getHotspotEmissive()}
        />
      </mesh>

      {/* Inner ring - for both types */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={isScriviTarget ? pulseScale : 1}>
        <ringGeometry args={[size * 1.3, size * 1.7, hotspotType === 'area' ? 6 : 32]} />
        <meshStandardMaterial
          color={isScriviTarget ? '#3887A6' : showCorrectAnswer ? '#4CAF50' : getHotspotColor()}
          emissive={isScriviTarget ? '#3887A6' : undefined}
          emissiveIntensity={isScriviTarget ? 1.5 : 0}
          transparent
          opacity={getHotspotOpacity()}
        />
      </mesh>

      {/* Outer pulsing ring - only for areas (indicates region) */}
      {hotspotType === 'area' && !challengeMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={areaRingScale}>
          <ringGeometry args={[size * 2.0, size * 2.3, 6]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={0.4}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Label tooltip - positioned to the right (hidden in challenge mode unless showing correct answer) */}
      {/* Mobile: Smaller and more compact */}
      {((!challengeMode && tooltipVisible) || showCorrectAnswer) && (
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
            style={{
              transform: isMobile ? 'scale(0.6)' : isZoomedView ? 'scale(0.5)' : 'scale(1)',
              transformOrigin: 'left center',
            }}
          >
            <div
              className="flex items-center"
              style={{
                animation: 'tooltipAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              {/* Connector line with gradient and rounded ends */}
              <div
                style={{
                  width: isMobile ? '15px' : isZoomedView ? '25px' : '40px',
                  height: isMobile ? '1px' : '2px',
                  background: isActive
                    ? 'linear-gradient(90deg, #4CAF50 0%, #2E7D32 50%, #4CAF50 100%)'
                    : 'linear-gradient(90deg, #3887A6 0%, #0C3559 50%, #3887A6 100%)',
                  borderRadius: '2px',
                  boxShadow: isActive ? '0 0 6px rgba(76, 175, 80, 0.4)' : '0 0 6px rgba(56, 135, 166, 0.4)',
                }}
              />
              {/* Rounded connector dot */}
              <div
                style={{
                  width: isMobile ? '3px' : isZoomedView ? '4px' : '6px',
                  height: isMobile ? '3px' : isZoomedView ? '4px' : '6px',
                  background: isActive
                    ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
                    : 'linear-gradient(135deg, #3887A6 0%, #0C3559 100%)',
                  borderRadius: '50%',
                  marginLeft: '-2px',
                  boxShadow: isActive ? '0 0 8px rgba(76, 175, 80, 0.5)' : '0 0 8px rgba(56, 135, 166, 0.5)',
                }}
              />
              {/* Label box with animation */}
              <div
                className={`${
                  isMobile ? 'px-1.5 py-0.5' : isZoomedView ? 'px-2 py-1' : 'px-4 py-2'
                } rounded-xl font-semibold flex flex-col gap-0.5`}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)'
                    : 'linear-gradient(135deg, #0C3559 0%, #0a2a47 100%)',
                  border: isActive
                    ? isMobile
                      ? '1px solid #4CAF50'
                      : '2px solid #4CAF50'
                    : isMobile
                    ? '1px solid #3887A6'
                    : '2px solid #3887A6',
                  borderRadius: isMobile ? '6px' : isZoomedView ? '8px' : '12px',
                  color: '#ffffff',
                  fontSize: isMobile ? '9px' : isZoomedView ? '10px' : '14px',
                  boxShadow: isActive
                    ? '0 4px 20px rgba(46, 125, 50, 0.4), 0 0 15px rgba(76, 175, 80, 0.3)'
                    : '0 4px 20px rgba(12, 53, 89, 0.4), 0 0 15px rgba(56, 135, 166, 0.3)',
                  marginLeft: '-2px',
                  cursor: audioUrl ? 'pointer' : 'default',
                  minWidth: showTranscription && transcription ? (isMobile ? '80px' : isZoomedView ? '120px' : '180px') : 'auto',
                  maxWidth: isMobile ? '120px' : 'none',
                }}
                onClick={e => {
                  e.stopPropagation();
                  if (audioUrl) playAudio();
                }}
              >
                <div className="flex items-center gap-1 whitespace-nowrap" style={{ gap: isMobile ? '2px' : '8px' }}>
                  {label}
                  {/* Animated bars when playing */}
                  {isActive && (
                    <div
                      style={{
                        display: 'flex',
                        gap: isMobile ? '1px' : '2px',
                        alignItems: 'flex-end',
                        height: isMobile ? '8px' : isZoomedView ? '10px' : '14px',
                        marginLeft: isMobile ? '2px' : '4px',
                      }}
                    >
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          style={{
                            width: isMobile ? '2px' : '3px',
                            background: '#fff',
                            borderRadius: '1px',
                            animation: `soundBarTooltip 0.5s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* Transcription shown for 8 seconds after audio plays */}
                {showTranscription && transcription && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: isMobile ? '7px' : isZoomedView ? '8px' : '12px',
                        fontWeight: 400,
                        fontStyle: 'italic',
                        opacity: 0.9,
                        whiteSpace: isMobile ? 'nowrap' : 'normal',
                        overflow: isMobile ? 'hidden' : 'visible',
                        textOverflow: isMobile ? 'ellipsis' : 'clip',
                        maxWidth: isMobile ? '100px' : 'none',
                        flex: 1,
                      }}
                    >
                      &ldquo;{transcription}&rdquo;
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTranscription();
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: isMobile ? '14px' : '18px',
                        height: isMobile ? '14px' : '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: isMobile ? '8px' : '10px',
                        color: '#fff',
                        flexShrink: 0,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <style>{`
            @keyframes tooltipAppear {
              0% {
                opacity: 0;
                transform: translateX(-20px);
              }
              100% {
                opacity: 1;
                transform: translateX(0);
              }
            }
            @keyframes soundBarTooltip {
              0% { height: 4px; }
              100% { height: 14px; }
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
  transcription?: string;
  type: 'point' | 'area'; // point = specific location, area = body region
}[] = [
  {
    id: 'testa',
    position: [0, 185, 3],
    label: 'Testa',
    yMin: 1.4,
    yMax: 2.0,
    size: 3,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Dottore, ho un forte mal di testa.',
    type: 'area',
  },
  {
    id: 'fronte',
    position: [0, 178, 6],
    label: 'Fronte',
    yMin: 1.3,
    yMax: 1.6,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Mi scotti la fronte, ho la febbre.',
    type: 'area',
  },
  {
    id: 'sopracciglio',
    position: [4, 175, 5.5],
    label: 'Sopracciglio',
    yMin: 1.25,
    yMax: 1.45,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Mi fa male sopra il sopracciglio.',
    type: 'point',
  },
  {
    id: 'occhio',
    position: [4, 173, 6],
    label: 'Occhio',
    yMin: 1.2,
    yMax: 1.4,
    size: 1,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "Ho l'occhio rosso e mi brucia.",
    type: 'point',
  },
  {
    id: 'naso',
    position: [0, 170, 12],
    label: 'Naso',
    yMin: 1.15,
    yMax: 1.35,
    size: 1,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho il naso chiuso da giorni.',
    type: 'point',
  },
  {
    id: 'labbro',
    position: [0.8, 166, 10],
    label: 'Labbro',
    yMin: 1.1,
    yMax: 1.25,
    size: 1,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Mi si è gonfiato il labbro.',
    type: 'point',
  },
  {
    id: 'bocca',
    position: [-1.2, 166, 12],
    label: 'Bocca',
    yMin: 1.05,
    yMax: 1.2,
    size: 1,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho un sapore amaro in bocca.',
    type: 'area',
  },
  {
    id: 'mento',
    position: [0, 162, 8],
    label: 'Mento',
    yMin: 1.0,
    yMax: 1.15,
    size: 1,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho un brufolo doloroso sul mento.',
    type: 'point',
  },
  {
    id: 'guancia',
    position: [7, 170, 4],
    label: 'Guancia',
    yMin: 1.2,
    yMax: 1.5,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'La guancia è gonfia per il dente.',
    type: 'area',
  },
  {
    id: 'mandibola',
    position: [5, 162, 5],
    label: 'Mandibola',
    yMin: 1.0,
    yMax: 1.3,
    size: 1,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Sento un click nella mandibola.',
    type: 'point',
  },
  {
    id: 'collo',
    position: [0, 157, 5],
    label: 'Collo',
    yMin: 0.8,
    yMax: 1.1,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Non riesco a girare il collo.',
    type: 'area',
  },
  {
    id: 'nuca',
    position: [0, 162, -12],
    label: 'Nuca',
    yMin: 0.9,
    yMax: 1.1,
    size: 1,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho rigidità alla nuca.',
    type: 'point',
  },
  {
    id: 'spalla',
    position: [17, 153, -1],
    label: 'Spalla',
    yMin: 0.6,
    yMax: 0.9,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho la spalla bloccata da ieri.',
    type: 'area',
  },
  {
    id: 'torace',
    position: [0, 140, 10],
    label: 'Torace',
    yMin: 0.6,
    yMax: 0.9,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Sento una pressione al torace.',
    type: 'area',
  },
  {
    id: 'schiena',
    position: [0, 135, -18],
    label: 'Schiena',
    yMin: 0.4,
    yMax: 0.9,
    size: 1.8,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho un dolore alla schiena.',
    type: 'area',
  },
  {
    id: 'lombare',
    position: [0, 110, -10],
    label: 'Lombare',
    yMin: 0.1,
    yMax: 0.4,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho mal di schiena nella zona lombare.',
    type: 'area',
  },
  {
    id: 'ascella',
    position: [17, 135, 2],
    label: 'Ascella',
    yMin: 0.5,
    yMax: 0.8,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "Ho un nodulo sotto l'ascella.",
    type: 'area',
  },
  {
    id: 'seno',
    position: [10, 130, 12],
    label: 'Seno',
    yMin: 0.5,
    yMax: 0.8,
    size: 1,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Sento un dolore al seno.',
    type: 'area',
  },
  {
    id: 'capezzolo',
    position: [12, 135, 11],
    label: 'Capezzolo',
    yMin: 0.5,
    yMax: 0.7,
    size: 0.8,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Il capezzolo mi fa male.',
    type: 'point',
  },
  {
    id: 'braccio',
    position: [22, 130, 0],
    label: 'Braccio',
    yMin: 0.3,
    yMax: 0.6,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Non riesco ad alzare il braccio.',
    type: 'area',
  },
  {
    id: 'gomito',
    position: [28, 120, -5],
    label: 'Gomito',
    yMin: 0.2,
    yMax: 0.5,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho sbattuto il gomito e fa male.',
    type: 'point',
  },
  {
    id: 'addome',
    position: [0, 125, 12],
    label: 'Addome',
    yMin: 0.3,
    yMax: 0.6,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "Se premo l'addome mi fa male.",
    type: 'area',
  },
  {
    id: 'ombelico',
    position: [0, 115, 15],
    label: 'Ombelico',
    yMin: 0.2,
    yMax: 0.5,
    size: 1.2,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "Ho dolore intorno all'ombelico.",
    type: 'point',
  },
  {
    id: 'fianco',
    position: [13, 105, -8],
    label: 'Fianco',
    yMin: 0.1,
    yMax: 0.4,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Mi fa male il fianco destro.',
    type: 'area',
  },
  {
    id: 'anca',
    position: [16, 100, 5],
    label: 'Anca',
    yMin: 0.05,
    yMax: 0.3,
    size: 1.3,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "L'anca mi fa male quando cammino.",
    type: 'area',
  },
  {
    id: 'avambraccio',
    position: [30, 109, 2],
    label: 'Avambraccio',
    yMin: 0.1,
    yMax: 0.4,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "Ho un crampo all'avambraccio.",
    type: 'area',
  },
  {
    id: 'natica',
    position: [6, 95, -15],
    label: 'Natica',
    yMin: 0.0,
    yMax: 0.3,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho dolore alla natica quando siedo.',
    type: 'area',
  },
  {
    id: 'ano',
    position: [0, 95, -15],
    label: 'Ano',
    yMin: -0.1,
    yMax: 0.1,
    size: 1.2,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "Ho dolore vicino all'ano.",
    type: 'point',
  },
  {
    id: 'genitali',
    position: [0, 85, 15],
    label: 'Genitali',
    yMin: 0.0,
    yMax: 0.2,
    size: 1.3,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho bruciore ai genitali.',
    type: 'area',
  },
  {
    id: 'inguine',
    position: [0, 93, 12],
    label: 'Inguine',
    yMin: 0.0,
    yMax: 0.2,
    size: 1.3,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "Sento dolore all'inguine.",
    type: 'area',
  },
  {
    id: 'coscia',
    position: [6, 75, 10],
    label: 'Coscia',
    yMin: -0.1,
    yMax: 0.2,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho uno strappo alla coscia.',
    type: 'area',
  },
  {
    id: 'ginocchio',
    position: [6, 50, 6],
    label: 'Ginocchio',
    yMin: -0.2,
    yMax: 0.1,
    size: 1.3,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Il ginocchio scricchiola quando piego.',
    type: 'point',
  },
  {
    id: 'gamba',
    position: [15, 55, 8],
    label: 'Gamba',
    yMin: -0.3,
    yMax: 0.0,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho la gamba addormentata.',
    type: 'area',
  },
  {
    id: 'tibia',
    position: [8, 35, 4],
    label: 'Tibia',
    yMin: -0.35,
    yMax: -0.05,
    size: 1.3,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho preso un colpo sulla tibia.',
    type: 'area',
  },
  {
    id: 'polpaccio',
    position: [6, 35, -11],
    label: 'Polpaccio',
    yMin: -0.35,
    yMax: -0.05,
    size: 1.3,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho un crampo al polpaccio.',
    type: 'area',
  },
  {
    id: 'caviglia',
    position: [7, 12, 2],
    label: 'Caviglia',
    yMin: -0.4,
    yMax: -0.1,
    size: 1.2,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Mi sono storto la caviglia.',
    type: 'point',
  },
  {
    id: 'piede',
    position: [8, 5, 10],
    label: 'Piede',
    yMin: -0.5,
    yMax: -0.2,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho il piede gonfio.',
    type: 'area',
  },
  {
    id: 'tallone',
    position: [8, 3, -12],
    label: 'Tallone',
    yMin: -0.5,
    yMax: -0.2,
    size: 1.2,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Mi fa male il tallone al mattino.',
    type: 'point',
  },
  {
    id: 'polso',
    position: [30, 98, 6],
    label: 'Polso',
    yMin: 0.1,
    yMax: 0.3,
    size: 1.2,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho il polso debole.',
    type: 'point',
  },
  {
    id: 'mano',
    position: [42, 92, 9],
    label: 'Mano',
    yMin: 0.1,
    yMax: 0.3,
    size: 1.5,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'La mano mi trema.',
    type: 'area',
  },
  {
    id: 'palmo',
    position: [30, 90, 6],
    label: 'Palmo',
    yMin: 0.1,
    yMax: 0.3,
    size: 1.2,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho prurito sul palmo della mano.',
    type: 'area',
  },
  {
    id: 'dito',
    position: [32, 85, 10],
    label: 'Dito',
    yMin: 0.1,
    yMax: 0.3,
    size: 1.0,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Mi sono tagliato il dito.',
    type: 'point',
  },
  // Dedos da mão esquerda (base)
  {
    id: 'pollice',
    position: [38, 90, 12.5],
    label: 'Pollice',
    yMin: 0.3,
    yMax: 0.5,
    size: 0.8,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Non riesco a muovere il pollice.',
    type: 'point',
  },
  {
    id: 'indice',
    position: [38, 80, 9.5],
    label: 'Indice',
    yMin: 0.3,
    yMax: 0.5,
    size: 0.8,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "Ho l'indice intorpidito.",
    type: 'point',
  },
  {
    id: 'medio',
    position: [33, 77, 9.5],
    label: 'Medio',
    yMin: 0.3,
    yMax: 0.5,
    size: 0.8,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Il dito medio è gonfio.',
    type: 'point',
  },
  {
    id: 'anulare',
    position: [29, 79, 9],
    label: 'Anulare',
    yMin: 0.3,
    yMax: 0.5,
    size: 0.8,
    audioUrl: getAudioPath('testa.wav'),
    transcription: "L'anulare non si piega bene.",
    type: 'point',
  },
  {
    id: 'mignolo',
    position: [26, 82, 9],
    label: 'Mignolo',
    yMin: 0.3,
    yMax: 0.5,
    size: 0.8,
    audioUrl: getAudioPath('testa.wav'),
    transcription: 'Ho sbattuto il mignolo.',
    type: 'point',
  },
];

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

// Head hotspots configuration
const HEAD_HOTSPOTS = [
  { id: 'testa', label: 'Testa' },
  { id: 'fronte', label: 'Fronte' },
  { id: 'sopracciglio', label: 'Sopracciglio' },
  { id: 'occhio', label: 'Occhio' },
  { id: 'naso', label: 'Naso' },
  { id: 'labbro', label: 'Labbro' },
  { id: 'bocca', label: 'Bocca' },
  { id: 'mento', label: 'Mento' },
  { id: 'guancia', label: 'Guancia' },
  { id: 'mandibola', label: 'Mandibola' },
  { id: 'collo', label: 'Collo' },
];

// Torso hotspots configuration
const TORSO_HOTSPOTS = [
  { id: 'spalla', label: 'Spalla' },
  { id: 'torace', label: 'Torace' },
  { id: 'ascella', label: 'Ascella' },
  { id: 'seno', label: 'Seno' },
  { id: 'capezzolo', label: 'Capezzolo' },
  { id: 'addome', label: 'Addome' },
  { id: 'ombelico', label: 'Ombelico' },
  { id: 'fianco', label: 'Fianco' },
  { id: 'braccio', label: 'Braccio' },
  { id: 'gomito', label: 'Gomito' },
  { id: 'anca', label: 'Anca' },
  { id: 'natica', label: 'Natica' },
  { id: 'genitali', label: 'Genitali' },
  { id: 'inguine', label: 'Inguine' },
  { id: 'avambraccio', label: 'Avambraccio' },
];

// Legs hotspots configuration
const LEGS_HOTSPOTS = [
  { id: 'coscia', label: 'Coscia' },
  { id: 'ginocchio', label: 'Ginocchio' },
  { id: 'gamba', label: 'Gamba' },
  { id: 'tibia', label: 'Tibia' },
  { id: 'polpaccio', label: 'Polpaccio' },
  { id: 'caviglia', label: 'Caviglia' },
  { id: 'piede', label: 'Piede' },
  { id: 'tallone', label: 'Tallone' },
];

// Hand hotspots configuration
const HAND_HOTSPOTS = [
  { id: 'polso', label: 'Polso' },
  { id: 'mano', label: 'Mano' },
  { id: 'palmo', label: 'Palmo' },
  { id: 'dito', label: 'Dito' },
  { id: 'pollice', label: 'Pollice' },
  { id: 'indice', label: 'Indice' },
  { id: 'medio', label: 'Medio' },
  { id: 'anulare', label: 'Anulare' },
  { id: 'mignolo', label: 'Mignolo' },
];

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
                        Pratica clinica
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
