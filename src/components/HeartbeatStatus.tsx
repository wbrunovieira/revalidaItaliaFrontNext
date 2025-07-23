'use client';

import { useEffect, useState } from 'react';
import { getHeartbeatService } from '@/services/video-progress-heartbeat';
import { Wifi, WifiOff, Activity, Clock, Database } from 'lucide-react';

export default function HeartbeatStatus() {
  const [status, setStatus] = useState({
    queueSize: 0,
    isOnline: true,
    isFlushing: false,
    oldestUpdate: null as number | null
  });
  
  const heartbeatService = getHeartbeatService();

  useEffect(() => {
    // Update status every second (silent mode to avoid console spam)
    const interval = setInterval(() => {
      const currentStatus = heartbeatService.getStatus(true); // silent = true
      setStatus(currentStatus);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getAgeInSeconds = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return Math.round((Date.now() - timestamp) / 1000);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-primary-dark/95 backdrop-blur border border-secondary/30 rounded-lg p-4 shadow-lg z-50 min-w-[280px]">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="text-secondary animate-pulse" size={20} />
        <h3 className="text-white font-semibold">Heartbeat Status</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        {/* Online Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-2">
            {status.isOnline ? (
              <Wifi size={16} className="text-green-500" />
            ) : (
              <WifiOff size={16} className="text-red-500" />
            )}
            Network
          </span>
          <span className={status.isOnline ? "text-green-500" : "text-red-500"}>
            {status.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Queue Size */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-2">
            <Database size={16} />
            Queue
          </span>
          <span className={`font-mono ${
            status.queueSize > 5 ? 'text-yellow-500' : 
            status.queueSize > 0 ? 'text-blue-500' : 
            'text-gray-500'
          }`}>
            {status.queueSize} updates
          </span>
        </div>

        {/* Flush Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Syncing</span>
          <span className={status.isFlushing ? "text-yellow-500 animate-pulse" : "text-gray-500"}>
            {status.isFlushing ? 'In Progress...' : 'Idle'}
          </span>
        </div>

        {/* Oldest Update */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 flex items-center gap-2">
            <Clock size={16} />
            Oldest
          </span>
          <span className="text-gray-500 font-mono">
            {status.oldestUpdate ? `${getAgeInSeconds(status.oldestUpdate)}s ago` : 'Empty'}
          </span>
        </div>
      </div>

      {/* Flush Button (for testing) */}
      <button
        onClick={() => {
          console.log('[HeartbeatStatus] Manual flush triggered');
          heartbeatService.flush();
        }}
        className="mt-3 w-full py-1 px-3 bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30 rounded text-xs font-medium transition-colors"
        disabled={status.queueSize === 0 || status.isFlushing}
      >
        {status.isFlushing ? 'Flushing...' : 'Force Flush'}
      </button>
    </div>
  );
}