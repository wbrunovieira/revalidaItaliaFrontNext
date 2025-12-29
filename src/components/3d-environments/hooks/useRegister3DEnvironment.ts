'use client';

import { useEffect } from 'react';
import { usePersistent3DOptional } from '../Persistent3DProvider';

/**
 * Hook to register a 3D environment with the persistent provider
 *
 * Call this in your 3D page component to:
 * 1. Show the environment when the page mounts
 * 2. Hide it when the page unmounts
 *
 * Usage:
 * ```tsx
 * function My3DPage() {
 *   useRegister3DEnvironment('human-body');
 *   return <HumanBodyEnvironment />;
 * }
 * ```
 */
export function useRegister3DEnvironment(environmentSlug: string) {
  const context = usePersistent3DOptional();

  useEffect(() => {
    if (!context) return;

    // Show this environment
    context.setActiveEnvironment(environmentSlug);

    // Hide when unmounting (navigating away)
    return () => {
      context.setActiveEnvironment(null);
    };
  }, [context, environmentSlug]);

  return {
    isLoaded: context?.isEnvironmentLoaded(environmentSlug) ?? false,
    isActive: context?.activeEnvironment === environmentSlug,
  };
}
