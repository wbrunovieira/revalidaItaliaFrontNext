'use client';

import { useState, useCallback, useRef, memo, useMemo } from 'react';
import { useDeviceDetection, useHotspotAudio, useHotspotAnimation } from './hooks';
import {
  getHotspotColor,
  getHotspotEmissive,
  getHotspotOpacity,
  getBaseColors,
} from './utils/hotspotStyles';
import { HotspotTooltip } from './HotspotTooltip';
import { useSharedGeometries, getHotspotGeometries } from './SharedGeometries';

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

/**
 * Optimized Hotspot Component
 *
 * Performance optimizations:
 * 1. Uses shared geometries instead of creating new ones
 * 2. Wrapped with React.memo
 * 3. Memoized style context
 * 4. Uses centralized animation manager
 */
function HotspotComponent({
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

  // Get shared geometries
  const sharedGeometries = useSharedGeometries();
  const geometries = useMemo(
    () => getHotspotGeometries(sharedGeometries, hotspotType),
    [sharedGeometries, hotspotType]
  );

  // Custom hooks
  const { isTouchDevice, isMobile } = useDeviceDetection();
  const { isPlaying, showTranscription, playAudio, closeTranscription } = useHotspotAudio({
    audioUrl,
    volume,
    onAudioPlay,
  });
  const { pulseScale, scriviColorPhase, areaRingScale, getScriviTargetColor } =
    useHotspotAnimation({
      isScriviTarget,
      hotspotType,
      challengeMode,
    });

  // Derived state
  const tooltipVisible = showTooltip || hovered || isPlaying || isActiveFromMenu;
  const isActive = isPlaying || isActiveFromMenu;
  const { baseColor } = getBaseColors(hotspotType);

  // Memoized style context to prevent recalculation
  const styleContext = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  const handlePointerOver = useCallback(() => {
    if (!isTouchDevice) {
      setHovered(true);
      onHover?.(true);
    }
  }, [isTouchDevice, onHover]);

  const handlePointerOut = useCallback(() => {
    if (!isTouchDevice) {
      setHovered(false);
      onHover?.(false);
    }
  }, [isTouchDevice, onHover]);

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
      {/* Main hotspot mesh - uses shared geometry with scale */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        scale={isScriviTarget ? pulseScale * size : size}
        rotation={hotspotType === 'area' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
        geometry={geometries.mainGeometry}
      >
        <meshStandardMaterial
          color={currentColor}
          emissive={currentColor}
          emissiveIntensity={currentEmissive}
        />
      </mesh>

      {/* Inner ring - uses shared geometry with scale */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        scale={isScriviTarget ? pulseScale * size : size}
        geometry={geometries.innerRingGeometry}
      >
        <meshStandardMaterial
          color={isScriviTarget ? '#3887A6' : showCorrectAnswer ? '#4CAF50' : currentColor}
          emissive={isScriviTarget ? '#3887A6' : undefined}
          emissiveIntensity={isScriviTarget ? 1.5 : 0}
          transparent
          opacity={currentOpacity}
        />
      </mesh>

      {/* Outer pulsing ring - only for areas */}
      {hotspotType === 'area' && !challengeMode && geometries.outerRingGeometry && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          scale={areaRingScale * size}
          geometry={geometries.outerRingGeometry}
        >
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

// Export memoized component
export const Hotspot = memo(HotspotComponent);
