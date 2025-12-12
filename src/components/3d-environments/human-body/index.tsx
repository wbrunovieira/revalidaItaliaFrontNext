'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, RoundedBox, useGLTF, Html, Text } from '@react-three/drei';
import { useTranslations } from 'next-intl';
import * as THREE from 'three';
import { Environment3DProps } from '../registry';
import Environment3DContainer from '../Environment3DContainer';

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

// Medical monitor
function MedicalMonitor() {
  return (
    <group position={[2.5, 0.5, -2]} rotation={[0, -0.4, 0]}>
      {/* Stand */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 16]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Base */}
      <mesh position={[0, -1.55, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Screen frame */}
      <RoundedBox args={[0.8, 0.6, 0.05]} radius={0.02} position={[0, 0, 0]}>
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
      </RoundedBox>

      {/* Screen */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshStandardMaterial color="#001a33" emissive="#003366" emissiveIntensity={0.3} />
      </mesh>

      {/* Screen content - heartbeat line */}
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[0.6, 0.02]} />
        <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

// Medical cabinet
function MedicalCabinet() {
  return (
    <group position={[-4, 0, -3]} rotation={[0, 0.3, 0]}>
      {/* Cabinet body */}
      <RoundedBox args={[1.2, 2, 0.5]} radius={0.02} position={[0, 0, 0]}>
        <meshStandardMaterial color="#e8eef2" roughness={0.7} />
      </RoundedBox>

      {/* Glass doors */}
      <mesh position={[0, 0.2, 0.26]}>
        <planeGeometry args={[1.1, 1.5]} />
        <meshStandardMaterial color="#a8c8d8" transparent opacity={0.3} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Shelves visible through glass */}
      {[-0.4, 0, 0.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[1.1, 0.02, 0.4]} />
          <meshStandardMaterial color="#d0d8e0" />
        </mesh>
      ))}

      {/* Handle */}
      <mesh position={[0.45, 0.2, 0.28]}>
        <boxGeometry args={[0.03, 0.2, 0.03]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>
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
          <mesh
            key={i}
            position={[0, 0.85 - i * 0.15, 0]}
            rotation={[0.3, 0, 0]}
          >
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

// Small decorative plant
function SmallPlant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const potColor = '#8B4513';
  const leafColor = '#2d5a27';
  const leafColorLight = '#3d7a37';

  return (
    <group position={position} scale={scale}>
      {/* Pot */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.12, 0.3, 16]} />
        <meshStandardMaterial color={potColor} roughness={0.8} />
      </mesh>
      {/* Pot rim */}
      <mesh position={[0, 0.31, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.15, 0.04, 16]} />
        <meshStandardMaterial color={potColor} roughness={0.8} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.32, 0]} receiveShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
        <meshStandardMaterial color="#3a2a1a" roughness={1} />
      </mesh>

      {/* Main leaves - oval shaped using scaled spheres */}
      {[0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4].map((angle, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          position={[
            Math.sin(angle) * 0.06,
            0.42 + (i % 3) * 0.05,
            Math.cos(angle) * 0.06,
          ]}
          rotation={[0.5 + (i % 3) * 0.15, angle, 0.3 - (i % 2) * 0.2]}
          scale={[1, 2.5, 0.15]}
        >
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? leafColor : leafColorLight}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* Center stem */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.3, 8]} />
        <meshStandardMaterial color="#2a4a22" roughness={0.7} />
      </mesh>

      {/* Top smaller leaves - teardrop shape */}
      {[0, 1.0, 2.0, 3.0, 4.0, 5.0].map((angle, i) => (
        <mesh
          key={`top-${i}`}
          castShadow
          receiveShadow
          position={[
            Math.sin(angle) * 0.04,
            0.58 + i * 0.025,
            Math.cos(angle) * 0.04,
          ]}
          rotation={[0.6 + (i % 2) * 0.2, angle, 0.25]}
          scale={[0.8, 2, 0.12]}
        >
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? leafColorLight : leafColor}
            roughness={0.5}
          />
        </mesh>
      ))}

      {/* Tiny accent leaves at top */}
      {[0.5, 2.0, 3.5, 5.0].map((angle, i) => (
        <mesh
          key={`tiny-${i}`}
          castShadow
          position={[
            Math.sin(angle) * 0.02,
            0.72 + i * 0.01,
            Math.cos(angle) * 0.02,
          ]}
          rotation={[0.3, angle, 0.4]}
          scale={[0.6, 1.5, 0.1]}
        >
          <sphereGeometry args={[0.025, 6, 4]} />
          <meshStandardMaterial color={leafColorLight} roughness={0.5} />
        </mesh>
      ))}
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
      <Text
        fontSize={0.7}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
        fontWeight={700}
      >
        Revalida Italia
        <meshStandardMaterial color="#0C3559" metalness={0.2} roughness={0.4} />
      </Text>
    </group>
  );
}

