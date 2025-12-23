// src/components/exercises/TypeCompletionExercise.tsx
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';
import type { AnimationSentence } from '@/hooks/queries/useLesson';

interface TypeCompletionExerciseProps {
  sentences: AnimationSentence[];
  onComplete?: (success: boolean, score: number) => void;
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

// Normalize text for comparison (remove accents, lowercase)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function TypeCompletionExercise({
  sentences,
  onComplete,
}: TypeCompletionExerciseProps) {
  const t = useTranslations('Lesson.exercises');
  const inputControls = useAnimation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Current sentence index
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSentence = sentences[currentIndex];

  // User input
  const [userInput, setUserInput] = useState('');

  // Hint visibility state
  const [showHint, setShowHint] = useState(false);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Score tracking
  const [score, setScore] = useState(0);

  // Split sentence into parts (before and after target word)
  const sentenceParts = useMemo(() => {
    if (!currentSentence) return { before: '', after: '' };

    const { fullSentence, targetWord } = currentSentence;
    const wordIndex = fullSentence.toLowerCase().indexOf(targetWord.toLowerCase());

    if (wordIndex === -1) {
      return { before: fullSentence, after: '' };
    }

    return {
      before: fullSentence.substring(0, wordIndex),
      after: fullSentence.substring(wordIndex + targetWord.length),
    };
  }, [currentSentence]);

  // Focus input when sentence changes
  useEffect(() => {
    setUserInput('');
    setShowHint(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [currentIndex]);

  // Check answer
  const checkAnswer = useCallback(() => {
    if (hasChecked || !userInput.trim()) return;

    const normalizedInput = normalizeText(userInput);
    const normalizedTarget = normalizeText(currentSentence?.targetWord || '');
    const correct = normalizedInput === normalizedTarget;

    setIsCorrect(correct);
    setShowFeedback(true);
    setHasChecked(true);

    if (correct) {
      triggerHapticFeedback('success');
      setScore(prev => prev + 1);
    } else {
      triggerHapticFeedback('error');
      inputControls.start('shake');
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
  }, [userInput, currentSentence, hasChecked, currentIndex, sentences.length, score, onComplete, inputControls]);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userInput.trim()) {
      checkAnswer();
    }
  }, [userInput, checkAnswer]);

  // Reset exercise
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setShowFeedback(false);
    setHasChecked(false);
    setUserInput('');
    setShowHint(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

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
        <p className="text-gray-400 text-sm mb-2">{t('typeInstruction')}</p>
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

      {/* Sentence with input */}
      <motion.div
        variants={shakeAnimation}
        animate={inputControls}
        className="mb-8"
      >
        <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <p className="text-lg sm:text-xl text-white leading-relaxed text-center flex flex-wrap items-center justify-center gap-1">
            <span>{sentenceParts.before}</span>

            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex"
            >
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => !hasChecked && setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={hasChecked}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="..."
                className={`w-32 sm:w-40 px-3 py-2 text-center font-semibold rounded-lg border-2 bg-gray-900/50 outline-none transition-all ${
                  hasChecked
                    ? isCorrect
                      ? 'border-green-500 text-green-400 bg-green-500/10'
                      : 'border-red-500 text-red-400 bg-red-500/10'
                    : 'border-secondary/50 text-white focus:border-secondary focus:bg-secondary/10'
                }`}
              />
            </motion.span>

            <span>{sentenceParts.after}</span>
          </p>
        </div>
      </motion.div>

      {/* Submit button */}
      {!hasChecked && (
        <div className="flex justify-center">
          <motion.button
            onClick={checkAnswer}
            disabled={!userInput.trim()}
            className={`px-8 py-3 font-semibold rounded-xl transition-all ${
              userInput.trim()
                ? 'bg-secondary hover:bg-secondary/90 text-primary'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={userInput.trim() ? { scale: 1.02 } : {}}
            whileTap={userInput.trim() ? { scale: 0.98 } : {}}
          >
            {t('check')}
          </motion.button>
        </div>
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
                    {t('correctAnswer')}: <strong>{currentSentence.targetWord}</strong>
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
