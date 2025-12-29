'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import * as THREE from 'three';

/**
 * Shared Geometries Context
 *
 * Instead of each hotspot creating its own geometry instances,
 * we create them once and share across all 47 hotspots.
 *
 * Performance gain: ~70% reduction in geometry objects
 * Before: 47 hotspots × 3 geometries = 141 geometry instances
 * After: 6 shared geometry instances
 */

interface SharedGeometries {
  // Point hotspots
  pointSphere: THREE.SphereGeometry;
  pointInnerRing: THREE.RingGeometry;

  // Area hotspots
  areaCylinder: THREE.CylinderGeometry;
  areaInnerRing: THREE.RingGeometry;
  areaOuterRing: THREE.RingGeometry;

  // Shared ring for both types
  genericRing: THREE.RingGeometry;
}

const SharedGeometriesContext = createContext<SharedGeometries | null>(null);

interface SharedGeometriesProviderProps {
  children: ReactNode;
}

/**
 * Provider that creates and shares geometries across all hotspots
 */
export function SharedGeometriesProvider({ children }: SharedGeometriesProviderProps) {
  const geometries = useMemo(() => {
    return {
      // Point hotspot geometries
      pointSphere: new THREE.SphereGeometry(1, 16, 16), // Scale applied per hotspot
      pointInnerRing: new THREE.RingGeometry(1.3, 1.7, 32),

      // Area hotspot geometries (hexagonal)
      areaCylinder: new THREE.CylinderGeometry(1.2, 1.2, 0.4, 6),
      areaInnerRing: new THREE.RingGeometry(1.3, 1.7, 6),
      areaOuterRing: new THREE.RingGeometry(2.0, 2.3, 6),

      // Generic ring (used for pulse effects)
      genericRing: new THREE.RingGeometry(1.3, 1.7, 32),
    };
  }, []);

  return (
    <SharedGeometriesContext.Provider value={geometries}>
      {children}
    </SharedGeometriesContext.Provider>
  );
}

/**
 * Hook to access shared geometries
 */
export function useSharedGeometries(): SharedGeometries {
  const context = useContext(SharedGeometriesContext);

  if (!context) {
    // Fallback: create geometries if provider not found
    // This allows hotspots to work standalone during development
    return {
      pointSphere: new THREE.SphereGeometry(1, 16, 16),
      pointInnerRing: new THREE.RingGeometry(1.3, 1.7, 32),
      areaCylinder: new THREE.CylinderGeometry(1.2, 1.2, 0.4, 6),
      areaInnerRing: new THREE.RingGeometry(1.3, 1.7, 6),
      areaOuterRing: new THREE.RingGeometry(2.0, 2.3, 6),
      genericRing: new THREE.RingGeometry(1.3, 1.7, 32),
    };
  }

  return context;
}

/**
 * Helper to get the appropriate geometry for a hotspot type
 */
export function getHotspotGeometries(
  geometries: SharedGeometries,
  hotspotType: 'point' | 'area'
) {
  if (hotspotType === 'area') {
    return {
      mainGeometry: geometries.areaCylinder,
      innerRingGeometry: geometries.areaInnerRing,
      outerRingGeometry: geometries.areaOuterRing,
      segments: 6,
    };
  }

  return {
    mainGeometry: geometries.pointSphere,
    innerRingGeometry: geometries.pointInnerRing,
    outerRingGeometry: null,
    segments: 32,
  };
}
