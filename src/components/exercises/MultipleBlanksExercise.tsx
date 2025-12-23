// src/components/exercises/MultipleBlanksExercise.tsx
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

interface MultipleBlanksExerciseProps {
  sentences: AnimationSentence[];
  onComplete?: (success: boolean, score: number) => void;
}

interface BlankInfo {
  index: number;
  answer: string;
}

interface ParsedSentence {
  parts: string[];
  blanks: BlankInfo[];
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

// Parse sentence to find blanks (marked with ___ or [BLANK])
function parseSentence(fullSentence: string, targetWord: string): ParsedSentence {
  // Split answers by | delimiter
  const answers = targetWord.split('|').map(a => a.trim());

  // Find blank markers (3+ underscores or [BLANK])
  const blankPattern = /_{3,}|\[BLANK\]/gi;
  const parts: string[] = [];
  const blanks: BlankInfo[] = [];

  let lastIndex = 0;
  let match;
  let blankIndex = 0;

  while ((match = blankPattern.exec(fullSentence)) !== null) {
    // Add text before the blank
    if (match.index > lastIndex) {
      parts.push(fullSentence.substring(lastIndex, match.index));
    }

    // Add blank marker
    parts.push('__BLANK__');
    blanks.push({
      index: blankIndex,
      answer: answers[blankIndex] || ''
    });

    blankIndex++;
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < fullSentence.length) {
    parts.push(fullSentence.substring(lastIndex));
  }

  return { parts, blanks };
}

export default function MultipleBlanksExercise({
  sentences,
  onComplete,
}: MultipleBlanksExerciseProps) {
  const t = useTranslations('Lesson.exercises');
  const containerControls = useAnimation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Current sentence index
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSentence = sentences[currentIndex];

  // Parse sentence to get blanks
  const parsedSentence = useMemo(() => {
    if (!currentSentence) return { parts: [], blanks: [] };
    return parseSentence(currentSentence.fullSentence, currentSentence.targetWord);
  }, [currentSentence]);

  // User inputs for each blank
  const [userInputs, setUserInputs] = useState<string[]>([]);

  // Hint visibility state
  const [showHint, setShowHint] = useState(false);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [correctBlanks, setCorrectBlanks] = useState<boolean[]>([]);

  // Score tracking
  const [score, setScore] = useState(0);

  // Reset inputs when sentence changes
  useEffect(() => {
    setUserInputs(new Array(parsedSentence.blanks.length).fill(''));
    setCorrectBlanks([]);
    setShowHint(false);
    // Focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, [currentIndex, parsedSentence.blanks.length]);

  // Handle input change
  const handleInputChange = useCallback((index: number, value: string) => {
    if (hasChecked) return;
    setUserInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  }, [hasChecked]);

  // Handle key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      // If not last blank, move to next
      if (index < parsedSentence.blanks.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (userInputs.every(input => input.trim())) {
        // If all filled, check answer
        checkAnswer();
      }
    } else if (e.key === 'Tab' && !e.shiftKey && index === parsedSentence.blanks.length - 1) {
      // Prevent tab from leaving the last input
      e.preventDefault();
      if (userInputs.every(input => input.trim())) {
        checkAnswer();
      }
    }
  }, [parsedSentence.blanks.length, userInputs]);

  // Check answer
  const checkAnswer = useCallback(() => {
    if (hasChecked) return;

    const results = parsedSentence.blanks.map((blank, index) => {
      const userAnswer = normalizeText(userInputs[index] || '');
      const correctAnswer = normalizeText(blank.answer);
      return userAnswer === correctAnswer;
    });

    const allCorrect = results.every(r => r);
    setCorrectBlanks(results);
    setIsCorrect(allCorrect);
    setShowFeedback(true);
    setHasChecked(true);

    if (allCorrect) {
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
        const finalScore = score + (allCorrect ? 1 : 0);
        onComplete?.(finalScore === sentences.length, finalScore);
      }
    }, 2000);
  }, [hasChecked, parsedSentence.blanks, userInputs, currentIndex, sentences.length, score, onComplete, containerControls]);

  // Reset exercise
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setShowFeedback(false);
    setHasChecked(false);
    setUserInputs([]);
    setCorrectBlanks([]);
    setShowHint(false);
  }, []);

  // Check if all inputs are filled
  const allInputsFilled = useMemo(() => {
    return userInputs.length > 0 && userInputs.every(input => input.trim());
  }, [userInputs]);

  if (!currentSentence) return null;

  // Render the sentence with input blanks
  const renderSentence = () => {
    let blankCounter = 0;

    return parsedSentence.parts.map((part, partIndex) => {
      if (part === '__BLANK__') {
        const currentBlankIndex = blankCounter;
        blankCounter++;

        return (
          <motion.span
            key={`blank-${partIndex}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex mx-1"
          >
            <input
              ref={(el) => { inputRefs.current[currentBlankIndex] = el; }}
              type="text"
              value={userInputs[currentBlankIndex] || ''}
              onChange={(e) => handleInputChange(currentBlankIndex, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, currentBlankIndex)}
              disabled={hasChecked}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={`${currentBlankIndex + 1}`}
              className={`w-24 sm:w-32 px-2 py-1 text-center font-semibold rounded-lg border-2 bg-gray-900/50 outline-none transition-all text-sm sm:text-base ${
                hasChecked
                  ? correctBlanks[currentBlankIndex]
                    ? 'border-green-500 text-green-400 bg-green-500/10'
                    : 'border-red-500 text-red-400 bg-red-500/10'
                  : 'border-secondary/50 text-white focus:border-secondary focus:bg-secondary/10'
              }`}
            />
          </motion.span>
        );
      }

      return <span key={`text-${partIndex}`}>{part}</span>;
    });
  };

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
        <p className="text-gray-400 text-sm mb-2">{t('multipleBlanksInstruction')}</p>
        <p className="text-secondary/70 text-xs">
          {t('blanksCount', { count: parsedSentence.blanks.length })}
        </p>
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

      {/* Sentence with multiple blanks */}
      <motion.div
        variants={shakeAnimation}
        animate={containerControls}
        className="mb-8"
      >
        <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <p className="text-lg sm:text-xl text-white leading-relaxed text-center flex flex-wrap items-center justify-center gap-1">
            {renderSentence()}
          </p>
        </div>
      </motion.div>

      {/* Submit button */}
      {!hasChecked && (
        <div className="flex justify-center">
          <motion.button
            onClick={checkAnswer}
            disabled={!allInputsFilled}
            className={`px-8 py-3 font-semibold rounded-xl transition-all ${
              allInputsFilled
                ? 'bg-secondary hover:bg-secondary/90 text-primary'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={allInputsFilled ? { scale: 1.02 } : {}}
            whileTap={allInputsFilled ? { scale: 0.98 } : {}}
          >
            {t('check')}
          </motion.button>
        </div>
      )}

      {/* Correct answers (when wrong) */}
      {showFeedback && !isCorrect && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-gray-800/80 rounded-xl border border-gray-700"
        >
          <p className="text-gray-400 text-sm mb-2">{t('correctAnswers')}:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {parsedSentence.blanks.map((blank, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  correctBlanks[index]
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {index + 1}. {blank.answer}
              </span>
            ))}
          </div>
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
                  <div className="text-white/80 text-center text-sm sm:text-base">
                    <p className="mb-2">{t('correctAnswers')}:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {parsedSentence.blanks.map((blank, index) => (
                        <span key={index} className="font-semibold bg-white/20 px-2 py-1 rounded">
                          {blank.answer}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
