'use client';

import { useRef, useEffect, useCallback } from 'react';

type AnimationCallback = (elapsed: number, deltaTime: number) => void;

interface AnimationSubscription {
  id: string;
  callback: AnimationCallback;
  active: boolean;
}

/**
 * Centralized Animation Manager
 *
 * Instead of each hotspot creating its own requestAnimationFrame loop,
 * this manager runs a single loop and notifies all subscribers.
 *
 * Performance gain: Reduces 47+ RAF loops to just 1
 */
class AnimationManager {
  private static instance: AnimationManager | null = null;
  private subscriptions: Map<string, AnimationSubscription> = new Map();
  private frameId: number | null = null;
  private startTime: number = 0;
  private lastTime: number = 0;
  private isRunning: boolean = false;

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  subscribe(id: string, callback: AnimationCallback): () => void {
    this.subscriptions.set(id, { id, callback, active: true });

    if (!this.isRunning && this.subscriptions.size > 0) {
      this.start();
    }

    return () => this.unsubscribe(id);
  }

  unsubscribe(id: string): void {
    this.subscriptions.delete(id);

    if (this.subscriptions.size === 0) {
      this.stop();
    }
  }

  setActive(id: string, active: boolean): void {
    const sub = this.subscriptions.get(id);
    if (sub) {
      sub.active = active;
    }
  }

  private start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.loop();
  }

  private stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isRunning = false;
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const elapsed = (now - this.startTime) / 1000;
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Notify all active subscribers
    this.subscriptions.forEach(sub => {
      if (sub.active) {
        sub.callback(elapsed, deltaTime);
      }
    });

    this.frameId = requestAnimationFrame(this.loop);
  };
}

// Get singleton instance
const animationManager = AnimationManager.getInstance();

/**
 * Hook to subscribe to the centralized animation manager
 *
 * @param id - Unique identifier for this subscription
 * @param callback - Function called each frame with (elapsed, deltaTime)
 * @param active - Whether this subscription should receive updates
 */
export function useAnimationSubscription(
  id: string,
  callback: AnimationCallback,
  active: boolean = true
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const wrappedCallback: AnimationCallback = (elapsed, deltaTime) => {
      callbackRef.current(elapsed, deltaTime);
    };

    const unsubscribe = animationManager.subscribe(id, wrappedCallback);

    return () => {
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    animationManager.setActive(id, active);
  }, [id, active]);
}

/**
 * Pre-calculated animation values for common patterns
 * Avoids redundant Math.sin calculations across hotspots
 */
export interface AnimationValues {
  // Pulse animation (scale 1.0 to 1.3)
  pulseScale: number;
  // Color phase for smooth color transitions (0 to 1)
  colorPhase: number;
  // Area ring scale (1.0 to 1.15)
  areaRingScale: number;
}

/**
 * Hook that provides pre-calculated animation values
 * All hotspots can share these values instead of calculating their own
 */
export function useSharedAnimationValues(): AnimationValues {
  const valuesRef = useRef<AnimationValues>({
    pulseScale: 1,
    colorPhase: 0,
    areaRingScale: 1,
  });

  useAnimationSubscription(
    'shared-animation-values',
    useCallback((elapsed: number) => {
      // Pulse between 1.0 and 1.3 scale (frequency: 4 Hz)
      valuesRef.current.pulseScale = 1 + Math.sin(elapsed * 4) * 0.15;

      // Color phase 0-1 (frequency: 6 Hz)
      valuesRef.current.colorPhase = (Math.sin(elapsed * 6) + 1) / 2;

      // Area ring pulse 1.0 to 1.15 (frequency: 2 Hz)
      valuesRef.current.areaRingScale = 1 + Math.sin(elapsed * 2) * 0.075;
    }, []),
    true
  );

  return valuesRef.current;
}

export { animationManager };
