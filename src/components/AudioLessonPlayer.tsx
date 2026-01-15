// src/components/AudioLessonPlayer.tsx
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Clock,
  ListMusic,
  ChevronDown,
  ChevronUp,
  FileText,
  Gauge,
  Repeat,
  Shuffle,
} from 'lucide-react';
import type { Audio } from '@/hooks/queries/useLesson';

interface AudioLessonPlayerProps {
  audios: Audio[];
  locale: string;
  lessonTitle?: string;
}

// Animated bar component for visualizer
const VisualizerBar = ({ delay, isPlaying }: { delay: number; isPlaying: boolean }) => (
  <motion.div
    className="w-1 bg-gradient-to-t from-secondary to-accent rounded-full"
    animate={isPlaying ? {
      height: [12, 32, 20, 40, 16, 28, 12],
    } : {
      height: 12,
    }}
    transition={{
      duration: 1.2,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

export default function AudioLessonPlayer({
  audios,
  locale,
  lessonTitle,
}: AudioLessonPlayerProps) {
  const t = useTranslations('Lesson.audioPlayer');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showTranscription, setShowTranscription] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Sort audios by order
  const sortedAudios = useMemo(() =>
    [...audios].sort((a, b) => a.order - b.order),
    [audios]
  );

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
    // If more than 3 seconds into track, restart current track
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  }, [currentIndex, currentTime]);

  // Handle next track
  const handleNext = useCallback(() => {
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * sortedAudios.length);
      setCurrentIndex(randomIndex);
    } else if (currentIndex < sortedAudios.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isLooping) {
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }, [currentIndex, sortedAudios.length, isLooping, isShuffled]);

  // Handle track selection
  const handleSelectTrack = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  }, []);

  // Handle mute toggle
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    audioRef.current.muted = newMuted;
    setIsMuted(newMuted);
  }, [isMuted]);

  // Handle playback rate change
  const cyclePlaybackRate = useCallback(() => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIdx = rates.indexOf(playbackRate);
    const nextIdx = (currentIdx + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }, [playbackRate]);

  // Handle seek via progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      audio.playbackRate = playbackRate;
      setAudioError(null); // Clear error on successful load
    };
    const handleEnded = () => {
      if (isLooping && sortedAudios.length === 1) {
        audio.currentTime = 0;
        audio.play();
      } else if (currentIndex < sortedAudios.length - 1 || isLooping) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setAudioError(null);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      const error = audio.error;
      let errorMessage = 'Failed to load audio';
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio loading aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio decode error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported or URL inaccessible';
            break;
        }
      }
      console.error('[AudioLessonPlayer] Audio error:', {
        code: error?.code,
        message: errorMessage,
        url: currentAudio?.url
      });
      setAudioError(errorMessage);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [currentIndex, sortedAudios.length, handleNext, isLooping, playbackRate, currentAudio?.url]);

  // Auto-play when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentIndex, isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handlePrevious, handleNext, toggleMute]);

  // Log audio data on mount
  useEffect(() => {
    console.log('[AudioLessonPlayer] Audio data received:', {
      totalAudios: sortedAudios.length,
      currentIndex,
      currentAudio: currentAudio ? {
        id: currentAudio.id,
        filename: currentAudio.filename,
        url: currentAudio.url,
        mimeType: currentAudio.mimeType,
        durationInSeconds: currentAudio.durationInSeconds,
      } : null
    });
  }, [sortedAudios, currentIndex, currentAudio]);

  if (!sortedAudios.length) return null;

  const currentTranslation = getAudioTranslation(currentAudio);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Calculate total duration of all audios
  const totalDuration = sortedAudios.reduce((sum, audio) => sum + audio.durationInSeconds, 0);

  return (
    <div className="w-full">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={currentAudio.url} preload="metadata" />

      {/* Audio Error Display */}
      {audioError && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm font-medium">{audioError}</p>
          <p className="text-red-400/70 text-xs mt-1">URL: {currentAudio.url}</p>
        </div>
      )}

      {/* Main Player Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 rounded-2xl border border-secondary/20 overflow-hidden shadow-2xl shadow-secondary/10"
      >
        {/* Header with visualizer */}
        <div className="relative px-6 pt-6 pb-8 bg-gradient-to-b from-secondary/10 to-transparent">
          {/* Background glow effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Album art / Visualizer */}
            <div className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-accent/30 rounded-2xl" />
              <div className="absolute inset-2 bg-primary/80 rounded-xl flex items-center justify-center overflow-hidden">
                {/* Animated visualizer bars */}
                <div className="flex items-end gap-1 h-16">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <VisualizerBar key={i} delay={i * 0.1} isPlaying={isPlaying} />
                  ))}
                </div>
              </div>
              {/* Glow ring when playing */}
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-secondary/50"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(56, 135, 166, 0.3)',
                      '0 0 40px rgba(56, 135, 166, 0.5)',
                      '0 0 20px rgba(56, 135, 166, 0.3)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 text-center md:text-left">
              {lessonTitle && (
                <p className="text-secondary text-sm font-medium mb-1">{lessonTitle}</p>
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {currentTranslation.title}
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                {t('track', { current: currentIndex + 1, total: sortedAudios.length })}
                {' • '}
                {formatTime(currentAudio.durationInSeconds)}
              </p>

              {/* Mini stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <ListMusic size={14} />
                  {sortedAudios.length} {sortedAudios.length === 1 ? t('trackSingular') : t('trackPlural')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatTime(totalDuration)} {t('total')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4">
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="group relative h-2 bg-gray-700/50 rounded-full cursor-pointer overflow-hidden"
          >
            {/* Progress fill */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-secondary to-accent rounded-full"
              style={{ width: `${progress}%` }}
            />
            {/* Hover effect */}
            <div className="absolute inset-y-0 left-0 right-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* Thumb */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {/* Shuffle */}
            <button
              type="button"
              onClick={() => setIsShuffled(!isShuffled)}
              className={`p-2 rounded-full transition-colors ${
                isShuffled ? 'text-secondary' : 'text-gray-400 hover:text-white'
              }`}
              title={t('shuffle')}
            >
              <Shuffle size={18} />
            </button>

            {/* Previous */}
            <button
              type="button"
              onClick={handlePrevious}
              className="p-3 text-gray-300 hover:text-white transition-colors"
              title={t('previous')}
            >
              <SkipBack size={28} fill="currentColor" />
            </button>

            {/* Play/Pause */}
            <motion.button
              type="button"
              onClick={togglePlay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-5 bg-gradient-to-r from-secondary to-accent text-white rounded-full shadow-lg shadow-secondary/30 hover:shadow-secondary/50 transition-shadow"
              title={isPlaying ? t('pause') : t('play')}
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
            </motion.button>

            {/* Next */}
            <button
              type="button"
              onClick={handleNext}
              disabled={!isLooping && !isShuffled && currentIndex === sortedAudios.length - 1}
              className="p-3 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title={t('next')}
            >
              <SkipForward size={28} fill="currentColor" />
            </button>

            {/* Repeat */}
            <button
              type="button"
              onClick={() => setIsLooping(!isLooping)}
              className={`p-2 rounded-full transition-colors ${
                isLooping ? 'text-secondary' : 'text-gray-400 hover:text-white'
              }`}
              title={t('repeat')}
            >
              <Repeat size={18} />
            </button>
          </div>

          {/* Secondary controls */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/30">
            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title={isMuted ? t('unmute') : t('mute')}
              >
                {isMuted ? <VolumeX size={20} /> : volume < 0.5 ? <Volume1 size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 md:w-24 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-secondary"
              />
            </div>

            {/* Playback speed */}
            <button
              type="button"
              onClick={cyclePlaybackRate}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors"
              title={t('speed')}
            >
              <Gauge size={16} />
              <span>{playbackRate}x</span>
            </button>

            {/* Transcription toggle */}
            {currentAudio.transcription && (
              <button
                type="button"
                onClick={() => setShowTranscription(!showTranscription)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showTranscription
                    ? 'text-secondary bg-secondary/20'
                    : 'text-gray-400 hover:text-white bg-gray-700/30 hover:bg-gray-700/50'
                }`}
                title={t('transcription')}
              >
                <FileText size={16} />
                <span className="hidden md:inline">{t('transcription')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Transcription panel */}
        <AnimatePresence>
          {showTranscription && currentAudio.transcription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-700/30 overflow-hidden"
            >
              <div className="p-6 bg-primary/50">
                <h4 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  {t('transcription')}
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {currentAudio.transcription}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlist */}
        <div className="border-t border-gray-700/30">
          <button
            type="button"
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="w-full flex items-center justify-between px-6 py-4 text-gray-400 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <ListMusic size={18} />
              <span className="font-medium">{t('playlist')}</span>
              <span className="text-xs text-gray-500">
                ({sortedAudios.length} {sortedAudios.length === 1 ? t('trackSingular') : t('trackPlural')})
              </span>
            </div>
            {showPlaylist ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <AnimatePresence>
            {showPlaylist && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="max-h-64 overflow-y-auto">
                  {sortedAudios.map((audio, index) => {
                    const translation = getAudioTranslation(audio);
                    const isActive = index === currentIndex;
                    return (
                      <motion.button
                        key={audio.id}
                        type="button"
                        onClick={() => handleSelectTrack(index)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`w-full flex items-center gap-4 px-6 py-4 transition-all ${
                          isActive
                            ? 'bg-secondary/10 border-l-2 border-secondary'
                            : 'hover:bg-gray-700/20 border-l-2 border-transparent'
                        }`}
                      >
                        {/* Track number / Playing indicator */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-secondary text-white'
                              : 'bg-gray-700/50 text-gray-400'
                          }`}
                        >
                          {isActive && isPlaying ? (
                            <div className="flex items-end gap-0.5 h-3">
                              <motion.span
                                className="w-0.5 bg-white rounded"
                                animate={{ height: ['4px', '12px', '8px', '12px', '4px'] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                              <motion.span
                                className="w-0.5 bg-white rounded"
                                animate={{ height: ['8px', '4px', '12px', '4px', '8px'] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.span
                                className="w-0.5 bg-white rounded"
                                animate={{ height: ['12px', '8px', '4px', '8px', '12px'] }}
                                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                              />
                            </div>
                          ) : (
                            audio.order
                          )}
                        </div>

                        {/* Track info */}
                        <div className="flex-1 text-left min-w-0">
                          <p className={`truncate font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                            {translation.title}
                          </p>
                          {translation.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {translation.description}
                            </p>
                          )}
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {audio.formattedDuration || formatTime(audio.durationInSeconds)}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Keyboard shortcuts hint */}
      <p className="text-center text-xs text-gray-500 mt-4">
        {t('keyboardHint')}
      </p>
    </div>
  );
}
