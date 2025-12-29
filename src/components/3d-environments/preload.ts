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
 * Model paths for each environment
 */
const ENVIRONMENT_MODELS: Record<string, string> = {
  'human-body': '/models/human-body/anatomy-internal.glb',
  // Add more environments as needed
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
  const modelPath = ENVIRONMENT_MODELS[environmentSlug];

  if (modelPath) {
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
  const modelPath = ENVIRONMENT_MODELS[environmentSlug];
  return modelPath ? preloadingCache.has(modelPath) : false;
}
