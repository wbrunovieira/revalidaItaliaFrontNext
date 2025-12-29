'use client';

import { useState, useCallback, useMemo } from 'react';
import { ANATOMY_HOTSPOTS } from '../data';

interface UseChallengeMode {
  // State
  challengeState: 'idle' | 'playing' | 'won' | 'lost';
  currentTargetId: string | null;
  score: number;
  completedHotspots: string[];
  showCorrectAnswer: boolean;
  startTime: number | null;
  endTime: number | null;
  currentTargetLabel: string;
  // Actions
  startChallenge: () => void;
  handleChallengeClick: (clickedId: string) => void;
  restartChallenge: () => void;
  exitChallenge: () => void;
  getElapsedTime: () => string;
}

export function useChallengeMode(
  setGameMode: (mode: 'study' | 'challenge' | 'consultation' | 'scrivi') => void,
  setFocusedPart: (part: string) => void
): UseChallengeMode {
  const [challengeState, setChallengeState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [completedHotspots, setCompletedHotspots] = useState<string[]>([]);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  // Get random hotspot from remaining ones
  const getNextRandomTarget = useCallback((completed: string[]) => {
    const remaining = ANATOMY_HOTSPOTS.filter(h => !completed.includes(h.id));
    if (remaining.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * remaining.length);
    return remaining[randomIndex].id;
  }, []);

  // Start challenge
  const startChallenge = useCallback(() => {
    setGameMode('challenge');
    setChallengeState('playing');
    setScore(0);
    setCompletedHotspots([]);
    setShowCorrectAnswer(false);
    setStartTime(Date.now());
    setEndTime(null);
    setFocusedPart('full');
    // Get first random target
    const firstTarget = getNextRandomTarget([]);
    setCurrentTargetId(firstTarget);
  }, [getNextRandomTarget, setGameMode, setFocusedPart]);

  // Handle challenge click
  const handleChallengeClick = useCallback(
    (clickedId: string) => {
      if (challengeState !== 'playing' || !currentTargetId) return;

      if (clickedId === currentTargetId) {
        // Correct!
        const newCompleted = [...completedHotspots, currentTargetId];
        setCompletedHotspots(newCompleted);
        setScore(prev => prev + 1);

        // Check if all completed
        if (newCompleted.length === ANATOMY_HOTSPOTS.length) {
          setChallengeState('won');
          setEndTime(Date.now());
          setCurrentTargetId(null);
        } else {
          // Get next target
          const nextTarget = getNextRandomTarget(newCompleted);
          setCurrentTargetId(nextTarget);
        }
      } else {
        // Wrong! Show correct answer and reset
        setShowCorrectAnswer(true);
        setChallengeState('lost');

        // After 2 seconds, show the lost state
        setTimeout(() => {
          setShowCorrectAnswer(false);
        }, 2000);
      }
    },
    [challengeState, currentTargetId, completedHotspots, getNextRandomTarget]
  );

  // Restart challenge after losing
  const restartChallenge = useCallback(() => {
    startChallenge();
  }, [startChallenge]);

  // Exit challenge mode
  const exitChallenge = useCallback(() => {
    setGameMode('study');
    setChallengeState('idle');
    setCurrentTargetId(null);
    setScore(0);
    setCompletedHotspots([]);
    setShowCorrectAnswer(false);
    setStartTime(null);
    setEndTime(null);
  }, [setGameMode]);

  // Get current target label
  const currentTargetLabel = useMemo(() => {
    if (!currentTargetId) return '';
    const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === currentTargetId);
    return hotspot?.label || '';
  }, [currentTargetId]);

  // Calculate elapsed time
  const getElapsedTime = useCallback(() => {
    if (!startTime) return '0:00';
    const end = endTime || Date.now();
    const seconds = Math.floor((end - startTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [startTime, endTime]);

  return {
    challengeState,
    currentTargetId,
    score,
    completedHotspots,
    showCorrectAnswer,
    startTime,
    endTime,
    currentTargetLabel,
    startChallenge,
    handleChallengeClick,
    restartChallenge,
    exitChallenge,
    getElapsedTime,
  };
}
