// src/components/exercises/DragWordExercise.tsx
'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  GripHorizontal,
} from 'lucide-react';
import type { AnimationSentence } from '@/hooks/queries/useLesson';

interface DragWordExerciseProps {
  sentences: AnimationSentence[];
  distractors: string[];
  onComplete?: (success: boolean, score: number) => void;
}

interface WordOption {
  id: string;
  word: string;
  isCorrect: boolean;
  isUsed: boolean;
}

// Haptic feedback utility
const triggerHapticFeedback = (type: 'success' | 'error' | 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    switch (type) {
      case 'success':
        // Short double vibration for success
        navigator.vibrate([50, 50, 50]);
        break;
      case 'error':
        // Longer vibration pattern for error
        navigator.vibrate([100, 50, 100, 50, 100]);
        break;
      case 'light':
        // Light tap
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

export default function DragWordExercise({
  sentences,
  distractors,
  onComplete,
}: DragWordExerciseProps) {
  const t = useTranslations('Lesson.exercises');
  const dropZoneControls = useAnimation();

  // Detect if touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Current sentence index
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSentence = sentences[currentIndex];

  // Word options (correct + distractors shuffled)
  const [wordOptions, setWordOptions] = useState<WordOption[]>(() => {
    const correctWord = currentSentence?.targetWord || '';
    const allWords = [correctWord, ...distractors];

    // Shuffle words
    const shuffled = allWords
      .map(word => ({
        id: `${word}-${Math.random()}`,
        word,
        isCorrect: word === correctWord,
        isUsed: false,
      }))
      .sort(() => Math.random() - 0.5);

    return shuffled;
  });

  // Selected word in the blank
  const [selectedWord, setSelectedWord] = useState<WordOption | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const draggedWordRef = useRef<WordOption | null>(null);

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Score tracking
  const [score, setScore] = useState(0);

  // Split sentence into parts (before and after target word)
  const sentenceParts = useMemo(() => {
    if (!currentSentence) return { before: '', after: '' };

    const { fullSentence, targetWord } = currentSentence;

    if (!targetWord) {
      return { before: fullSentence, after: '' };
    }

    const wordIndex = fullSentence.toLowerCase().indexOf(targetWord.toLowerCase());

    if (wordIndex === -1) {
      return { before: fullSentence, after: '' };
    }

    return {
      before: fullSentence.substring(0, wordIndex),
      after: fullSentence.substring(wordIndex + targetWord.length),
    };
  }, [currentSentence]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, option: WordOption) => {
    if (showFeedback || option.isUsed) {
      e.preventDefault();
      return;
    }

    draggedWordRef.current = option;
    setIsDragging(true);

    // Set drag data
    e.dataTransfer.setData('text/plain', option.id);
    e.dataTransfer.effectAllowed = 'move';

    // Add drag image styling
    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  }, [showFeedback]);

  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    setIsDragOver(false);
    draggedWordRef.current = null;

    // Reset opacity
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  }, []);

  // Handle drag over on drop zone
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  // Handle drag leave on drop zone
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  // Check answer and show feedback (local validation only, API call happens on complete)
  const checkAnswer = useCallback((word: WordOption) => {
    const correct = word.isCorrect;
    setIsCorrect(correct);
    setShowFeedback(true);

    // Trigger haptic feedback
    if (correct) {
      triggerHapticFeedback('success');
    } else {
      triggerHapticFeedback('error');
      // Trigger shake animation on drop zone
      dropZoneControls.start('shake');
    }

    if (correct) {
      setScore(prev => prev + 1);
    }

    // Auto-advance after feedback
    setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        // Next sentence
        setCurrentIndex(prev => prev + 1);
        setShowFeedback(false);
        setSelectedWord(null);

        // Reset word options for next sentence
        const nextSentence = sentences[currentIndex + 1];
        const correctWord = nextSentence?.targetWord || '';
        const allWords = [correctWord, ...distractors];

        setWordOptions(
          allWords
            .map(w => ({
              id: `${w}-${Math.random()}`,
              word: w,
              isCorrect: w === correctWord,
              isUsed: false,
            }))
            .sort(() => Math.random() - 0.5)
        );
      } else {
        // Exercise complete - notify parent (API call happens there)
        const finalScore = score + (correct ? 1 : 0);
        onComplete?.(finalScore === sentences.length, finalScore);
      }
    }, 1500);
  }, [currentIndex, sentences, distractors, score, onComplete, dropZoneControls]);

  // Handle drop on drop zone
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsDragging(false);

    const droppedWord = draggedWordRef.current;
    if (!droppedWord || showFeedback) return;

    // If there's already a selected word, put it back
    if (selectedWord) {
      setWordOptions(prev =>
        prev.map(w => ({
          ...w,
          isUsed: w.id === selectedWord.id ? false : w.isUsed,
        }))
      );
    }

    // Set the new word and mark as used
    setSelectedWord(droppedWord);
    setWordOptions(prev =>
      prev.map(w => ({
        ...w,
        isUsed: w.id === droppedWord.id ? true : w.isUsed,
      }))
    );

    draggedWordRef.current = null;

    // Auto-check after a brief moment for visual feedback
    setTimeout(() => {
      checkAnswer(droppedWord);
    }, 300);
  }, [showFeedback, selectedWord, checkAnswer]);

  // Handle word selection (click/tap)
  const handleWordSelect = useCallback((option: WordOption) => {
    if (showFeedback || option.isUsed) return;

    // Light haptic on tap
    triggerHapticFeedback('light');

    // If there's already a selected word, put it back
    if (selectedWord) {
      setWordOptions(prev =>
        prev.map(w => ({
          ...w,
          isUsed: w.id === selectedWord.id ? false : w.isUsed,
        }))
      );
    }

    setSelectedWord(option);
    setWordOptions(prev =>
      prev.map(w => ({
        ...w,
        isUsed: w.id === option.id ? true : w.isUsed,
      }))
    );

    // Auto-check after a brief moment for visual feedback
    setTimeout(() => {
      checkAnswer(option);
    }, 300);
  }, [showFeedback, selectedWord, checkAnswer]);

  // Reset exercise
  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setScore(0);
    setShowFeedback(false);
    setSelectedWord(null);

    const correctWord = sentences[0]?.targetWord || '';
    const allWords = [correctWord, ...distractors];

    setWordOptions(
      allWords
        .map(word => ({
          id: `${word}-${Math.random()}`,
          word,
          isCorrect: word === correctWord,
          isUsed: false,
        }))
        .sort(() => Math.random() - 0.5)
    );
  }, [sentences, distractors]);

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

      {/* Sentence with blank */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6 sm:mb-8"
      >
        <p className="text-lg sm:text-xl md:text-2xl text-white leading-relaxed">
          <span>{sentenceParts.before}</span>

          {/* Drop zone / Selected word with shake animation */}
          <motion.span
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            variants={shakeAnimation}
            animate={dropZoneControls}
            className={`inline-flex items-center justify-center min-w-[100px] sm:min-w-[120px] mx-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 transition-all ${
              selectedWord
                ? showFeedback
                  ? isCorrect
                    ? 'bg-green-500/20 border-green-500 text-green-400 border-solid'
                    : 'bg-red-500/20 border-red-500 text-red-400 border-solid'
                  : 'bg-secondary/20 border-secondary text-white border-solid'
                : isDragOver
                ? 'bg-secondary/30 border-secondary border-solid scale-105'
                : isDragging
                ? 'bg-gray-600/50 border-secondary/50 border-dashed animate-pulse'
                : 'bg-gray-700/50 border-gray-500 border-dashed text-gray-400'
            }`}
          >
            {selectedWord ? (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-semibold text-sm sm:text-base"
              >
                {selectedWord.word}
              </motion.span>
            ) : (
              <span className="text-xs sm:text-sm">
                {isDragOver ? '🎯' : t('dropHere')}
              </span>
            )}
          </motion.span>

          <span>{sentenceParts.after}</span>
        </p>
      </motion.div>

      {/* Instruction for mobile */}
      {isTouchDevice && (
        <p className="text-center text-xs text-gray-500 mb-4">
          {t('tapToSelect')}
        </p>
      )}

      {/* Word options */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <AnimatePresence mode="popLayout">
          {wordOptions.map(option => (
            <motion.div
              key={option.id}
              draggable={!option.isUsed && !showFeedback && !isTouchDevice}
              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, option)}
              onDragEnd={(e) => handleDragEnd(e as unknown as React.DragEvent)}
              onClick={() => handleWordSelect(option)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all select-none touch-manipulation ${
                option.isUsed
                  ? 'opacity-30 cursor-not-allowed bg-gray-700 text-gray-500'
                  : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white hover:from-secondary/30 hover:to-secondary/20 hover:shadow-lg hover:shadow-secondary/20 cursor-pointer active:scale-95'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={!option.isUsed && !showFeedback ? { scale: 1.05, y: -2 } : {}}
              whileTap={!option.isUsed && !showFeedback ? { scale: 0.95 } : {}}
              layout
            >
              {/* Hide grip icon on touch devices */}
              {!isTouchDevice && (
                <GripHorizontal size={14} className="text-gray-400 hidden sm:block" />
              )}
              <span className="text-sm sm:text-base">{option.word}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
