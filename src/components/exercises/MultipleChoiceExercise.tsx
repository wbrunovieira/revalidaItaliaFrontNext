// src/components/exercises/MultipleChoiceExercise.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Star,
  Zap,
  ArrowRight,
} from 'lucide-react';

export interface MultipleChoiceQuestion {
  question: string;
  options: [string, string, string];
  correctOptionIndex: 0 | 1 | 2;
  explanation?: string;
}

interface MultipleChoiceExerciseProps {
  questions: MultipleChoiceQuestion[];
  onAttempt?: (isCorrect: boolean) => void;
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

// Confetti particle component - using project colors
const ConfettiParticle = ({ delay, colorIndex }: { delay: number; colorIndex: number }) => {
  const colors = [
    'text-secondary fill-secondary',
    'text-accent fill-accent',
    'text-green-400 fill-green-400',
  ];
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{
        opacity: 1,
        scale: 0,
        x: 0,
        y: 0,
      }}
      animate={{
        opacity: [1, 1, 0],
        scale: [0, 1.5, 1],
        x: Math.random() * 200 - 100,
        y: Math.random() * -150 - 50,
        rotate: Math.random() * 360,
      }}
      transition={{
        duration: 1,
        delay,
        ease: 'easeOut',
      }}
    >
      <Star
        size={Math.random() * 12 + 8}
        className={colors[colorIndex % colors.length]}
      />
    </motion.div>
  );
};

// Shake animation variants
const shakeAnimation = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 },
  },
};

// Option card styles using project colors (primary/secondary/accent)
const optionStyles = {
  // All options share the same elegant gradient style
  bg: 'from-primary/20 via-secondary/15 to-primary/10',
  border: 'border-secondary/40',
  hoverBorder: 'hover:border-secondary/70',
  selected: 'border-secondary bg-secondary/25',
  text: 'text-gray-200',
  // Different icon backgrounds for visual variety
  iconBgs: [
    'bg-gradient-to-br from-secondary to-primary',
    'bg-gradient-to-br from-accent to-secondary',
    'bg-gradient-to-br from-primary to-accent',
  ],
};

