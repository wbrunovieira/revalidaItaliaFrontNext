'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { ANATOMY_HOTSPOTS, BODY_PARTS } from '../data';

const SCRIVI_ROUNDS = 10;

interface UseScriviMode {
  // State
  scriviState: 'idle' | 'playing' | 'finished';
  scriviRound: number;
  scriviScore: number;
  scriviTargetId: string | null;
  scriviInput: string;
  scriviAnswerFeedback: 'correct' | 'wrong' | null;
  scriviInputRef: React.RefObject<HTMLInputElement | null>;
  currentScriviLabel: string;
  // Actions
  setScriviInput: (input: string) => void;
  startScrivi: () => void;
  handleScriviSubmit: () => void;
  exitScrivi: () => void;
  getScriviDiagnosis: () => { emoji: string; title: string; message: string };
}

export function useScriviMode(
  setGameMode: (mode: 'study' | 'challenge' | 'consultation' | 'scrivi') => void,
  setFocusedPart: (part: string) => void
): UseScriviMode {
  const [scriviState, setScriviState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [scriviRound, setScriviRound] = useState(0);
  const [scriviScore, setScriviScore] = useState(0);
  const [scriviTargetId, setScriviTargetId] = useState<string | null>(null);
  const [scriviInput, setScriviInput] = useState('');
  const [usedScriviHotspots, setUsedScriviHotspots] = useState<string[]>([]);
  const [scriviAnswerFeedback, setScriviAnswerFeedback] = useState<'correct' | 'wrong' | null>(null);
  const scriviInputRef = useRef<HTMLInputElement | null>(null);

  // Get random hotspot for scrivi (avoiding repeats)
  const getRandomScriviTarget = useCallback((used: string[]) => {
    const available = ANATOMY_HOTSPOTS.filter(h => !used.includes(h.id));
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex].id;
  }, []);

  // Get camera position for a hotspot (for auto-zoom in scrivi mode)
  const getHotspotCameraPosition = useCallback((hotspotId: string) => {
    const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === hotspotId);
    if (!hotspot) return null;

    const xPos = hotspot.position[0]; // X position (lateral)
    const yPos = hotspot.position[1]; // Y position (vertical in cm)

    // Hand hotspots have x > 25 (lateral position)
    if (Math.abs(xPos) > 25) {
      return BODY_PARTS.find(p => p.id === 'hand');
    }
    // Head: y > 155 (testa, fronte, naso, bocca, occhio, etc.)
    if (yPos > 155) {
      return BODY_PARTS.find(p => p.id === 'head');
    }
    // Torso: y > 80 (spalla, schiena, petto, addome, lombare, etc.)
    if (yPos > 80) {
      return BODY_PARTS.find(p => p.id === 'torso');
    }
    // Legs: y <= 80 (coscia, ginocchio, gamba, piede, etc.)
    return BODY_PARTS.find(p => p.id === 'legs');
  }, []);

  // Start scrivi mode
  const startScrivi = useCallback(() => {
    setGameMode('scrivi');
    setScriviState('playing');
    setScriviRound(1);
    setScriviScore(0);
    setScriviInput('');
    setUsedScriviHotspots([]);
    setScriviAnswerFeedback(null);

    // Get first random target
    const firstTarget = getRandomScriviTarget([]);
    setScriviTargetId(firstTarget);

    // Auto-zoom to the body part
    if (firstTarget) {
      const cameraConfig = getHotspotCameraPosition(firstTarget);
      if (cameraConfig) {
        setFocusedPart(cameraConfig.id);
      }
    }

    // Focus input after a short delay
    setTimeout(() => {
      scriviInputRef.current?.focus();
    }, 500);
  }, [getRandomScriviTarget, getHotspotCameraPosition, setGameMode, setFocusedPart]);

  // Handle scrivi input submission
  const handleScriviSubmit = useCallback(() => {
    if (scriviState !== 'playing' || !scriviTargetId || !scriviInput.trim()) return;

    const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === scriviTargetId);
    if (!hotspot) return;

    // Normalize both strings for comparison (lowercase, trim)
    const normalizedInput = scriviInput.trim().toLowerCase();
    const normalizedLabel = hotspot.label.toLowerCase();

    const isCorrect = normalizedInput === normalizedLabel;

    // Set feedback
    setScriviAnswerFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScriviScore(prev => prev + 1);
    }

    // Move to next round after feedback
    const newUsed = [...usedScriviHotspots, scriviTargetId];
    setUsedScriviHotspots(newUsed);

    if (scriviRound >= SCRIVI_ROUNDS) {
      // Finished all rounds
      setTimeout(() => {
        setScriviState('finished');
        setScriviTargetId(null);
        setScriviInput('');
        setScriviAnswerFeedback(null);
      }, 1500);
    } else {
      // Next round
      setTimeout(() => {
        const nextTarget = getRandomScriviTarget(newUsed);
        setScriviTargetId(nextTarget);
        setScriviRound(prev => prev + 1);
        setScriviInput('');
        setScriviAnswerFeedback(null);

        // Auto-zoom to the new body part
        if (nextTarget) {
          const cameraConfig = getHotspotCameraPosition(nextTarget);
          if (cameraConfig) {
            setFocusedPart(cameraConfig.id);
          }
        }

        // Focus input
        setTimeout(() => {
          scriviInputRef.current?.focus();
        }, 100);
      }, 1500);
    }
  }, [
    scriviState,
    scriviTargetId,
    scriviInput,
    scriviRound,
    usedScriviHotspots,
    getRandomScriviTarget,
    getHotspotCameraPosition,
    setFocusedPart,
  ]);

  // Exit scrivi mode
  const exitScrivi = useCallback(() => {
    setGameMode('study');
    setScriviState('idle');
    setScriviRound(0);
    setScriviScore(0);
    setScriviTargetId(null);
    setScriviInput('');
    setUsedScriviHotspots([]);
    setScriviAnswerFeedback(null);
  }, [setGameMode]);

  // Get scrivi diagnosis based on score
  const getScriviDiagnosis = useCallback(() => {
    const percentage = (scriviScore / SCRIVI_ROUNDS) * 100;
    if (percentage === 100)
      return { emoji: '🏆', title: 'Scrittura Perfetta!', message: 'Conosci tutti i nomi anatomici!' };
    if (percentage >= 80) return { emoji: '🌟', title: 'Ottimo lavoro!', message: 'Scrivi quasi tutto correttamente!' };
    if (percentage >= 60) return { emoji: '👍', title: 'Buon lavoro!', message: 'Continua a praticare la scrittura!' };
    if (percentage >= 40)
      return { emoji: '📚', title: 'Devi studiare!', message: 'Ripassa i nomi delle parti del corpo.' };
    return { emoji: '✏️', title: 'Non mollare!', message: 'La pratica rende perfetti!' };
  }, [scriviScore]);

  // Get current scrivi target label
  const currentScriviLabel = useMemo(() => {
    if (!scriviTargetId) return '';
    const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === scriviTargetId);
    return hotspot?.label || '';
  }, [scriviTargetId]);

  return {
    scriviState,
    scriviRound,
    scriviScore,
    scriviTargetId,
    scriviInput,
    scriviAnswerFeedback,
    scriviInputRef,
    currentScriviLabel,
    setScriviInput,
    startScrivi,
    handleScriviSubmit,
    exitScrivi,
    getScriviDiagnosis,
  };
}
