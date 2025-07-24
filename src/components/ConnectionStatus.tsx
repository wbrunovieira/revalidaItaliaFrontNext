'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

interface NetworkStatus {
  isOnline: boolean;
  lastChecked: Date;
}

export default function ConnectionStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: true, // Always start with true to match server
    lastChecked: new Date(),
  });
  const [showStatus, setShowStatus] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    
    // Check actual status after hydration
    if (typeof navigator !== 'undefined') {
      const isOnline = navigator.onLine;
      setNetworkStatus({
        isOnline,
        lastChecked: new Date(),
      });
      // Show offline status immediately if offline
      if (!isOnline) {
        setShowStatus(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    const updateStatus = () => {
      const isOnline = navigator.onLine;
      setNetworkStatus({
        isOnline,
        lastChecked: new Date(),
      });

      if (isOnline) {
        // When coming back online, show briefly then hide
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 3000);
      } else {
        // When going offline, show permanently
        setShowStatus(true);
      }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [isHydrated]);

  // Don't render until hydrated to avoid mismatch
  if (!isHydrated || !showStatus) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg border backdrop-blur-sm transition-all duration-300 ${
        networkStatus.isOnline
          ? 'bg-green-900/60 border-green-700/50'
          : 'bg-red-900/60 border-red-700/50'
      }`}
    >
      {networkStatus.isOnline ? (
        <>
          <Wifi size={16} className="text-green-300" />
          <span className="text-green-200 text-sm font-medium">
            Conectado
          </span>
        </>
      ) : (
        <>
          <WifiOff size={16} className="text-red-300" />
          <span className="text-red-200 text-sm font-medium">
            Sem conexão
          </span>
        </>
      )}
    </div>
  );
}