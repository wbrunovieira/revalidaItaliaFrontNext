'use client';

import { useCallback } from 'react';
import { preloadEnvironment, preloadHumanBodyEnvironment, preloadSkeletonEnvironment } from '../preload';

/**
 * Hook to get preload handlers for 3D environments
 *
 * Usage:
 * ```tsx
 * const { onMouseEnter } = usePreload3D('human-body');
 *
 * <Link href="/3d-human-body" onMouseEnter={onMouseEnter}>
 *   Start 3D Lesson
 * </Link>
 * ```
 */
export function usePreload3D(environmentSlug: string) {
  const onMouseEnter = useCallback(() => {
    preloadEnvironment(environmentSlug);
  }, [environmentSlug]);

  return { onMouseEnter };
}

/**
 * Hook specifically for human body environment preloading
 *
 * Usage:
 * ```tsx
 * const { preload, onMouseEnter } = usePreloadHumanBody();
 *
 * // Manual preload
 * useEffect(() => { preload(); }, []);
 *
 * // Or on hover
 * <Link onMouseEnter={onMouseEnter}>...</Link>
 * ```
 */
export function usePreloadHumanBody() {
  const preload = useCallback(() => {
    preloadHumanBodyEnvironment();
  }, []);

  const onMouseEnter = useCallback(() => {
    preloadHumanBodyEnvironment();
  }, []);

  return { preload, onMouseEnter };
}

/**
 * Hook specifically for skeleton environment preloading
 *
 * Usage:
 * ```tsx
 * const { preload, onMouseEnter } = usePreloadSkeleton();
 *
 * // Manual preload
 * useEffect(() => { preload(); }, []);
 *
 * // Or on hover
 * <Link onMouseEnter={onMouseEnter}>...</Link>
 * ```
 */
export function usePreloadSkeleton() {
  const preload = useCallback(() => {
    preloadSkeletonEnvironment();
  }, []);

  const onMouseEnter = useCallback(() => {
    preloadSkeletonEnvironment();
  }, []);

  return { preload, onMouseEnter };
}
