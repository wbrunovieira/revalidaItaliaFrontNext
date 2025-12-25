// src/components/CloudWatchRUM.tsx
// CloudWatch RUM (Real User Monitoring) integration for frontend performance monitoring
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// RUM configuration from environment variables
const RUM_CONFIG = {
  applicationId: process.env.NEXT_PUBLIC_RUM_APPLICATION_ID,
  applicationVersion: process.env.NEXT_PUBLIC_RUM_APPLICATION_VERSION || '1.0.0',
  applicationRegion: process.env.NEXT_PUBLIC_RUM_REGION || 'us-east-2',
  identityPoolId: process.env.NEXT_PUBLIC_RUM_IDENTITY_POOL_ID,
  guestRoleArn: process.env.NEXT_PUBLIC_RUM_GUEST_ROLE_ARN,
  endpoint: process.env.NEXT_PUBLIC_RUM_ENDPOINT,
};

// Lazy load RUM to avoid SSR issues
let rumInstance: InstanceType<typeof import('aws-rum-web').AwsRum> | null = null;

async function initializeRUM() {
  // Skip if already initialized or missing config
  if (rumInstance) return rumInstance;

  if (!RUM_CONFIG.applicationId || !RUM_CONFIG.identityPoolId) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[CloudWatch RUM] Skipped: Missing configuration');
    }
    return null;
  }

  try {
    // Dynamic import to avoid SSR issues
    const { AwsRum } = await import('aws-rum-web');

    rumInstance = new AwsRum(
      RUM_CONFIG.applicationId,
      RUM_CONFIG.applicationVersion,
      RUM_CONFIG.applicationRegion,
      {
        sessionSampleRate: 1, // 100% of sessions
        identityPoolId: RUM_CONFIG.identityPoolId,
        guestRoleArn: RUM_CONFIG.guestRoleArn,
        endpoint: RUM_CONFIG.endpoint,
        telemetries: ['performance', 'errors', 'http'],
        allowCookies: true,
        enableXRay: false,
        // Page views are recorded automatically
        pageIdFormat: 'PATH',
        // Record page load timing
        recordResourceUrl: true,
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('[CloudWatch RUM] Initialized successfully');
    }

    return rumInstance;
  } catch (error) {
    console.error('[CloudWatch RUM] Failed to initialize:', error);
    return null;
  }
}

// Custom hook for RUM page view tracking in Next.js
function useRUMPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize RUM on first load
    initializeRUM();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Record page view on route change
    if (rumInstance && pathname) {
      try {
        rumInstance.recordPageView(pathname);
      } catch {
        // Silently fail - RUM might not be fully initialized
      }
    }
  }, [pathname]);
}

// Export functions for manual event recording
export async function recordRUMError(error: Error, context?: Record<string, string>) {
  const rum = rumInstance || await initializeRUM();
  if (rum) {
    try {
      rum.recordError(error);
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          rum.addSessionAttributes({ [key]: value });
        });
      }
    } catch {
      // Silently fail
    }
  }
}

export async function recordRUMEvent(eventType: string, eventData?: Record<string, unknown>) {
  const rum = rumInstance || await initializeRUM();
  if (rum) {
    try {
      rum.recordEvent(eventType, eventData || {});
    } catch {
      // Silently fail
    }
  }
}

export async function setRUMUserAttributes(attributes: Record<string, string | number | boolean>) {
  const rum = rumInstance || await initializeRUM();
  if (rum) {
    try {
      rum.addSessionAttributes(attributes);
    } catch {
      // Silently fail
    }
  }
}

// Component that initializes RUM and tracks page views
export default function CloudWatchRUM() {
  useRUMPageView();
  return null;
}
