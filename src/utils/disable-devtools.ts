interface ReactDevToolsHook {
  isDisabled?: boolean;
  onCommitFiberRoot?: (...args: unknown[]) => unknown;
}

// Disable React DevTools in production or when presenting
export function disableReactDevTools() {
  if (typeof window !== 'undefined') {
    // Check for React DevTools global hook
    const devTools = (window as Window & { __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook }).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    
    if (devTools) {
      // Option 1: Completely disable DevTools
      if (process.env.NEXT_PUBLIC_DISABLE_DEVTOOLS === 'true') {
        devTools.isDisabled = true;
      }
      
      // Option 2: Hide specific errors
      const originalOnCommitFiberRoot = devTools.onCommitFiberRoot;
      devTools.onCommitFiberRoot = function(...args: unknown[]) {
        try {
          return originalOnCommitFiberRoot?.apply(this, args);
        } catch (error: unknown) {
          // Suppress "children should not have changed" errors
          if (error instanceof Error && error.message?.includes('children should not have changed')) {
            console.warn('Suppressed React DevTools error:', error.message);
            return;
          }
          throw error;
        }
      };
    }
  }
}