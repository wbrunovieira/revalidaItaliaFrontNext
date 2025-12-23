// src/components/exercises/ReorderWordsExercise.tsx
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Star,
  GripVertical,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';
import type { AnimationSentence } from '@/hooks/queries/useLesson';

interface ReorderWordsExerciseProps {
  sentences: AnimationSentence[];
  onAttempt?: (isCorrect: boolean) => void;
  onComplete?: (success: boolean, score: number) => void;
}

interface WordItem {
  id: string;
  word: string;
  originalIndex: number;
}

// Haptic feedback utility
const triggerHapticFeedback = (type: 'success' | 'error' | 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    switch (type) {
      case 'success':
        navigator.vibrate([50, 50, 50]);
        break;
      case 'error':
        navigator.vibrate([100, 50, 100, 50, 100]);
        break;
      case 'light':
        navigator.vibrate(30);
        break;
    }
  }
};

// Shake animation variants
const shakeAnimation = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 }
  }
};

// Fisher-Yates shuffle that ensures array is actually shuffled
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Confetti particle component
const ConfettiParticle = ({ delay, colorIndex }: { delay: number; colorIndex: number }) => {
  const colors = [
    'text-secondary fill-secondary',
    'text-accent fill-accent',
    'text-green-400 fill-green-400',
  ];

  const randomX = Math.random() * 200 - 100;
  const randomRotation = Math.random() * 720 - 360;

  return (
    <motion.div
      className="absolute"
      initial={{
        opacity: 1,
        scale: 0,
        x: 0,
        y: 0,
        rotate: 0
      }}
      animate={{
        opacity: [1, 1, 0],
        scale: [0, 1, 0.5],
        x: randomX,
        y: -150 - Math.random() * 100,
        rotate: randomRotation
      }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <Star size={12} className={colors[colorIndex % colors.length]} />
    </motion.div>
  );
};

export default function ReorderWordsExercise({
  sentences,
  onAttempt,
  onComplete,
}: ReorderWordsExerciseProps) {
  const t = useTranslations('Lesson.exercises');
  const containerControls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect if touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Current sentence index
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSentence = sentences[currentIndex];

  // Hint visibility state
  const [showHint, setShowHint] = useState(false);

  // Get words from sentence and create shuffled array
  const correctWords = useMemo(() => {
    if (!currentSentence) return [];
    // Split by spaces, keeping punctuation attached to words
    return currentSentence.fullSentence.split(/\s+/).filter(w => w.length > 0);
  }, [currentSentence]);

  // Initialize shuffled words
  const [wordItems, setWordItems] = useState<WordItem[]>(() => {
    const items = correctWords.map((word, index) => ({
      id: `${word}-${index}-${Math.random()}`,
      word,
      originalIndex: index,
    }));
    return shuffleArray(items);
  });

  // Reset words when sentence changes
  useEffect(() => {
    const items = correctWords.map((word, index) => ({
      id: `${word}-${index}-${Math.random()}`,
      word,
      originalIndex: index,
    }));
    setWordItems(shuffleArray(items));
    setSelectedIndex(null);
    setShowHint(false);
  }, [correctWords]);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Score tracking
  const [score, setScore] = useState(0);

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);

  // Selected word index for tap-to-swap
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Auto-check function - called after each reorder
  const checkIfCorrect = useCallback((items: WordItem[]) => {
    if (hasChecked) return;

    const currentOrder = items.map(item => item.word).join(' ');
    const correct = currentOrder === currentSentence?.fullSentence;

    // Record attempt when correct (reorder exercises auto-verify on each change)
    if (correct) {
      onAttempt?.(true);

      // Correct! Show success feedback
      setIsCorrect(true);
      setShowFeedback(true);
      setHasChecked(true);
      setShowConfetti(true);
      triggerHapticFeedback('success');
      setScore(prev => prev + 1);

      // Auto-advance after feedback
      setTimeout(() => {
        setShowConfetti(false);
        if (currentIndex < sentences.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setShowFeedback(false);
          setHasChecked(false);
        } else {
          // Exercise complete
          const finalScore = score + 1;
          onComplete?.(finalScore === sentences.length, finalScore);
        }
      }, 1500);
    }
  }, [hasChecked, currentSentence, currentIndex, sentences.length, score, onAttempt, onComplete]);

  // Reset exercise
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setShowFeedback(false);
    setHasChecked(false);
    setSelectedIndex(null);
    setShowHint(false);
    setShowConfetti(false);

    const items = sentences[0]?.fullSentence.split(/\s+/).filter(w => w.length > 0).map((word, index) => ({
      id: `${word}-${index}-${Math.random()}`,
      word,
      originalIndex: index,
    })) || [];
    setWordItems(shuffleArray(items));
  }, [sentences]);

  // Handle word tap (for mobile tap-to-swap)
  const handleWordTap = useCallback((index: number) => {
    if (hasChecked) return;

    triggerHapticFeedback('light');

    if (selectedIndex === null) {
      // First tap - select the word
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      // Tap same word - deselect
      setSelectedIndex(null);
    } else {
      // Second tap - swap words
      setWordItems(prev => {
        const newItems = [...prev];
        [newItems[selectedIndex], newItems[index]] = [newItems[index], newItems[selectedIndex]];
        // Check after swap
        setTimeout(() => checkIfCorrect(newItems), 100);
        return newItems;
      });
      setSelectedIndex(null);
    }
  }, [hasChecked, selectedIndex, checkIfCorrect]);

  // Drag handlers for desktop
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (hasChecked) return;

    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());

    // Make drag image slightly transparent
    const target = e.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  }, [hasChecked]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === targetIndex || hasChecked) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    triggerHapticFeedback('light');

    // Swap the words
    setWordItems(prev => {
      const newItems = [...prev];
      [newItems[draggedIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[draggedIndex]];
      // Check after swap
      setTimeout(() => checkIfCorrect(newItems), 100);
      return newItems;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, hasChecked, checkIfCorrect]);

  // Touch drag handlers for mobile
  const touchStartPos = useRef<{ x: number; y: number; index: number } | null>(null);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    if (hasChecked) return;

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY, index };

    // Long press to start drag
    const timer = setTimeout(() => {
      if (touchStartPos.current?.index === index) {
        setTouchDragIndex(index);
        triggerHapticFeedback('light');
      }
    }, 200);

    // Store timer to cancel if touch ends quickly
    (e.target as HTMLElement).dataset.touchTimer = timer.toString();
  }, [hasChecked]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchDragIndex === null || !containerRef.current) return;

    const touch = e.touches[0];
    const elements = containerRef.current.querySelectorAll('[data-word-index]');

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const index = parseInt(el.getAttribute('data-word-index') || '-1');

      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom &&
        index !== touchDragIndex
      ) {
        setDragOverIndex(index);
      }
    });
  }, [touchDragIndex]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const timer = (e.target as HTMLElement).dataset.touchTimer;
    if (timer) {
      clearTimeout(parseInt(timer));
    }

    if (touchDragIndex !== null && dragOverIndex !== null && touchDragIndex !== dragOverIndex) {
      triggerHapticFeedback('light');

      setWordItems(prev => {
        const newItems = [...prev];
        [newItems[touchDragIndex], newItems[dragOverIndex]] = [newItems[dragOverIndex], newItems[touchDragIndex]];
        // Check after swap
        setTimeout(() => checkIfCorrect(newItems), 100);
        return newItems;
      });
    }

    touchStartPos.current = null;
    setTouchDragIndex(null);
    setDragOverIndex(null);
  }, [touchDragIndex, dragOverIndex, checkIfCorrect]);

  if (!currentSentence) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-400">
            {t('question')} {currentIndex + 1} {t('of')} {sentences.length}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1">
            <Sparkles size={14} className="text-secondary sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium text-white">{score}</span>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors active:scale-95"
            title={t('reset')}
          >
            <RotateCcw size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700 rounded-full mb-6 sm:mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-secondary to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / sentences.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Instruction */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <p className="text-gray-400 text-sm mb-2">{t('reorderInstruction')}</p>
        {isTouchDevice && (
          <p className="text-secondary/70 text-xs">{t('tapToSwap')}</p>
        )}
      </motion.div>

      {/* Hint button (only if hint exists) */}
      {currentSentence.hint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4"
        >
          <button
            onClick={() => setShowHint(!showHint)}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
              showHint
                ? 'bg-secondary/20 text-secondary'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
            }`}
          >
            <Lightbulb size={16} className={showHint ? 'text-secondary' : ''} />
            <span className="text-sm">{t('showHint')}</span>
            <motion.div
              animate={{ rotate: showHint ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </button>

          <AnimatePresence>
            {showHint && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                  <p className="text-secondary text-sm italic text-center">
                    {currentSentence.hint}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Reorderable words */}
      <motion.div
        ref={containerRef}
        variants={shakeAnimation}
        animate={containerControls}
        className="mb-8"
      >
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 min-h-[80px]">
          <AnimatePresence mode="popLayout">
            {wordItems.map((item, index) => (
              <motion.div
                key={item.id}
                data-word-index={index}
                layout
                layoutId={item.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: draggedIndex === index || touchDragIndex === index ? 0.5 : 1,
                  scale: dragOverIndex === index ? 1.1 : 1,
                  y: dragOverIndex === index ? -4 : 0
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                draggable={!hasChecked && !isTouchDevice}
                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, index)}
                onDragEnd={(e) => handleDragEnd(e as unknown as React.DragEvent)}
                onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e as unknown as React.DragEvent, index)}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => handleWordTap(index)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium select-none touch-none cursor-pointer transition-colors ${
                  hasChecked
                    ? isCorrect
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                      : 'bg-red-500/20 border border-red-500/50 text-red-400'
                    : selectedIndex === index
                    ? 'bg-secondary/40 border-2 border-secondary text-white shadow-lg shadow-secondary/30'
                    : dragOverIndex === index
                    ? 'bg-secondary/30 border-2 border-secondary/50 text-white'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white hover:from-secondary/30 hover:to-secondary/20 border border-transparent'
                }`}
              >
                {!isTouchDevice && !hasChecked && (
                  <GripVertical size={14} className="text-gray-400 cursor-grab active:cursor-grabbing" />
                )}
                <span className="text-sm sm:text-base">{item.word}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Feedback overlay */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.9 }}
              className={`p-6 sm:p-8 rounded-2xl max-w-sm w-full ${
                isCorrect
                  ? 'bg-gradient-to-br from-green-600 to-emerald-700'
                  : 'bg-gradient-to-br from-red-600 to-rose-700'
              }`}
            >
              <div className="flex flex-col items-center gap-3 sm:gap-4 relative">
                {/* Confetti particles */}
                {showConfetti && isCorrect && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <ConfettiParticle
                        key={`confetti-${i}`}
                        delay={i * 0.05}
                        colorIndex={i}
                      />
                    ))}
                  </div>
                )}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  {isCorrect ? (
                    <CheckCircle size={48} className="text-white sm:w-16 sm:h-16" />
                  ) : (
                    <XCircle size={48} className="text-white sm:w-16 sm:h-16" />
                  )}
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {isCorrect ? t('correct') : t('incorrect')}
                </h3>
                {!isCorrect && (
                  <p className="text-white/80 text-center text-sm sm:text-base">
                    {t('correctAnswer')}: <strong>{currentSentence.fullSentence}</strong>
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