// IV Stand decoration
function IVStand() {
  return (
    <group position={[-3, -1.1, -3.5]}>
      {/* Base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.1, 6]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Pole */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 16]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Top hook holder */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Hooks */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.sin(angle) * 0.15, 1.95, Math.cos(angle) * 0.15]}
          rotation={[0, angle, -Math.PI / 6]}
        >
          <cylinderGeometry args={[0.01, 0.01, 0.15, 8]} />
          <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// Human body 3D model path
// In production, Nginx proxies /public/ to S3; in dev, Next.js serves from public/ at root
const MODEL_PATH = process.env.NODE_ENV === 'production'
  ? '/public/models/human-body/anatomy-internal.glb'
  : '/models/human-body/anatomy-internal.glb';

// Complete mesh catalog organized by category
const MESH_CATEGORIES = {
  skin: {
    label: 'Pele/Superfície',
    color: '#f4a460',
    meshes: ['body', 'eyes', 'eyebrows', 'eyelashes'],
  },
  skeleton_head: {
    label: 'Esqueleto - Cabeça',
    color: '#f8f9fa',
    meshes: ['skull', 'jaw_bone', 'upper_teeth', 'lover_teeth', 'hyoid_bone', 'hyoid_bone_skeletal'],
  },
  skeleton_spine: {
    label: 'Esqueleto - Coluna',
    color: '#f8f9fa',
    meshes: ['cervical_spine', 'thoracic_spine', 'lumbar_spine', 'sacrum', 'coccyx', 'intervertebral_disks'],
  },
  skeleton_torso: {
    label: 'Esqueleto - Tórax/Pelve',
    color: '#f8f9fa',
    meshes: ['thorax', 'sternum', 'costal_cartilage', 'ilium', 'pubic_symphysis'],
  },
  skeleton_arm_left: {
    label: 'Esqueleto - Braço Esq.',
    color: '#f8f9fa',
    meshes: ['l_clavicle', 'l_scapula', 'l_humerus', 'l_radius', 'l_ulna', 'l_wrist', 'l_metacarpal_bones', 'l_finger_bones'],
  },
  skeleton_arm_right: {
    label: 'Esqueleto - Braço Dir.',
    color: '#f8f9fa',
    meshes: ['r_clavicle', 'r_scapula', 'r_humerus', 'r_radius', 'r_ulna', 'r_wrist', 'r_metacarpal_bones', 'r_finger_bones'],
  },
  skeleton_leg_left: {
    label: 'Esqueleto - Perna Esq.',
    color: '#f8f9fa',
    meshes: ['l_femur', 'l_patella', 'l_tibia', 'l_fibula', 'l_talus', 'l_calcaneum', 'l_tarsal_bones', 'l_metatarsal_bones', 'l_phalanges'],
  },
  skeleton_leg_right: {
    label: 'Esqueleto - Perna Dir.',
    color: '#f8f9fa',
    meshes: ['r_femur', 'r_patella', 'r_tibia', 'r_fibula', 'r_talus', 'r_calcaneum', 'r_tarsal_bones', 'r_metatarsal_bones', 'r_phalanges'],
  },
  organs_digestive: {
    label: 'Órgãos - Digestivo',
    color: '#9b59b6',
    meshes: ['esophagus', 'stomach', 'small_intestine', 'colon', 'appendix', 'liver_right', 'liver_left', 'gallbladder', 'hepatic_duct', 'pancreas', 'spleen'],
  },
  organs_respiratory: {
    label: 'Órgãos - Respiratório',
    color: '#3498db',
    meshes: ['pharynx', 'lungs', 'bronch'],
  },
  organs_urinary: {
    label: 'Órgãos - Urinário',
    color: '#f39c12',
    meshes: ['kidneys', 'ureter', 'bladder', 'urethra', 'adrenal_glands'],
  },
  organs_reproductive: {
    label: 'Órgãos - Reprodutor',
    color: '#e91e63',
    meshes: ['testis', 'epididymis', 'vas_deferens', 'seminal_vesicle', 'prostate', 'corpus_cavernosum', 'corpus_spongiosum', 'glans_penis'],
  },
  organs_glands: {
    label: 'Órgãos - Glândulas',
    color: '#00bcd4',
    meshes: ['thyroid', 'thyroid_cartilage', 'cricoid_cartilage', 'arytenoid_cartilage', 'corniculate_cartilage', 'thyrohyoid_membrane'],
  },
  nervous: {
    label: 'Sistema Nervoso',
    color: '#f1c40f',
    meshes: ['nerves', 'brain'],
  },
  circulatory: {
    label: 'Sistema Circulatório',
    color: '#e74c3c',
    meshes: ['heart', 'vessels_red', 'vessels_blue'],
  },
  muscles_face: {
    label: 'Músculos - Face',
    color: '#dc3545',
    meshes: [
      'frontalis', 'orbicularis_oris', 'nose_muscle', 'nasalis_transverse',
      'l_temporalis', 'r_temporalis', 'l_masseter_deep', 'r_masseter_deep', 'l_masseter_superior', 'r_masseter_superior',
      'l_orbicularis_oculi', 'r_orbicularis_oculi', 'l_procerus', 'r_procerus',
      'l_corrugator_supercilii', 'r_corrugator_supercilii', 'l_depressor_supercilii', 'r_depressor_supercilii',
      'l_nasalis_alar', 'r_nasalis_alar', 'l_levator_labii_superioris', 'r_levator_labii_superioris',
      'l_levator_labii_superioris_alaeque_nasi_muscle', 'r_levator_labii_superioris_alaeque_nasi_muscle',
      'l_levator_anguli_oris', 'r_levator_anguli_oris', 'l_zygomaticus_major', 'r_zygomaticus_major',
      'l_zygomaticus_minor', 'r_zygomaticus_minor', 'l_risorius', 'r_risorius',
      'l_buccinator', 'r_buccinator', 'l_depressor_anguli_oris', 'r_depressor_anguli_oris',
      'l_depressor_labii_inferioris', 'r_depressor_labii_inferioris', 'l_mentalis', 'r_mentalis',
      'l_platysma', 'r_platysma',
    ],
  },
  muscles_neck: {
    label: 'Músculos - Pescoço',
    color: '#dc3545',
    meshes: [
      'l_sternocleidomastoid', 'r_sternocleidomastoid', 'l_sternohyoid', 'r_sternohyoid',
      'l_sternothyroid', 'r_sternothyroid', 'l_splenius_capitis', 'r_splenius_capitis',
    ],
  },
  muscles_torso: {
    label: 'Músculos - Tronco',
    color: '#dc3545',
    meshes: [
      'rectus_abdominis', 'transverse_abdominis', 'external_oblique_001', 'external_oblique_002',
      'l_internal_oblique', 'r_internal_oblique', 'l_quadratus_lumborum', 'r_quadratus_lumborum',
      'spinalis', 'l_iliocostalis', 'r_iliocostalis', 'l_longissimus_thoracis', 'r_longissimus_thoracis',
      'levator_ani', 'coccygeus', 'pubococcygeus',
    ],
  },
  muscles_shoulder: {
    label: 'Músculos - Ombro/Braço',
    color: '#dc3545',
    meshes: [
      'l_trapezius', 'r_trapezius', 'l_deltoit', 'r_deltoit', 'l_supraspinatus', 'r_supraspinatus',
      'l_infraspinatus', 'r_infraspinatus', 'l_teres_major', 'r_teres_major', 'l_teres_minor', 'r_teres_minor',
      'l_subscapularis', 'r_subscapularis', 'l_rhomboid_major', 'r_rhomboid_major',
      'l_rhomboid_minor', 'r_rhomboid_minor', 'l_serratus_anterior', 'r_serratus_anterior',
      'l_pectoralis_major', 'r_pectoralis_major', 'l_pectoralis_minor', 'r_pectoralis_minor',
      'l_subclavius', 'r_subclavius', 'l_latissimus_dorsi', 'r_latissimus_dorsi',
      'l_bicep_brachii_long_head', 'r_bicep_brachii_long_head', 'l_bicep_brachii_short_head', 'r_bicep_brachii_short_head',
      'l_bicipital_aponeurosis', 'r_bicipital_aponeurosis', 'l_brachialis', 'r_brachialis',
      'l_brachioradialis', 'r_brachioradialis', 'l_triceps_long_head', 'r_triceps_long_head',
      'l_triceps_lateral_head', 'r_triceps_lateral_head', 'l_triceps_medial_head', 'r_triceps_medial_head',
      'l_triceps_tendon_medial_head', 'r_triceps_tendon_medial_head', 'l_anconeus', 'r_anconeus',
    ],
  },
  muscles_forearm: {
    label: 'Músculos - Antebraço',
    color: '#dc3545',
    meshes: [
      'l_pronator_teres', 'r_pronator_teres', 'l_pronator_quadratus', 'r_pronator_quadratus',
      'l_supinator', 'r_supinator', 'l_flexor_carpi_radialis', 'r_flexor_carpi_radialis',
      'l_flexor_carpi_ulnaris', 'r_flexor_carpi_ulnaris', 'l_palmaris_longus', 'r_palmaris_longus',
      'l_flexor_digitorum_superficialis', 'r_flexor_digitorum_superficialis',
      'l_flexor_digitorum_profundus', 'r_flexor_digitorum_profundus',
      'l_flexor_pollicis_longus', 'r_flexor_pollicis_longus',
      'l_extensor_carpi_radialis_longus', 'r_extensor_carpi_radialis_longus',
      'l_extensor_carpi_radialis_brevis', 'r_extensor_carpi_radialis_brevis',
      'l_extensor_carpi_ulnaris', 'r_extensor_carpi_ulnaris',
      'l_extensor_digitorum', 'r_extensor_digitorum', 'l_extensor_indicis', 'r_extensor_indicis',
      'l_extensor_pollicis_longus', 'r_extensor_pollicis_longus',
      'l_extensor_pollicis_brevis', 'r_extensor_pollicis_brevis',
      'l_abductor_pollicis_longus', 'r_abductor_pollicis_longus', 'l_retinaculum', 'r_retinaculum',
    ],
  },
  muscles_hand: {
    label: 'Músculos - Mão',
    color: '#dc3545',
    meshes: [
      'l_abductor_pollicis_brevis', 'r_abductor_pollicis_brevis',
      'l_flexor_pollicis_brevis', 'r_flexor_pollicis_brevis',
      'l_opponens_pollicis', 'r_opponens_pollicis', 'l_adductor_pollicis', 'r_adductor_pollicis',
      'l_abductor_digiti_minimi', 'r_abductor_digiti_minimi',
      'l_flexor_digiti_minimi_brevis', 'r_flexor_digiti_minimi_brevis',
      'l_opponens_digiti_minimi', 'r_opponens_digiti_minimi',
      'l_lumbrical_1', 'r_lumbrical_1', 'l_lumbrical_2', 'r_lumbrical_2',
      'l_lumbrical_3', 'r_lumbrical_3', 'l_lumbrical_4', 'r_lumbrical_4',
      'l_palmar_interossei_1', 'r_palmar_interossei_1', 'l_palmar_interossei_2', 'r_palmar_interossei_2',
      'l_palmar_interossei_3', 'r_palmar_interossei_3', 'l_palmar_interossei_4', 'r_palmar_interossei_4',
      'l_dorsal_interossei', 'r_dorsal_interossei', 'l_dorsal_interossei_2a', 'r_dorsal_interossei_2a',
      'l_dorsal_interossei_2b', 'r_dorsal_interossei_2b', 'l_dorsal_interossei_3a', 'r_dorsal_interossei_3a',
      'l_dorsal_interossei_3b', 'r_dorsal_interossei_3b', 'l_dorsal_interossei_4a', 'r_dorsal_interossei_4a',
      'l_dorsal_interossei_4b', 'r_dorsal_interossei_4b',
    ],
  },
  muscles_hip_thigh: {
    label: 'Músculos - Quadril/Coxa',
    color: '#dc3545',
    meshes: [
      'l_psoas_major', 'r_psoas_major', 'l_psoas_minor', 'r_psoas_minor', 'l_iliacus', 'r_iliacus',
      'l_gluteus_maximus', 'r_gluteus_maximus', 'l_gluteus_medius', 'r_gluteus_medius',
      'l_gluteus_minimus', 'r_gluteus_minimus', 'l_tensor_fasciae_latae', 'r_tensor_fasciae_latae',
      'l_piriformis', 'r_piriformis', 'l_obturator_externus', 'r_obturator_externus',
      'l_sacrotuberous_ligament_muscle', 'r_sacrotuberous_ligament_muscle',
      'l_rectus_femoris', 'r_rectus_femoris', 'l_vastus_lateralis', 'r_vastus_lateralis',
      'l_vastus_medialis', 'r_vastus_medialis', 'l_vastus_intermedius', 'r_vastus_intermedius',
      'l_sartorius', 'r_sartorius', 'l_gracilis', 'r_gracilis', 'l_pectineus', 'r_pectineus',
      'l_adductor_longus', 'r_adductor_longus', 'l_adductor_magnus', 'r_adductor_magnus',
      'l_bicep_femoris_longus', 'r_bicep_femoris_longus', 'l_semitendinosus', 'r_semitendinosus',
      'l_semimembranosus', 'r_semimembranosus', 'l_patellar_tendon', 'r_patellar_tendon',
    ],
  },
  muscles_leg: {
    label: 'Músculos - Perna',
    color: '#dc3545',
    meshes: [
      'l_gastrocnemius_medial_head', 'r_gastrocnemius_medial_head',
      'l_gastrocnemius_lateral_head', 'r_gastrocnemius_lateral_head',
      'l_soleus', 'r_soleus', 'l_calcaneofibular_achilles_tendon', 'r_calcaneofibular_achilles_tendon',
      'l_tibialis_anterior', 'r_tibialis_anterior', 'l_tibialis_posterior', 'r_tibialis_posterior',
      'l_peroneus_longus', 'r_peroneus_longus', 'l_peroneus_brevis', 'r_peroneus_brevis',
      'l_extensor_digitorum_longus', 'r_extensor_digitorum_longus',
      'l_extensor_digitorum_brevis', 'r_extensor_digitorum_brevis',
      'l_extensor_hallucis_longus', 'r_extensor_hallucis_longus',
      'l_extensor_hallucis_brevis', 'r_extensor_hallucis_brevis',
      'l_flexor_digitorum_longus', 'r_flexor_digitorum_longus',
      'l_flexor_digitorum_brevis', 'r_flexor_digitorum_brevis',
      'l_flexor_hallucis_longus', 'r_flexor_hallucis_longus',
    ],
  },
  muscles_foot: {
    label: 'Músculos - Pé',
    color: '#dc3545',
    meshes: [
      'l_abductor_hallucis', 'r_abductor_hallucis',
      'l_abductor_digiti_minimi_foot', 'r_abductor_digiti_minimi_foot',
    ],
  },
};

