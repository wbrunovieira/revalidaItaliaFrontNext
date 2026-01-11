'use client';

import { useState, useCallback, useRef } from 'react';
import { BONE_HOTSPOTS } from '../data';

const CONSULTATION_ROUNDS = 10;

interface UseConsultationMode {
  // State
  consultationState: 'idle' | 'playing' | 'finished';
  consultationRound: number;
  consultationScore: number;
  consultationTargetId: string | null;
  isAudioPlaying: boolean;
  lastAnswerCorrect: boolean | null;
  showCorrectAnswer: boolean;
  // Actions
  startConsultation: () => void;
  handleConsultationClick: (clickedId: string) => void;
  replayConsultationAudio: () => void;
  exitConsultation: () => void;
  getConsultationDiagnosis: () => { emoji: string; title: string; message: string };
}

export function useConsultationMode(
  audioVolume: number,
  setGameMode: (mode: 'study' | 'challenge' | 'consultation' | 'scrivi') => void,
  setFocusedPart: (part: string) => void
): UseConsultationMode {
  const [consultationState, setConsultationState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [consultationRound, setConsultationRound] = useState(0);
  const [consultationScore, setConsultationScore] = useState(0);
  const [consultationTargetId, setConsultationTargetId] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [usedConsultationHotspots, setUsedConsultationHotspots] = useState<string[]>([]);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const consultationAudioRef = useRef<HTMLAudioElement | null>(null);

  // Get random hotspot for consultation (avoiding repeats)
  const getRandomConsultationTarget = useCallback((used: string[]) => {
    const available = BONE_HOTSPOTS.filter(h => !used.includes(h.id) && h.audioUrl);
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex].id;
  }, []);

  // Play consultation audio
  const playConsultationAudio = useCallback(
    (hotspotId: string) => {
      const hotspot = BONE_HOTSPOTS.find(h => h.id === hotspotId);
      if (!hotspot?.audioUrl) return;

      // Stop any currently playing audio
      if (consultationAudioRef.current) {
        consultationAudioRef.current.pause();
        consultationAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(hotspot.audioUrl);
      audio.volume = audioVolume;
      consultationAudioRef.current = audio;

      audio.onplay = () => setIsAudioPlaying(true);
      audio.onended = () => setIsAudioPlaying(false);
      audio.onerror = () => setIsAudioPlaying(false);

      audio.play().catch(() => setIsAudioPlaying(false));
    },
    [audioVolume]
  );

  // Start consultation mode
  const startConsultation = useCallback(() => {
    setGameMode('consultation');
    setConsultationState('playing');
    setConsultationRound(1);
    setConsultationScore(0);
    setUsedConsultationHotspots([]);
    setFocusedPart('full');

    // Get first random target
    const firstTarget = getRandomConsultationTarget([]);
    setConsultationTargetId(firstTarget);

    // Play audio after a short delay
    if (firstTarget) {
      setTimeout(() => playConsultationAudio(firstTarget), 500);
    }
  }, [getRandomConsultationTarget, playConsultationAudio, setGameMode, setFocusedPart]);

  // Handle consultation click
  const handleConsultationClick = useCallback(
    (clickedId: string) => {
      if (consultationState !== 'playing' || !consultationTargetId) return;

      const isCorrect = clickedId === consultationTargetId;

      // Set feedback
      setLastAnswerCorrect(isCorrect);

      if (isCorrect) {
        setConsultationScore(prev => prev + 1);
      }

      // Show correct answer briefly
      setShowCorrectAnswer(true);
      setTimeout(() => {
        setShowCorrectAnswer(false);
        setLastAnswerCorrect(null);
      }, 1500);

      // Move to next round or finish
      const newUsed = [...usedConsultationHotspots, consultationTargetId];
      setUsedConsultationHotspots(newUsed);

      if (consultationRound >= CONSULTATION_ROUNDS) {
        // Finished all rounds
        setTimeout(() => {
          setConsultationState('finished');
          setConsultationTargetId(null);
        }, 1500);
      } else {
        // Next round
        setTimeout(() => {
          const nextTarget = getRandomConsultationTarget(newUsed);
          setConsultationTargetId(nextTarget);
          setConsultationRound(prev => prev + 1);

          if (nextTarget) {
            setTimeout(() => playConsultationAudio(nextTarget), 300);
          }
        }, 1500);
      }
    },
    [
      consultationState,
      consultationTargetId,
      consultationRound,
      usedConsultationHotspots,
      getRandomConsultationTarget,
      playConsultationAudio,
    ]
  );

  // Replay consultation audio
  const replayConsultationAudio = useCallback(() => {
    if (consultationTargetId) {
      playConsultationAudio(consultationTargetId);
    }
  }, [consultationTargetId, playConsultationAudio]);

  // Exit consultation mode
  const exitConsultation = useCallback(() => {
    if (consultationAudioRef.current) {
      consultationAudioRef.current.pause();
      consultationAudioRef.current = null;
    }
    setGameMode('study');
    setConsultationState('idle');
    setConsultationRound(0);
    setConsultationScore(0);
    setConsultationTargetId(null);
    setUsedConsultationHotspots([]);
    setIsAudioPlaying(false);
    setShowCorrectAnswer(false);
  }, [setGameMode]);

  // Get consultation diagnosis based on score
  const getConsultationDiagnosis = useCallback(() => {
    const percentage = (consultationScore / CONSULTATION_ROUNDS) * 100;
    if (percentage === 100)
      return { emoji: '🏆', title: 'Esperto di Osteologia!', message: 'Perfetto! Hai identificato tutte le ossa!' };
    if (percentage >= 80) return { emoji: '🌟', title: 'Ottimo lavoro!', message: 'Conosci bene lo scheletro!' };
    if (percentage >= 60) return { emoji: '👍', title: 'Buon lavoro!', message: 'Continua a studiare le ossa!' };
    if (percentage >= 40)
      return { emoji: '📚', title: 'Devi studiare!', message: 'Torna al modo studio per migliorare.' };
    return { emoji: '💪', title: 'Non mollare!', message: 'La pratica rende perfetti!' };
  }, [consultationScore]);

  return {
    consultationState,
    consultationRound,
    consultationScore,
    consultationTargetId,
    isAudioPlaying,
    lastAnswerCorrect,
    showCorrectAnswer,
    startConsultation,
    handleConsultationClick,
    replayConsultationAudio,
    exitConsultation,
    getConsultationDiagnosis,
  };
}
