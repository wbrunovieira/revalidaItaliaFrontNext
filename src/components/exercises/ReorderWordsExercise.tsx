// src/components/exercises/ReorderWordsExercise.tsx
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, Reorder, useAnimation } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  GripVertical,
} from 'lucide-react';
import type { AnimationSentence } from '@/hooks/queries/useLesson';

interface ReorderWordsExerciseProps {
  sentences: AnimationSentence[];
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

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ReorderWordsExercise({
  sentences,
  onComplete,
}: ReorderWordsExerciseProps) {
  const t = useTranslations('Lesson.exercises');
  const containerControls = useAnimation();

  // Detect if touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Current sentence index
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSentence = sentences[currentIndex];

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
  }, [correctWords]);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Score tracking
  const [score, setScore] = useState(0);

  // Check if current order is correct
  const checkAnswer = useCallback(() => {
    if (hasChecked) return;

    const currentOrder = wordItems.map(item => item.word).join(' ');
    const correct = currentOrder === currentSentence?.fullSentence;

    setIsCorrect(correct);
    setShowFeedback(true);
    setHasChecked(true);

    if (correct) {
      triggerHapticFeedback('success');
      setScore(prev => prev + 1);
    } else {
      triggerHapticFeedback('error');
      containerControls.start('shake');
    }

    // Auto-advance after feedback
    setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowFeedback(false);
        setHasChecked(false);
      } else {
        // Exercise complete
        const finalScore = score + (correct ? 1 : 0);
        onComplete?.(finalScore === sentences.length, finalScore);
      }
    }, 1500);
  }, [wordItems, currentSentence, hasChecked, currentIndex, sentences.length, score, onComplete, containerControls]);

  // Reset exercise
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setShowFeedback(false);
    setHasChecked(false);

    const items = sentences[0]?.fullSentence.split(/\s+/).filter(w => w.length > 0).map((word, index) => ({
      id: `${word}-${index}-${Math.random()}`,
      word,
      originalIndex: index,
    })) || [];
    setWordItems(shuffleArray(items));
  }, [sentences]);

  // Handle reorder
  const handleReorder = useCallback((newOrder: WordItem[]) => {
    if (!hasChecked) {
      triggerHapticFeedback('light');
      setWordItems(newOrder);
    }
  }, [hasChecked]);

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
            <Sparkles size={14} className="text-yellow-400 sm:w-4 sm:h-4" />
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
        {currentSentence.hint && (
          <p className="text-secondary text-xs italic">{currentSentence.hint}</p>
        )}
      </motion.div>

      {/* Reorderable words */}
      <motion.div
        variants={shakeAnimation}
        animate={containerControls}
        className="mb-8"
      >
        <Reorder.Group
          axis="x"
          values={wordItems}
          onReorder={handleReorder}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 min-h-[80px]"
        >
          <AnimatePresence mode="popLayout">
            {wordItems.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium select-none touch-manipulation cursor-grab active:cursor-grabbing ${
                  hasChecked
                    ? isCorrect
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                      : 'bg-red-500/20 border border-red-500/50 text-red-400'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white hover:from-secondary/30 hover:to-secondary/20 hover:shadow-lg hover:shadow-secondary/20'
                }`}
                whileHover={!hasChecked ? { scale: 1.05, y: -2 } : {}}
                whileTap={!hasChecked ? { scale: 0.95 } : {}}
                whileDrag={{ scale: 1.1, zIndex: 50 }}
                dragListener={!hasChecked}
              >
                {!isTouchDevice && !hasChecked && (
                  <GripVertical size={14} className="text-gray-400" />
                )}
                <span className="text-sm sm:text-base">{item.word}</span>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </motion.div>

      {/* Check button */}
      {!hasChecked && (
        <div className="flex justify-center">
          <motion.button
            onClick={checkAnswer}
            className="px-8 py-3 bg-secondary hover:bg-secondary/90 text-primary font-semibold rounded-xl transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('checkOrder')}
          </motion.button>
        </div>
      )}

      {/* Correct answer hint (when wrong) */}
      {showFeedback && !isCorrect && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-gray-800/80 rounded-xl border border-gray-700"
        >
          <p className="text-gray-400 text-sm mb-2">{t('correctAnswer')}:</p>
          <p className="text-white font-medium">{currentSentence.fullSentence}</p>
        </motion.div>
      )}

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
              <div className="flex flex-col items-center gap-3 sm:gap-4">
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