// Helper to get all meshes as flat array
const ALL_MESHES = Object.values(MESH_CATEGORIES).flatMap(cat => cat.meshes);

// Hotspot component for interactive anatomy points
interface HotspotProps {
  position: [number, number, number];
  label: string;
  onHover?: (isHovered: boolean) => void;
}

function Hotspot({ position, label, onHover }: HotspotProps) {
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(false);
  };

  return (
    <group position={position}>
      {/* Hotspot point */}
      <mesh onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#3887A6' : '#0C3559'}
          emissive={hovered ? '#3887A6' : '#0C3559'}
          emissiveIntensity={hovered ? 1.2 : 0.6}
        />
      </mesh>

      {/* Pulsing ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.06, 32]} />
        <meshStandardMaterial color="#3887A6" transparent opacity={hovered ? 0.9 : 0.5} />
      </mesh>

      {/* Label tooltip - positioned to the right */}
      {hovered && (
        <Html
          position={[0, 0, 0]}
          distanceFactor={6}
          center={false}
          style={{
            pointerEvents: 'none',
            transform: 'translate(0, -50%)',
          }}
        >
          <div className="flex items-center">
            {/* Connector line - full length */}
            <div
              style={{
                width: '80px',
                height: '2px',
                backgroundColor: '#3887A6',
              }}
            />
            {/* Label box */}
            <div
              className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shadow-xl"
              style={{
                backgroundColor: '#0C3559',
                border: '2px solid #3887A6',
                color: '#ffffff',
              }}
            >
              {label}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Anatomy hotspots data (positions relative to model)
// yMin/yMax define the vertical range of meshes to highlight
const ANATOMY_HOTSPOTS: {
  id: string;
  position: [number, number, number];
  label: string;
  yMin: number;
  yMax: number;
}[] = [{ id: 'testa', position: [0, 1.65, 0.12], label: 'Testa', yMin: 1.4, yMax: 2.0 }];

interface HumanBodyModelProps {
  rotation: number;
  selectedMeshes: Set<string>;
}

function HumanBodyModel({ rotation, selectedMeshes }: HumanBodyModelProps) {
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

  // Update visibility based on selected meshes
  const selectedMeshesRef = useRef(selectedMeshes);
  selectedMeshesRef.current = selectedMeshes;

  useFrame(() => {
    // Traverse cloned scene directly to update visibility
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name.toLowerCase();

        if (selectedMeshesRef.current.size === 0) {
          // No mesh selected - show all
          child.visible = true;
        } else {
          // Show only the selected meshes
          child.visible = selectedMeshesRef.current.has(meshName);
        }
      }
    });
  });

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
  const modelSettings = { scale: 0.012, baseY: -1.0, rotationOffset: Math.PI };

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

      {/* Anatomy hotspots - only show when no mesh selected (all visible) */}
      {selectedMeshes.size === 0 && ANATOMY_HOTSPOTS.map(hotspot => (
        <Hotspot
          key={hotspot.id}
          position={hotspot.position}
          label={hotspot.label}
          onHover={isHovered => handleHotspotHover(hotspot.id, isHovered)}
        />
      ))}
    </group>
  );
}

