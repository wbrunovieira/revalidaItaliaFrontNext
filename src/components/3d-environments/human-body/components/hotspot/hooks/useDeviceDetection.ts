'use client';

import { useState, useEffect } from 'react';

interface DeviceDetection {
  isTouchDevice: boolean;
  isMobile: boolean;
}

export function useDeviceDetection(): DeviceDetection {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isTouchDevice, isMobile };
}