export default function MultipleChoiceExercise({
  questions,
  onAttempt,
  onComplete,
}: MultipleChoiceExerciseProps) {
  const t = useTranslations('Lesson.exercises');
  const cardControls = useAnimation();

  // Current question index
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = questions[currentIndex];

  // Selected option
  const [selectedOption, setSelectedOption] = useState<0 | 1 | 2 | null>(null);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Show explanation
  const [showExplanation, setShowExplanation] = useState(false);

  // Confetti
  const [showConfetti, setShowConfetti] = useState(false);

  // Score tracking
  const [score, setScore] = useState(0);

  // Reset states when question changes
  useEffect(() => {
    setSelectedOption(null);
    setShowFeedback(false);
    setHasAnswered(false);
    setShowExplanation(false);
    setShowConfetti(false);
  }, [currentIndex]);

  // Handle option selection
  const handleOptionSelect = useCallback(
    (index: 0 | 1 | 2) => {
      if (hasAnswered) return;

      triggerHapticFeedback('light');
      setSelectedOption(index);
    },
    [hasAnswered]
  );

  // Check answer
  const checkAnswer = useCallback(() => {
    if (hasAnswered || selectedOption === null) return;

    const correct = selectedOption === currentQuestion?.correctOptionIndex;

    // Record attempt
    onAttempt?.(correct);

    setIsCorrect(correct);
    setShowFeedback(true);
    setHasAnswered(true);

    if (correct) {
      triggerHapticFeedback('success');
      setScore((prev) => prev + 1);
      setShowConfetti(true);
    } else {
      triggerHapticFeedback('error');
      cardControls.start('shake');
    }

    // Show explanation after feedback
    setTimeout(() => {
      if (currentQuestion?.explanation) {
        setShowExplanation(true);
      }
    }, 800);
  }, [
    selectedOption,
    currentQuestion,
    hasAnswered,
    onAttempt,
    cardControls,
  ]);

  // Go to next question
  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Exercise complete
      const finalScore = score + (isCorrect ? 0 : 0); // Score already updated
      onComplete?.(finalScore === questions.length, score);
    }
  }, [currentIndex, questions.length, score, isCorrect, onComplete]);

  // Reset exercise
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setHasAnswered(false);
    setShowExplanation(false);
    setShowConfetti(false);
  }, []);

  // Option letters
  const optionLetters = ['A', 'B', 'C'];

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-400">
            {t('question')} {currentIndex + 1} {t('of')} {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1">
            <Sparkles size={14} className="text-secondary sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium text-white">
              {score}
            </span>
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
          animate={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Question card */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="p-6 sm:p-8 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-700/50 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center shadow-lg">
              <Zap size={24} className="text-white" />
            </div>
            <p className="text-lg sm:text-xl font-medium text-white leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Options */}
      <motion.div
        variants={shakeAnimation}
        animate={cardControls}
        className="space-y-3 sm:space-y-4 relative"
      >
        {/* Confetti container */}
        {showConfetti && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            {Array.from({ length: 12 }).map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.05} colorIndex={i} />
            ))}
          </div>
        )}

        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrectOption =
            index === currentQuestion.correctOptionIndex;
          const showResult = hasAnswered;
          const iconBgBase = optionStyles.iconBgs[index];

          // Determine styling based on state
          let optionStyle = `bg-gradient-to-r ${optionStyles.bg} ${optionStyles.border} ${optionStyles.hoverBorder}`;
          let iconBg = iconBgBase;

          if (showResult) {
            if (isCorrectOption) {
              optionStyle =
                'bg-gradient-to-r from-green-600/25 via-emerald-500/20 to-green-700/15 border-green-500';
              iconBg = 'bg-gradient-to-br from-green-500 to-emerald-600';
            } else if (isSelected && !isCorrectOption) {
              optionStyle =
                'bg-gradient-to-r from-red-600/25 via-rose-500/20 to-red-700/15 border-red-500';
              iconBg = 'bg-gradient-to-br from-red-500 to-rose-600';
            }
          } else if (isSelected) {
            optionStyle = `bg-gradient-to-r ${optionStyles.selected} shadow-[0_0_20px_rgba(56,135,166,0.2)]`;
          }

          return (
            <motion.button
              key={index}
              onClick={() => handleOptionSelect(index as 0 | 1 | 2)}
              disabled={hasAnswered}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: index * 0.12, duration: 0.4, type: 'spring', stiffness: 100 }}
              whileHover={!hasAnswered ? { scale: 1.02, x: 8, transition: { type: 'spring', stiffness: 400 } } : {}}
              whileTap={!hasAnswered ? { scale: 0.98 } : {}}
              className={`relative w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 overflow-hidden ${optionStyle} ${
                hasAnswered ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              {/* Shimmer effect on hover */}
              {!hasAnswered && !isSelected && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              )}

              {/* Option letter badge */}
              <motion.div
                className={`shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all ${iconBg}`}
                animate={
                  showResult && isCorrectOption
                    ? {
                        scale: [1, 1.2, 1],
                        transition: { duration: 0.4 },
                      }
                    : {}
                }
              >
                {showResult && isCorrectOption ? (
                  <CheckCircle size={24} />
                ) : showResult && isSelected && !isCorrectOption ? (
                  <XCircle size={24} />
                ) : (
                  optionLetters[index]
                )}
              </motion.div>

              {/* Option text */}
              <span
                className={`flex-1 text-left text-base sm:text-lg ${
                  showResult
                    ? isCorrectOption
                      ? 'text-green-300 font-medium'
                      : isSelected
                      ? 'text-red-300'
                      : 'text-gray-400'
                    : optionStyles.text
                }`}
              >
                {option}
              </span>

              {/* Selection indicator */}
              {isSelected && !showResult && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <div className="w-3 h-3 rounded-full bg-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && currentQuestion.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Lightbulb
                  size={20}
                  className="text-secondary shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-secondary mb-1">
                    {t('quiz.explanation')}
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      <div className="flex justify-center mt-8">
        {!hasAnswered ? (
          <motion.button
            onClick={checkAnswer}
            disabled={selectedOption === null}
            className={`flex items-center gap-2 px-8 py-3 font-semibold rounded-xl transition-all ${
              selectedOption !== null
                ? 'bg-secondary hover:bg-secondary/90 text-primary'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={selectedOption !== null ? { scale: 1.02 } : {}}
            whileTap={selectedOption !== null ? { scale: 0.98 } : {}}
          >
            {t('check')}
          </motion.button>
        ) : (
          <motion.button
            onClick={handleNext}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-8 py-3 font-semibold rounded-xl bg-secondary hover:bg-secondary/90 text-primary transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {currentIndex < questions.length - 1 ? (
              <>
                {t('quiz.next')}
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                {t('quiz.finish')}
                <Sparkles size={18} />
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Feedback overlay */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`p-6 rounded-full ${
                isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
              } backdrop-blur-sm`}
            >
              {isCorrect ? (
                <CheckCircle size={64} className="text-green-400" />
              ) : (
                <XCircle size={64} className="text-red-400" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