// Preload model
useGLTF.preload(MODEL_PATH);

// Scene component with all 3D elements
interface SceneProps {
  bodyRotation: number;
  selectedMeshes: Set<string>;
  freeCameraMode: boolean;
}

function Scene({ bodyRotation, selectedMeshes, freeCameraMode }: SceneProps) {
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
      <CeilingLights />
      <MedicalMonitor />
      <MedicalCabinet />
      <IVStand />
      <SmallPlant position={[5.3, -1.1, 3.8]} scale={1.5} />
      <SmallPlant position={[-5.3, -1.1, 3.8]} />

      {/* Human body model (rotates horizontally) */}
      <HumanBodyModel rotation={bodyRotation} selectedMeshes={selectedMeshes} />

      {/* Environment for subtle reflections */}
      <Environment preset="apartment" />

      {/* Camera controls - restricted or free based on mode */}
      <OrbitControls
        target={[0, 0.5, 0]}
        enablePan={freeCameraMode}
        enableZoom={true}
        enableRotate={freeCameraMode}
        minDistance={freeCameraMode ? 0.5 : 2}
        maxDistance={freeCameraMode ? 20 : 8}
        maxPolarAngle={freeCameraMode ? Math.PI : Math.PI / 2}
        minPolarAngle={freeCameraMode ? 0 : Math.PI / 4}
      />
    </>
  );
}

