// src/components/exercises/ExercisesExpandable.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Gamepad2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';
import DragWordExercise from './DragWordExercise';
import type { Animation } from '@/hooks/queries/useLesson';

interface ExercisesExpandableProps {
  animations: Animation[];
}

type ExerciseStatus = 'locked' | 'available' | 'completed';

interface ExerciseState {
  animationId: string;
  status: ExerciseStatus;
  score?: number;
}

export default function ExercisesExpandable({
  animations,
}: ExercisesExpandableProps) {
  const t = useTranslations('Lesson.exercises');

  // Expanded state
  const [isExpanded, setIsExpanded] = useState(false);

  // Active exercise
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  // Exercise states
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(() =>
    animations.map(anim => ({
      animationId: anim.id,
      status: anim.enabled ? 'available' : 'locked',
    }))
  );

  // Sort animations by order
  const sortedAnimations = useMemo(
    () => [...animations].sort((a, b) => a.order - b.order),
    [animations]
  );

  // Get active animation
  const activeAnimation = useMemo(
    () => sortedAnimations.find(a => a.id === activeExerciseId),
    [sortedAnimations, activeExerciseId]
  );

  // Count available and completed
  const availableCount = exerciseStates.filter(e => e.status === 'available').length;
  const completedCount = exerciseStates.filter(e => e.status === 'completed').length;

  // Handle exercise completion
  const handleExerciseComplete = useCallback((animationId: string, success: boolean, score: number) => {
    setExerciseStates(prev =>
      prev.map(e =>
        e.animationId === animationId
          ? { ...e, status: 'completed' as ExerciseStatus, score }
          : e
      )
    );
    setActiveExerciseId(null);
  }, []);

  // Handle start exercise
  const handleStartExercise = useCallback((animationId: string) => {
    const state = exerciseStates.find(e => e.animationId === animationId);
    if (state?.status === 'locked') return;

    setActiveExerciseId(animationId);
  }, [exerciseStates]);

  // Get exercise type label
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'CompleteSentence':
        return t('types.completeSentence');
      case 'MultipleChoice':
        return t('types.multipleChoice');
      default:
        return type;
    }
  };

  // Get game type label
  const getGameTypeLabel = (gameType?: string): string => {
    switch (gameType) {
      case 'DRAG_WORD':
        return t('gameTypes.dragWord');
      case 'FILL_BLANK':
        return t('gameTypes.fillBlank');
      case 'SELECT_OPTION':
        return t('gameTypes.selectOption');
      default:
        return '';
    }
  };

  if (!sortedAnimations.length) return null;

  return (
    <div className="mt-6 border border-gray-700/50 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900/50 to-primary/30">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Gamepad2 size={24} className="text-green-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {t('title')}
              {completedCount > 0 && (
                <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  <Sparkles size={12} />
                  {completedCount}/{sortedAnimations.length}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-400">{t('expandToStart')}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <span className="text-green-400">{availableCount} {t('available')}</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={24} className="text-gray-400" />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 border-t border-gray-700/50">
              {/* Exercise selector - when no active exercise */}
              {!activeExerciseId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 mt-4"
                >
                  {sortedAnimations.map(animation => {
                    const state = exerciseStates.find(e => e.animationId === animation.id);
                    const isLocked = state?.status === 'locked';
                    const isCompleted = state?.status === 'completed';

                    return (
                      <motion.button
                        key={animation.id}
                        onClick={() => handleStartExercise(animation.id)}
                        disabled={isLocked}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                          isLocked
                            ? 'bg-gray-800/30 cursor-not-allowed opacity-50'
                            : isCompleted
                            ? 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/20'
                            : 'bg-gray-800/50 hover:bg-secondary/20 hover:border-secondary/30 border border-transparent'
                        }`}
                        whileHover={!isLocked ? { scale: 1.01 } : {}}
                        whileTap={!isLocked ? { scale: 0.99 } : {}}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isLocked
                            ? 'bg-gray-700/50'
                            : isCompleted
                            ? 'bg-green-500/20'
                            : 'bg-secondary/20'
                        }`}>
                          {isLocked ? (
                            <Lock size={20} className="text-gray-500" />
                          ) : isCompleted ? (
                            <CheckCircle size={20} className="text-green-400" />
                          ) : (
                            <PlayCircle size={20} className="text-secondary" />
                          )}
                        </div>

                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              {getTypeLabel(animation.type)}
                            </span>
                            {animation.content?.gameType && (
                              <span className="text-xs text-gray-500">
                                {getGameTypeLabel(animation.content.gameType)}
                              </span>
                            )}
                          </div>
                          <p className={`font-medium ${
                            isLocked ? 'text-gray-500' : isCompleted ? 'text-green-400' : 'text-white'
                          }`}>
                            {t('exercise', { number: animation.order })}
                          </p>
                          {isCompleted && state?.score !== undefined && (
                            <p className="text-xs text-green-400/70 mt-1">
                              {t('score')}: {state.score}/{animation.content?.sentences?.length || 1}
                            </p>
                          )}
                        </div>

                        {!isLocked && !isCompleted && (
                          <ChevronUp size={20} className="text-gray-400 rotate-90" />
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {/* Active exercise */}
              {activeExerciseId && activeAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-4"
                >
                  {/* Back button */}
                  <button
                    onClick={() => setActiveExerciseId(null)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                  >
                    <ChevronUp size={18} className="-rotate-90" />
                    <span>{t('backToList')}</span>
                  </button>

                  {/* Exercise content */}
                  {activeAnimation.content?.gameType === 'DRAG_WORD' && (
                    <DragWordExercise
                      sentences={activeAnimation.content.sentences}
                      distractors={activeAnimation.content.distractors}
                      onComplete={(success, score) =>
                        handleExerciseComplete(activeAnimation.id, success, score)
                      }
                    />
                  )}

                  {/* Placeholder for other game types */}
                  {activeAnimation.content?.gameType &&
                   activeAnimation.content.gameType !== 'DRAG_WORD' && (
                    <div className="text-center py-12 text-gray-400">
                      <Gamepad2 size={48} className="mx-auto mb-4 opacity-50" />
                      <p>{t('comingSoon')}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
