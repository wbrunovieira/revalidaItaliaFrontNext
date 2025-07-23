// Refactored PandaVideoPlayer with API v2 and fallback system

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Loader2, ExternalLink, AlertCircle, Play, Pause } from 'lucide-react';
import { PandaPlayerService } from '@/services/panda-player-service';
import { 
  PandaPlayerInstance, 
  PandaVideoPlayerProps,
  VideoProgress,
  PandaPlayerEvent
} from '@/types/panda-player';

export default function PandaVideoPlayer({
  videoId,
  title,
  thumbnailUrl,
  playerUrl,
  lessonId,
  onProgress,
  onReady,
  onError,
  onComplete,
  onPlay,
  onPause,
  startTime = 0,
  autoplay = false,
  muted = false,
  saveProgress = true,
  smartAutoplay = true,
}: PandaVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PandaPlayerInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fallback, setFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<VideoProgress>({
    currentTime: 0,
    duration: 0,
    percentage: 0
  });
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const playerService = PandaPlayerService.getInstance();
  const pullzone = process.env.NEXT_PUBLIC_PANDA_VIDEO_PULLZONE;
  const embedUrl = playerUrl || `https://player-${pullzone}.tv.pandavideo.com.br/embed/?v=${videoId}`;

  // Initialize player with API v2 or fallback
  const initializePlayer = useCallback(async () => {
    if (!containerRef.current || !videoId) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('Initializing player for video:', videoId);
      
      // Ensure container is ready
      const container = document.getElementById('panda-player-container');
      if (!container) {
        console.error('Container not found!');
        setError('Container not found');
        setIsLoading(false);
        return;
      }

      const libraryId = process.env.NEXT_PUBLIC_PANDA_VIDEO_LIBRARY_ID;
      console.log('Library ID:', libraryId, 'Pullzone:', pullzone);

      // Set a timeout for loading
      const loadingTimeout = setTimeout(() => {
        console.log('Loading timeout - falling back');
        setIsLoading(false);
        setFallback(true);
      }, 10000); // 10 seconds timeout - reduced from 30

      const player = await playerService.createPlayer('panda-player-container', {
        onReady: () => {
          console.log('Player ready!');
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          onReady?.();
        },
        onError: (err) => {
          console.error('Player error:', err);
          clearTimeout(loadingTimeout);
          setError('Failed to initialize player');
          onError?.(err);
        },
        video_id: videoId,
        library_id: libraryId,
        defaultStyle: true,
        playerConfigs: {
          autoplay,
          muted,
          saveProgress,
          smartAutoplay,
          startTime,
          controls: 'default',
        }
      });

      if (player) {
        playerRef.current = player;

        // Set up event listeners
        player.onEvent((event: PandaPlayerEvent) => {
          handlePlayerEvent(event);
        });
      } else {
        throw new Error('Failed to create player instance');
      }
    } catch (err) {
      console.error('Player initialization error:', err);
      setError('Failed to load video player');
      setIsLoading(false);
      onError?.(err);
    }
  }, [videoId, pullzone, autoplay, muted, saveProgress, smartAutoplay, startTime, onReady, onError]);

  // Handle player events
  const handlePlayerEvent = useCallback((event: PandaPlayerEvent) => {
    console.log('Player event received:', event.message, event);
    
    switch (event.message) {
      case 'panda_play':
        setIsPlaying(true);
        onPlay?.();
        break;

      case 'panda_pause':
        setIsPlaying(false);
        onPause?.();
        break;

      case 'panda_timeupdate':
        if (event.currentTime !== undefined) {
          // Use stored duration if event doesn't have it
          const duration = event.duration || videoDuration || 1; // Prevent division by zero
          const newProgress: VideoProgress = {
            currentTime: event.currentTime,
            duration: duration,
            percentage: duration > 0 ? (event.currentTime / duration) * 100 : 0
          };
          setProgress(newProgress);
          onProgress?.(newProgress);
          
          // Debug log to see what we're getting
          console.log('[PandaVideoPlayer] 📊 Progress update:', {
            currentTime: event.currentTime,
            duration: duration,
            percentage: newProgress.percentage.toFixed(2) + '%',
            eventHasDuration: !!event.duration
          });
        }
        break;

      case 'panda_ended':
        onComplete?.();
        break;

      case 'panda_error':
        console.error('Video error event:', event);
        setError('Video playback error');
        onError?.(event);
        break;
        
      case 'panda_loaded':
      case 'panda_loadeddata':
      case 'panda_canplay':
        console.log('Video loaded and ready to play');
        // Try to capture duration from these events
        if (event.duration && event.duration > 0) {
          setVideoDuration(event.duration);
          console.log('[PandaVideoPlayer] 📏 Video duration captured:', event.duration);
        }
        break;
        
      case 'panda_allData':
        // Try to extract duration from allData event
        if ((event as any).playerData?.duration) {
          const duration = (event as any).playerData.duration;
          setVideoDuration(duration);
          console.log('[PandaVideoPlayer] 📏 Duration from allData:', duration);
        }
        break;
    }
  }, [onPlay, onPause, onProgress, onComplete, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Initialize player when component mounts or videoId changes
  useEffect(() => {
    initializePlayer();
  }, [initializePlayer]);

  // Handle unhandled promise rejections (legacy support)
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || '';
      if (msg.includes('config.tv.pandavideo')) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  const openInNewWindow = () => window.open(embedUrl, '_blank');

  const retryPlayer = () => {
    setFallback(false);
    setError(null);
    initializePlayer();
  };

  // Fallback UI for when player fails completely
  if (fallback || error) {
    return (
      <div className="relative w-full bg-gray-900 flex flex-col items-center justify-center p-6" style={{ aspectRatio: '16/9' }}>
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="text-yellow-400 mx-auto" />
          <h3 className="text-xl text-white">{title || 'Video'}</h3>
          {error && (
            <p className="text-gray-400 text-sm">{error}</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={openInNewWindow}
              className="px-4 py-2 bg-secondary text-primary rounded hover:bg-secondary/90 transition-colors flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Abrir em nova janela
            </button>
            <button
              onClick={retryPlayer}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
          {thumbnailUrl && (
            <div className="mt-4 relative w-full max-w-md h-48 mx-auto opacity-50 rounded overflow-hidden">
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black" style={{ aspectRatio: '16/9' }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="text-center space-y-3">
            <Loader2
              className="animate-spin text-secondary mx-auto"
              size={32}
            />
            <p className="text-gray-400 text-sm">Carregando vídeo...</p>
          </div>
        </div>
      )}

      {/* Player container - Panda Player will create its own elements here */}
      <div 
        id="panda-player-container" 
        className="w-full h-full absolute inset-0"
        ref={containerRef}
      />

      {/* Floating controls overlay (only if basic iframe) */}
      {!isLoading && playerService.getCurrentStrategy()?.name === 'iframe-basic' && (
        <button
          onClick={() => setFallback(true)}
          className="absolute top-4 right-4 p-2 bg-gray-800/80 rounded hover:bg-gray-700/80 transition-colors"
          title="Opções do vídeo"
        >
          <ExternalLink size={14} />
        </button>
      )}

      {/* Progress indicator for debugging */}
      {process.env.NODE_ENV === 'development' && progress.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
          <div 
            className="h-full bg-secondary transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}