// Mesh button component for individual mesh selection
interface MeshButtonProps {
  meshName: string;
  isSelected: boolean;
  onSelect: () => void;
  color: string;
}

function MeshButton({ meshName, isSelected, onSelect, color }: MeshButtonProps) {
  // Format mesh name for display
  const displayName = meshName
    .replace(/^[lr]_/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return (
    <button
      onClick={onSelect}
      className={`
        px-2 py-1 rounded text-[10px] font-medium transition-all duration-200
        border whitespace-nowrap
        ${isSelected
          ? 'text-white shadow-md border-transparent'
          : 'bg-black/20 text-white/70 border-white/10 hover:bg-black/40 hover:text-white'
        }
      `}
      style={isSelected ? { backgroundColor: color, borderColor: color } : {}}
    >
      {displayName}
    </button>
  );
}

// Category accordion component
interface CategoryAccordionProps {
  categoryKey: string;
  category: { label: string; color: string; meshes: string[] };
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedMeshes: Set<string>;
  onSelectMesh: (mesh: string) => void;
  onSelectCategory: (meshes: string[]) => void;
}

function CategoryAccordion({
  category,
  isExpanded,
  onToggleExpand,
  selectedMeshes,
  onSelectMesh,
  onSelectCategory,
}: CategoryAccordionProps) {
  // Count how many meshes from this category are selected
  const selectedCount = category.meshes.filter(m => selectedMeshes.has(m)).length;
  const isFullySelected = selectedCount === category.meshes.length && selectedCount > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < category.meshes.length;

  const handleHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCategory(category.meshes);
  };

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <div className="flex items-center">
        {/* Category selection button */}
        <button
          onClick={handleHeaderClick}
          className={`
            px-2 py-1.5 text-left text-[11px] font-medium transition-all
            flex items-center gap-1.5 flex-1
            ${isFullySelected ? 'text-white bg-white/10' : isPartiallySelected ? 'text-white/90' : 'text-white/80 hover:text-white hover:bg-white/5'}
          `}
          title="Clique para selecionar todo o grupo"
        >
          {/* Selection indicator */}
          <span
            className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-all flex-shrink-0`}
            style={{
              borderColor: category.color,
              backgroundColor: isFullySelected ? category.color : 'transparent'
            }}
          >
            {isFullySelected && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {isPartiallySelected && (
              <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: category.color }} />
            )}
          </span>
          <span className="truncate">{category.label}</span>
          <span className="text-white/40 text-[9px]">
            {selectedCount > 0 ? `${selectedCount}/` : ''}{category.meshes.length}
          </span>
        </button>

        {/* Expand/collapse button */}
        <button
          onClick={onToggleExpand}
          className="px-2 py-1.5 text-white/60 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="px-2 pb-2 flex flex-wrap gap-1">
          {category.meshes.map(mesh => (
            <MeshButton
              key={mesh}
              meshName={mesh}
              isSelected={selectedMeshes.has(mesh)}
              onSelect={() => onSelectMesh(mesh)}
              color={category.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HumanBodyEnvironment({ }: Environment3DProps) {
  const t = useTranslations('Environment3D');
  const [bodyRotation, setBodyRotation] = useState(0);
  const [selectedMeshes, setSelectedMeshes] = useState<Set<string>>(new Set());
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [freeCameraMode, setFreeCameraMode] = useState(false);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const toggleCategoryExpand = useCallback((categoryKey: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  }, []);

  // Single mesh selection - clears previous and selects only this one
  const handleSelectMesh = useCallback((mesh: string) => {
    setSelectedMeshes(prev => {
      // If already selected, deselect it
      if (prev.has(mesh) && prev.size === 1) {
        return new Set();
      }
      // Otherwise, select only this mesh
      return new Set([mesh]);
    });
  }, []);

  // Category selection - selects all meshes in the category
  const handleSelectCategory = useCallback((meshes: string[]) => {
    setSelectedMeshes(prev => {
      // Check if all meshes in category are already selected
      const allSelected = meshes.every(m => prev.has(m));
      if (allSelected) {
        // Deselect all from this category
        const next = new Set(prev);
        meshes.forEach(m => next.delete(m));
        return next;
      } else {
        // Select all from this category (replace current selection)
        return new Set(meshes);
      }
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedMeshes(new Set());
  }, []);

  const handleReset = useCallback(() => {
    setBodyRotation(0);
    setSelectedMeshes(new Set());
    setExpandedCategories(new Set());
    setSearchTerm('');
    setFreeCameraMode(false);
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

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return MESH_CATEGORIES;

    const term = searchTerm.toLowerCase();
    const result: typeof MESH_CATEGORIES = {} as typeof MESH_CATEGORIES;

    Object.entries(MESH_CATEGORIES).forEach(([key, cat]) => {
      const filteredMeshes = cat.meshes.filter(m =>
        m.toLowerCase().includes(term) ||
        m.replace(/_/g, ' ').toLowerCase().includes(term)
      );
      if (filteredMeshes.length > 0) {
        result[key as keyof typeof MESH_CATEGORIES] = {
          ...cat,
          meshes: filteredMeshes,
        };
      }
    });

    return result;
  }, [searchTerm]);

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
          <Scene bodyRotation={bodyRotation} selectedMeshes={selectedMeshes} freeCameraMode={freeCameraMode} />
        </Canvas>

        {/* Camera Mode Toggle - Left Side */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => setFreeCameraMode(!freeCameraMode)}
            className={`
              px-3 py-2 rounded-lg font-medium text-sm transition-all
              flex items-center gap-2 shadow-lg
              ${freeCameraMode
                ? 'bg-[#3887A6] hover:bg-[#2d6d8a] text-white'
                : 'bg-[#0C3559] hover:bg-[#0a2a47] text-white'
              }
            `}
            title={freeCameraMode ? 'Voltar para câmera fixa' : 'Ativar câmera livre'}
          >
            {freeCameraMode ? (
              // Unlock icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
              </svg>
            ) : (
              // Lock icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
            <span className="hidden sm:inline">
              {freeCameraMode ? 'Câmera Livre' : 'Câmera Fixa'}
            </span>
          </button>

          {/* Instructions when free mode is active */}
          {freeCameraMode && (
            <div className="mt-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] text-white/70 max-w-[160px]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[#3887A6]">●</span> Arraste: Rotacionar
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[#3887A6]">●</span> Scroll: Zoom
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#3887A6]">●</span> Shift+Arraste: Mover
              </div>
            </div>
          )}
        </div>

        {/* Anatomy Mesh Selector Panel */}
        <div className="absolute top-4 right-4 z-20 w-64">
          {/* Toggle panel button */}
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="mb-2 w-full px-3 py-2 rounded-lg bg-[#0C3559] hover:bg-[#0a2a47] text-white font-medium text-sm transition-all flex items-center justify-between gap-2 shadow-lg"
          >
            <span className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              {t('controls.anatomySystems')}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform ${isPanelOpen ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Mesh selector panel */}
          {isPanelOpen && (
            <div className="bg-black/60 backdrop-blur-sm rounded-lg shadow-xl border border-white/10 overflow-hidden">
              {/* Search input */}
              <div className="p-2 border-b border-white/10">
                <input
                  type="text"
                  placeholder="Buscar mesh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-black/30 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-[#3887A6]"
                />
              </div>

              {/* Selected meshes indicator */}
              {selectedMeshes.size > 0 && (
                <div className="px-2 py-1.5 bg-[#0C3559]/50 border-b border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-white/80">
                    Selecionados: <strong className="text-white">{selectedMeshes.size}</strong>
                    {selectedMeshes.size === 1 && (
                      <span className="text-white/60 ml-1">
                        ({Array.from(selectedMeshes)[0].replace(/_/g, ' ')})
                      </span>
                    )}
                  </span>
                  <button
                    onClick={handleClearSelection}
                    className="text-white/60 hover:text-white text-[10px] px-1.5 py-0.5 bg-black/30 rounded"
                  >
                    Limpar
                  </button>
                </div>
              )}

              {/* Categories accordion */}
              <div className="max-h-[60vh] overflow-y-auto">
                {Object.entries(filteredCategories).map(([key, category]) => (
                  <CategoryAccordion
                    key={key}
                    categoryKey={key}
                    category={category}
                    isExpanded={expandedCategories.has(key) || searchTerm.trim().length > 0}
                    onToggleExpand={() => toggleCategoryExpand(key)}
                    selectedMeshes={selectedMeshes}
                    onSelectMesh={handleSelectMesh}
                    onSelectCategory={handleSelectCategory}
                  />
                ))}
              </div>

              {/* Total meshes count */}
              <div className="px-2 py-1.5 border-t border-white/10 text-[9px] text-white/40 text-center">
                {selectedMeshes.size > 0
                  ? `${selectedMeshes.size} de ${ALL_MESHES.length} selecionados`
                  : `${ALL_MESHES.length} meshes disponíveis`
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </Environment3DContainer>
  );
}
