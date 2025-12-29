'use client';

import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';

interface Persistent3DContextValue {
  // Current active environment
  activeEnvironment: string | null;
  // Set the active environment (shows the 3D canvas)
  setActiveEnvironment: (slug: string | null) => void;
  // Track if a specific environment has been loaded before
  isEnvironmentLoaded: (slug: string) => boolean;
  // Mark an environment as loaded
  markEnvironmentLoaded: (slug: string) => void;
  // Check if currently visible
  isVisible: boolean;
}

const Persistent3DContext = createContext<Persistent3DContextValue | null>(null);

/**
 * Hook to access the Persistent 3D context
 */
export function usePersistent3D() {
  const context = useContext(Persistent3DContext);
  if (!context) {
    throw new Error('usePersistent3D must be used within a Persistent3DProvider');
  }
  return context;
}

/**
 * Hook to check if provider is available (for optional usage)
 */
export function usePersistent3DOptional() {
  return useContext(Persistent3DContext);
}

interface Persistent3DProviderProps {
  children: ReactNode;
}

/**
 * Provider that manages persistent 3D environment state
 *
 * This allows the 3D Canvas to stay mounted between navigations,
 * preserving the WebGL context and loaded assets.
 *
 * Usage:
 * 1. Wrap your app/layout with <Persistent3DProvider>
 * 2. Use usePersistent3D() to control visibility
 * 3. The Canvas stays mounted, only visibility changes
 */
export function Persistent3DProvider({ children }: Persistent3DProviderProps) {
  const [activeEnvironment, setActiveEnvironmentState] = useState<string | null>(null);
  const loadedEnvironments = useRef<Set<string>>(new Set());

  const setActiveEnvironment = useCallback((slug: string | null) => {
    setActiveEnvironmentState(slug);
  }, []);

  const isEnvironmentLoaded = useCallback((slug: string) => {
    return loadedEnvironments.current.has(slug);
  }, []);

  const markEnvironmentLoaded = useCallback((slug: string) => {
    loadedEnvironments.current.add(slug);
  }, []);

  const isVisible = activeEnvironment !== null;

  // Clear active environment when navigating away
  useEffect(() => {
    const handleRouteChange = () => {
      // Keep the environment loaded but hidden when navigating
      // The environment will be shown again when returning to the route
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return (
    <Persistent3DContext.Provider
      value={{
        activeEnvironment,
        setActiveEnvironment,
        isEnvironmentLoaded,
        markEnvironmentLoaded,
        isVisible,
      }}
    >
      {children}
    </Persistent3DContext.Provider>
  );
}

/**
 * Wrapper component that handles visibility based on context
 *
 * Usage:
 * ```tsx
 * <Persistent3DWrapper environmentSlug="human-body">
 *   <HumanBodyEnvironment />
 * </Persistent3DWrapper>
 * ```
 */
interface Persistent3DWrapperProps {
  environmentSlug: string;
  children: ReactNode;
  onLoad?: () => void;
}

/**
 * Inner component that uses hooks (always rendered when context exists)
 */
function Persistent3DWrapperInner({
  environmentSlug,
  children,
  onLoad,
  context,
}: Persistent3DWrapperProps & { context: Persistent3DContextValue }) {
  const hasCalledOnLoad = useRef(false);

  const { activeEnvironment, markEnvironmentLoaded, isEnvironmentLoaded } = context;
  const isActive = activeEnvironment === environmentSlug;
  const wasLoaded = isEnvironmentLoaded(environmentSlug);

  // Mark as loaded on first render
  useEffect(() => {
    if (!wasLoaded) {
      markEnvironmentLoaded(environmentSlug);
    }
    if (!hasCalledOnLoad.current && onLoad) {
      hasCalledOnLoad.current = true;
      onLoad();
    }
  }, [environmentSlug, wasLoaded, markEnvironmentLoaded, onLoad]);

  // Use CSS visibility to hide instead of unmounting
  // This preserves the WebGL context
  return (
    <div
      style={{
        visibility: isActive ? 'visible' : 'hidden',
        position: isActive ? 'relative' : 'absolute',
        width: isActive ? '100%' : '0',
        height: isActive ? '100%' : '0',
        overflow: 'hidden',
        // Keep in DOM but hidden for subsequent loads
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}

export function Persistent3DWrapper({
  environmentSlug,
  children,
  onLoad,
}: Persistent3DWrapperProps) {
  const context = usePersistent3DOptional();

  // If no provider, render normally (fallback behavior)
  if (!context) {
    return <>{children}</>;
  }

  return (
    <Persistent3DWrapperInner
      environmentSlug={environmentSlug}
      onLoad={onLoad}
      context={context}
    >
      {children}
    </Persistent3DWrapperInner>
  );
}
