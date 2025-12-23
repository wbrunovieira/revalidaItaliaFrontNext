// src/components/exercises/DragWordExercise.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export default function DragWordExercise({
  sentences,
  distractors,
  onComplete,
}: DragWordExerciseProps) {
  const t = useTranslations('Lesson.exercises');

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

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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

  // Handle word selection
  const handleWordSelect = useCallback((option: WordOption) => {
    if (showFeedback || option.isUsed) return;

    setSelectedWord(option);
    setWordOptions(prev =>
      prev.map(w => ({
        ...w,
        isUsed: w.id === option.id ? true : w.isUsed,
      }))
    );
  }, [showFeedback]);

  // Handle word removal from blank
  const handleRemoveWord = useCallback(() => {
    if (showFeedback || !selectedWord) return;

    setWordOptions(prev =>
      prev.map(w => ({
        ...w,
        isUsed: w.id === selectedWord.id ? false : w.isUsed,
      }))
    );
    setSelectedWord(null);
  }, [showFeedback, selectedWord]);

  // Check answer
  const handleCheckAnswer = useCallback(() => {
    if (!selectedWord) return;

    const correct = selectedWord.isCorrect;
    setIsCorrect(correct);
    setShowFeedback(true);

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
            .map(word => ({
              id: `${word}-${Math.random()}`,
              word,
              isCorrect: word === correctWord,
              isUsed: false,
            }))
            .sort(() => Math.random() - 0.5)
        );
      } else {
        // Exercise complete
        onComplete?.(score + (correct ? 1 : 0) === sentences.length, score + (correct ? 1 : 0));
      }
    }, 1500);
  }, [selectedWord, currentIndex, sentences, distractors, score, onComplete]);

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
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {t('question')} {currentIndex + 1} {t('of')} {sentences.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Sparkles size={16} className="text-yellow-400" />
            <span className="text-sm font-medium text-white">{score}</span>
          </div>
          <button
            onClick={handleReset}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title={t('reset')}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
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
        className="text-center mb-8"
      >
        <p className="text-xl md:text-2xl text-white leading-relaxed">
          <span>{sentenceParts.before}</span>

          {/* Blank / Selected word */}
          <motion.span
            onClick={handleRemoveWord}
            className={`inline-flex items-center justify-center min-w-[120px] mx-1 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
              selectedWord
                ? showFeedback
                  ? isCorrect
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-secondary/20 border-secondary text-white'
                : 'bg-gray-700/50 border-gray-500 text-gray-400'
            }`}
            whileHover={!showFeedback && selectedWord ? { scale: 1.02 } : {}}
            whileTap={!showFeedback && selectedWord ? { scale: 0.98 } : {}}
          >
            {selectedWord ? (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-semibold"
              >
                {selectedWord.word}
              </motion.span>
            ) : (
              <span className="text-sm">{t('dropHere')}</span>
            )}
          </motion.span>

          <span>{sentenceParts.after}</span>
        </p>
      </motion.div>

      {/* Word options */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <AnimatePresence mode="popLayout">
          {wordOptions.map(option => (
            <motion.button
              key={option.id}
              onClick={() => handleWordSelect(option)}
              disabled={option.isUsed || showFeedback}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                option.isUsed
                  ? 'opacity-30 cursor-not-allowed bg-gray-700 text-gray-500'
                  : 'bg-gradient-to-br from-gray-700 to-gray-800 text-white hover:from-secondary/30 hover:to-secondary/20 hover:shadow-lg hover:shadow-secondary/20 cursor-grab active:cursor-grabbing'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={!option.isUsed && !showFeedback ? { scale: 1.05, y: -2 } : {}}
              whileTap={!option.isUsed && !showFeedback ? { scale: 0.95 } : {}}
              layout
            >
              <GripHorizontal size={14} className="text-gray-400" />
              {option.word}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Check button */}
      <div className="flex justify-center">
        <motion.button
          onClick={handleCheckAnswer}
          disabled={!selectedWord || showFeedback}
          className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all ${
            selectedWord && !showFeedback
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/30'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
          whileHover={selectedWord && !showFeedback ? { scale: 1.02 } : {}}
          whileTap={selectedWord && !showFeedback ? { scale: 0.98 } : {}}
        >
          {t('check')}
        </motion.button>
      </div>

      {/* Feedback overlay */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm`}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className={`p-8 rounded-2xl ${
                isCorrect
                  ? 'bg-gradient-to-br from-green-600 to-emerald-700'
                  : 'bg-gradient-to-br from-red-600 to-rose-700'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  {isCorrect ? (
                    <CheckCircle size={64} className="text-white" />
                  ) : (
                    <XCircle size={64} className="text-white" />
                  )}
                </motion.div>
                <h3 className="text-2xl font-bold text-white">
                  {isCorrect ? t('correct') : t('incorrect')}
                </h3>
                {!isCorrect && (
                  <p className="text-white/80">
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
