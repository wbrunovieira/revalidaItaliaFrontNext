// src/components/AudioPlayerSection.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Clock,
  ListMusic,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Audio } from '@/hooks/queries/useLesson';

interface AudioPlayerSectionProps {
  audios: Audio[];
  locale: string;
}

export default function AudioPlayerSection({
  audios,
  locale,
}: AudioPlayerSectionProps) {
  const t = useTranslations('Lesson.audios');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sort audios by order
  const sortedAudios = [...audios].sort((a, b) => a.order - b.order);
  const currentAudio = sortedAudios[currentIndex];

  // Get translation for audio based on locale
  const getAudioTranslation = useCallback(
    (audio: Audio) => {
      return (
        audio.translations?.find(tr => tr.locale === locale) ||
        audio.translations?.[0] || { title: audio.filename, description: '' }
      );
    },
    [locale]
  );

  // Format time (seconds to mm:ss)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Handle previous track
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  }, [currentIndex]);

  // Handle next track
  const handleNext = useCallback(() => {
    if (currentIndex < sortedAudios.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  }, [currentIndex, sortedAudios.length]);

  // Handle track selection
  const handleSelectTrack = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  }, []);

  // Handle mute toggle
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Handle seek
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentIndex < sortedAudios.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, sortedAudios.length, handleNext]);

  // Auto-play when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {
        // Handle autoplay restrictions
        setIsPlaying(false);
      });
    }
  }, [currentIndex, isPlaying]);

  if (!sortedAudios.length) return null;

  const currentTranslation = getAudioTranslation(currentAudio);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Music size={20} className="text-blue-400" />
          </div>
          {t('title')}
        </h4>
        <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500 to-transparent rounded-full ml-11"></div>
      </div>

      <div className="bg-primary/30 rounded-lg border border-blue-500/20 overflow-hidden">
        {/* Hidden audio element */}
        <audio ref={audioRef} src={currentAudio.url} preload="metadata" />

        {/* Current track info & controls */}
        <div className="p-4">
          {/* Track info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Music size={24} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {currentTranslation.title}
              </p>
              <p className="text-gray-400 text-sm">
                {t('track', { current: currentIndex + 1, total: sortedAudios.length })}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              style={{
                background: `linear-gradient(to right, #3b82f6 ${progress}%, #374151 ${progress}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t('previous')}
            >
              <SkipBack size={20} />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title={isPlaying ? t('pause') : t('play')}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === sortedAudios.length - 1}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t('next')}
            >
              <SkipForward size={20} />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-2 text-gray-400 hover:text-white transition-colors ml-2"
              title={isMuted ? t('unmute') : t('mute')}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* Track list header */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-2 bg-primary/20 border-t border-blue-500/10 text-gray-400 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <ListMusic size={16} />
            <span className="text-sm">{t('playlist')}</span>
          </div>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* Track list */}
        {isExpanded && (
          <div className="max-h-48 overflow-y-auto">
            {sortedAudios.map((audio, index) => {
              const translation = getAudioTranslation(audio);
              const isActive = index === currentIndex;
              return (
                <button
                  key={audio.id}
                  type="button"
                  onClick={() => handleSelectTrack(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-t border-primary/30 transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 text-white'
                      : 'text-gray-400 hover:bg-primary/20 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-primary/30'
                    }`}
                  >
                    {isActive && isPlaying ? (
                      <div className="flex gap-0.5">
                        <span className="w-0.5 h-2 bg-white rounded animate-pulse"></span>
                        <span className="w-0.5 h-3 bg-white rounded animate-pulse delay-75"></span>
                        <span className="w-0.5 h-2 bg-white rounded animate-pulse delay-150"></span>
                      </div>
                    ) : (
                      audio.order
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm truncate">{translation.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    {audio.formattedDuration || formatTime(audio.durationInSeconds)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
