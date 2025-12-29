'use client';

import { useMemo } from 'react';
import { useSharedAnimationValues } from '../../../hooks/useAnimationManager';

type HotspotType = 'point' | 'area';

interface UseHotspotAnimationProps {
  isScriviTarget: boolean;
  hotspotType: HotspotType;
  challengeMode: boolean;
}

interface UseHotspotAnimationReturn {
  pulseScale: number;
  scriviColorPhase: number;
  areaRingScale: number;
  getScriviTargetColor: () => string;
}

/**
 * Optimized hotspot animation hook
 *
 * Instead of creating its own requestAnimationFrame loop,
 * this hook uses shared animation values from the centralized manager.
 *
 * Performance gain: 47 hotspots * 2 loops = 94 loops reduced to 1
 */
export function useHotspotAnimation({
  isScriviTarget,
  hotspotType,
  challengeMode,
}: UseHotspotAnimationProps): UseHotspotAnimationReturn {
  // Get shared animation values (single RAF loop for all hotspots)
  const sharedValues = useSharedAnimationValues();

  // Only use animation values when needed
  const pulseScale = isScriviTarget ? sharedValues.pulseScale : 1;
  const scriviColorPhase = isScriviTarget ? sharedValues.colorPhase : 0;
  const areaRingScale =
    hotspotType === 'area' && !challengeMode ? sharedValues.areaRingScale : 1;

  // Memoize color interpolation function
  const getScriviTargetColor = useMemo(() => {
    const primary = { r: 12, g: 53, b: 89 }; // #0C3559
    const secondary = { r: 56, g: 135, b: 166 }; // #3887A6

    return () => {
      const phase = sharedValues.colorPhase;
      const r = Math.round(primary.r + (secondary.r - primary.r) * phase);
      const g = Math.round(primary.g + (secondary.g - primary.g) * phase);
      const b = Math.round(primary.b + (secondary.b - primary.b) * phase);
      return `rgb(${r}, ${g}, ${b})`;
    };
  }, [sharedValues]);

  return {
    pulseScale,
    scriviColorPhase,
    areaRingScale,
    getScriviTargetColor,
  };
}
