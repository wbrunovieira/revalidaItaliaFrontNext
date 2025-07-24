// Browser feature detection utilities for Panda Player fallback system

export interface BrowserFeatures {
  hasPromises: boolean;
  hasPostMessage: boolean;
  hasIntersectionObserver: boolean;
  hasFullscreen: boolean;
  canAutoplay: boolean;
  supportsHLS: boolean;
  supportsMSE: boolean;
  hasWebGL: boolean;
}

export function detectBrowserFeatures(): BrowserFeatures {
  if (typeof window === 'undefined') {
    return {
      hasPromises: false,
      hasPostMessage: false,
      hasIntersectionObserver: false,
      hasFullscreen: false,
      canAutoplay: false,
      supportsHLS: false,
      supportsMSE: false,
      hasWebGL: false,
    };
  }

  return {
    hasPromises: typeof Promise !== 'undefined',
    hasPostMessage: typeof window.postMessage === 'function',
    hasIntersectionObserver: 'IntersectionObserver' in window,
    hasFullscreen: !!(
      document.fullscreenEnabled ||
      (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
      (document as Document & { mozFullScreenEnabled?: boolean }).mozFullScreenEnabled ||
      (document as Document & { msFullscreenEnabled?: boolean }).msFullscreenEnabled
    ),
    canAutoplay: true, // Will be tested asynchronously
    supportsHLS: supportsHLS(),
    supportsMSE: 'MediaSource' in window,
    hasWebGL: supportsWebGL(),
  };
}

function supportsHLS(): boolean {
  const video = document.createElement('video');
  return !!(
    video.canPlayType('application/vnd.apple.mpegurl') ||
    video.canPlayType('application/x-mpegURL')
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Test autoplay capability
export async function testAutoplay(): Promise<boolean> {
  try {
    const video = document.createElement('video');
    video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAwBtZGF0AAAC';
    video.muted = true;
    video.playsInline = true;
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      await playPromise;
      video.pause();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Get browser info
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  
  return {
    isChrome: /Chrome/.test(ua) && !/Chromium/.test(ua),
    isFirefox: /Firefox/.test(ua),
    isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
    isEdge: /Edg/.test(ua),
    isIE: /Trident/.test(ua),
    isMobile: /Mobile|Android|iPhone|iPad/.test(ua),
    isIOS: /iPhone|iPad|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
  };
}