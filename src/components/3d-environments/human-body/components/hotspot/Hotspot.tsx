'use client';

import { useState, useCallback, useRef } from 'react';
import { useDeviceDetection, useHotspotAudio, useHotspotAnimation } from './hooks';
import { getHotspotColor, getHotspotEmissive, getHotspotOpacity, getBaseColors } from './utils/hotspotStyles';
import { HotspotTooltip } from './HotspotTooltip';

type HotspotType = 'point' | 'area';

interface HotspotProps {
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
  challengeMode?: boolean;
  showCorrectAnswer?: boolean;
  isScriviTarget?: boolean;
  isScriviMode?: boolean;
  hotspotType?: HotspotType;
  onHover?: (isHovered: boolean) => void;
  onAudioPlay?: () => void;
  onChallengeClick?: (hotspotId: string) => void;
}

export function Hotspot({
  position,
  label,
  forms,
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
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const { isTouchDevice, isMobile } = useDeviceDetection();
  const { isPlaying, showTranscription, playAudio, closeTranscription } = useHotspotAudio({
    audioUrl,
    volume,
    onAudioPlay,
  });
  const { pulseScale, scriviColorPhase, areaRingScale, getScriviTargetColor } = useHotspotAnimation({
    isScriviTarget,
    hotspotType,
    challengeMode,
  });

  // Derived state
  const tooltipVisible = showTooltip || hovered || isPlaying || isActiveFromMenu;
  const isActive = isPlaying || isActiveFromMenu;
  const { baseColor } = getBaseColors(hotspotType);

  // Style context for helper functions
  const styleContext = {
    hotspotType,
    isScriviTarget,
    isScriviMode,
    challengeMode,
    showCorrectAnswer,
    isActive,
    tooltipVisible,
    hovered,
    scriviColorPhase,
    getScriviTargetColor,
  };

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

  const handleClick = useCallback(() => {
    if (challengeMode) {
      onChallengeClick?.(hotspotId);
      return;
    }

    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    setShowTooltip(true);
    onHover?.(true);

    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      onHover?.(false);
    }, 8000);

    if (audioUrl) {
      playAudio();
    }
  }, [audioUrl, playAudio, onHover, challengeMode, hotspotId, onChallengeClick]);

  const currentColor = getHotspotColor(styleContext);
  const currentEmissive = getHotspotEmissive(styleContext);
  const currentOpacity = getHotspotOpacity(styleContext);

  return (
    <group position={position}>
      {/* Main hotspot mesh */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        scale={isScriviTarget ? pulseScale : 1}
        rotation={hotspotType === 'area' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
      >
        {hotspotType === 'area' ? (
          <cylinderGeometry args={[size * 1.2, size * 1.2, size * 0.4, 6]} />
        ) : (
          <sphereGeometry args={[size, 16, 16]} />
        )}
        <meshStandardMaterial
          color={currentColor}
          emissive={currentColor}
          emissiveIntensity={currentEmissive}
        />
      </mesh>

      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={isScriviTarget ? pulseScale : 1}>
        <ringGeometry args={[size * 1.3, size * 1.7, hotspotType === 'area' ? 6 : 32]} />
        <meshStandardMaterial
          color={isScriviTarget ? '#3887A6' : showCorrectAnswer ? '#4CAF50' : currentColor}
          emissive={isScriviTarget ? '#3887A6' : undefined}
          emissiveIntensity={isScriviTarget ? 1.5 : 0}
          transparent
          opacity={currentOpacity}
        />
      </mesh>

      {/* Outer pulsing ring - only for areas */}
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

      {/* Tooltip */}
      {((!challengeMode && tooltipVisible) || showCorrectAnswer) && (
        <HotspotTooltip
          label={label}
          forms={forms}
          transcription={transcription}
          audioUrl={audioUrl}
          isZoomedView={isZoomedView}
          isMobile={isMobile}
          isActive={isActive}
          showTranscription={showTranscription}
          onPlayAudio={playAudio}
          onCloseTranscription={closeTranscription}
        />
      )}
    </group>
  );
}
