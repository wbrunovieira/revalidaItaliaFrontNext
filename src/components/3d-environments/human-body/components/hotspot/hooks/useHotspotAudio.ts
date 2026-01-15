'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseHotspotAudioProps {
  audioUrl?: string;
  volume: number;
  onAudioPlay?: () => void;
}

interface UseHotspotAudioReturn {
  isPlaying: boolean;
  showTranscription: boolean;
  playAudio: () => void;
  closeTranscription: () => void;
}

export function useHotspotAudio({
  audioUrl,
  volume,
  onAudioPlay,
}: UseHotspotAudioProps): UseHotspotAudioReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
    };
  }, []);

  const playAudio = useCallback(() => {
    if (!audioUrl) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audioRef.current = audio;

    audio.onplay = () => {
      setIsPlaying(true);
      onAudioPlay?.();

      // Show transcription with 8-second timeout
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
      setShowTranscription(true);
      transcriptionTimeoutRef.current = setTimeout(() => {
        setShowTranscription(false);
      }, 8000);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setShowTranscription(false);
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
    };

    audio.onerror = () => {
      setIsPlaying(false);
      console.error('Error playing audio:', audioUrl);
    };

    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    });
  }, [audioUrl, volume, onAudioPlay]);

  const closeTranscription = useCallback(() => {
    setShowTranscription(false);
    if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current);
    }
  }, []);

  return {
    isPlaying,
    showTranscription,
    playAudio,
    closeTranscription,
  };
}
