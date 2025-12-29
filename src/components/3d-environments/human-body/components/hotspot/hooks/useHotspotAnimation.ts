'use client';

import { useState, useEffect } from 'react';

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

export function useHotspotAnimation({
  isScriviTarget,
  hotspotType,
  challengeMode,
}: UseHotspotAnimationProps): UseHotspotAnimationReturn {
  const [pulseScale, setPulseScale] = useState(1);
  const [scriviColorPhase, setScriviColorPhase] = useState(0);
  const [areaRingScale, setAreaRingScale] = useState(1);

  // Scrivi target pulsing animation
  useEffect(() => {
    if (!isScriviTarget) {
      setPulseScale(1);
      setScriviColorPhase(0);
      return;
    }

    let frame: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Pulse between 1.0 and 1.3 scale
      const scale = 1 + Math.sin(elapsed * 4) * 0.15;
      setPulseScale(scale);
      // Alternate colors - use sin wave to smoothly transition
      const colorPhase = (Math.sin(elapsed * 6) + 1) / 2;
      setScriviColorPhase(colorPhase);
      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frame);
  }, [isScriviTarget]);

  // Area ring pulsing animation
  useEffect(() => {
    if (hotspotType !== 'area' || challengeMode) {
      setAreaRingScale(1);
      return;
    }

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

  // Interpolate between primary and secondary colors for scrivi target
  const getScriviTargetColor = () => {
    const primary = { r: 12, g: 53, b: 89 }; // #0C3559
    const secondary = { r: 56, g: 135, b: 166 }; // #3887A6
    const r = Math.round(primary.r + (secondary.r - primary.r) * scriviColorPhase);
    const g = Math.round(primary.g + (secondary.g - primary.g) * scriviColorPhase);
    const b = Math.round(primary.b + (secondary.b - primary.b) * scriviColorPhase);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return {
    pulseScale,
    scriviColorPhase,
    areaRingScale,
    getScriviTargetColor,
  };
}
