/**
 * Preload utilities for 3D environments
 *
 * These functions allow preloading 3D assets before the user
 * actually navigates to the 3D environment, improving perceived
 * loading time.
 */

// Cache to track what's already being preloaded
const preloadingCache = new Set<string>();

/**
 * Check if we're in production environment
 */
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get the correct model path based on environment
 * Production uses /public/ prefix for NGINX routing to S3
 */
function getModelPath(basePath: string): string {
  return isProduction ? `/public${basePath}` : basePath;
}

/**
 * Model paths for each environment (base paths without /public/ prefix)
 */
const ENVIRONMENT_MODELS: Record<string, string> = {
  'human-body': '/models/human-body/anatomy-internal.glb',
  'skeleton': '/models/skeleton/skeleton-bones.glb',
};

/**
 * Preload a GLB model file
 *
 * Uses link preload to hint the browser to fetch the model
 * before it's actually needed.
 */
export function preloadModel(modelPath: string): void {
  if (typeof window === 'undefined') return;
  if (preloadingCache.has(modelPath)) return;

  preloadingCache.add(modelPath);

  // Create a link element for preloading
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'fetch';
  link.href = modelPath;
  link.crossOrigin = 'anonymous';

  document.head.appendChild(link);
}

/**
 * Preload all assets for a specific 3D environment
 *
 * Call this when the user hovers over a link to a 3D lesson
 * to start loading the model before they click.
 */
export function preloadEnvironment(environmentSlug: string): void {
  const basePath = ENVIRONMENT_MODELS[environmentSlug];

  if (basePath) {
    const modelPath = getModelPath(basePath);
    preloadModel(modelPath);
  }
}

/**
 * Preload the human body environment specifically
 *
 * Convenience function for the most common use case
 */
export function preloadHumanBodyEnvironment(): void {
  preloadEnvironment('human-body');
}

/**
 * Check if an environment's assets are already preloaded
 */
export function isEnvironmentPreloaded(environmentSlug: string): boolean {
  const basePath = ENVIRONMENT_MODELS[environmentSlug];
  if (!basePath) return false;
  const modelPath = getModelPath(basePath);
  return preloadingCache.has(modelPath);
}

/**
 * Preload the skeleton environment
 *
 * Convenience function for skeleton environment
 */
export function preloadSkeletonEnvironment(): void {
  preloadEnvironment('skeleton');
}
